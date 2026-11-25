package com.freeworship.stagecontroller;

import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ExecutorService scanExecutor = Executors.newSingleThreadExecutor();

    private static class WifiNetDetails {
        String ip;
        int prefixLength = 24;
    }

    private WifiNetDetails resolveActiveWifiDetails() {
        WifiNetDetails details = new WifiNetDetails();
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Network[] networks = cm.getAllNetworks();
                for (Network net : networks) {
                    NetworkCapabilities caps = cm.getNetworkCapabilities(net);
                    if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
                        LinkProperties lp = cm.getLinkProperties(net);
                        if (lp != null) {
                            for (LinkAddress la : lp.getLinkAddresses()) {
                                InetAddress addr = la.getAddress();
                                if (addr instanceof Inet4Address && !addr.isLoopbackAddress()) {
                                    String sAddr = addr.getHostAddress();
                                    if (sAddr != null && !sAddr.startsWith("127.")) {
                                        details.ip = sAddr;
                                        details.prefixLength = la.getPrefixLength();
                                        return details;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {}

        try {
            WifiManager wm = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                WifiInfo wifiInfo = wm.getConnectionInfo();
                if (wifiInfo != null) {
                    int ipInt = wifiInfo.getIpAddress();
                    if (ipInt != 0) {
                        details.ip = String.format("%d.%d.%d.%d",
                                (ipInt & 0xff),
                                (ipInt >> 8 & 0xff),
                                (ipInt >> 16 & 0xff),
                                (ipInt >> 24 & 0xff));
                        return details;
                    }
                }
            }
        } catch (Exception ignored) {}

        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            for (NetworkInterface intf : interfaces) {
                if (intf.isLoopback() || !intf.isUp()) continue;
                String name = intf.getName().toLowerCase();
                if (name.contains("rmnet") || name.contains("ccmni") || name.contains("pdp") || name.contains("tun")) {
                    continue;
                }
                if (name.contains("wlan") || name.contains("wifi") || name.contains("ap") || name.contains("eth")) {
                    for (InetAddress addr : Collections.list(intf.getInetAddresses())) {
                        if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                            String sAddr = addr.getHostAddress();
                            if (sAddr != null && !sAddr.startsWith("127.")) {
                                details.ip = sAddr;
                                return details;
                            }
                        }
                    }
                }
            }
        } catch (Exception ignored) {}

        return details;
    }

    private boolean isTcpPortOpen(String ip, int port, int timeoutMs) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(ip, port), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean verifyFreeWorshipHttp(String ip, int port, int timeoutMs) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL("http://" + ip + ":" + port + "/api/lan-info");
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(timeoutMs);
            conn.setReadTimeout(timeoutMs);
            conn.setRequestMethod("GET");
            if (conn.getResponseCode() == 200) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = br.readLine()) != null) {
                        sb.append(line);
                    }
                    String body = sb.toString();
                    return body.contains("FreeWorship") || body.contains("\"ok\":true");
                }
            }
        } catch (Exception ignored) {
        } finally {
            if (conn != null) conn.disconnect();
        }
        return false;
    }

    private String checkHostPorts(String ip, int tcpTimeoutMs) {
        if (isTcpPortOpen(ip, 5174, tcpTimeoutMs) && verifyFreeWorshipHttp(ip, 5174, 650)) {
            return ip + ":5174";
        }
        if (isTcpPortOpen(ip, 5173, tcpTimeoutMs) && verifyFreeWorshipHttp(ip, 5173, 650)) {
            return ip + ":5173";
        }
        return null;
    }

    @PluginMethod
    public void getDeviceWifiIp(PluginCall call) {
        JSObject ret = new JSObject();
        WifiNetDetails details = resolveActiveWifiDetails();
        ret.put("ip", details.ip);
        ret.put("prefixLength", details.prefixLength);
        call.resolve(ret);
    }

    @PluginMethod
    public void scanForPcHosts(PluginCall call) {
        String preferredHost = call.getString("preferredHost", "");
        scanExecutor.execute(() -> {
            JSObject result = new JSObject();
            WifiNetDetails wifiDetails = resolveActiveWifiDetails();
            String deviceIp = wifiDetails.ip;
            result.put("deviceWifiIp", deviceIp);
            result.put("prefixLength", wifiDetails.prefixLength);

            List<String> verifiedHosts = new ArrayList<>();

            try {
                // 1. Direct check on previously entered/saved IP
                if (preferredHost != null && !preferredHost.trim().isEmpty()) {
                    String cleanPref = preferredHost.trim()
                            .replaceFirst("^https?://", "")
                            .split("/")[0]
                            .split(":")[0];
                    if (cleanPref.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
                        String directHit = checkHostPorts(cleanPref, 450);
                        if (directHit != null) {
                            verifiedHosts.add(directHit);
                            result.put("foundHost", directHit);
                            result.put("foundHosts", new JSArray(verifiedHosts));
                            result.put("method", "direct-saved");
                            call.resolve(result);
                            return;
                        }
                    }
                }

                // 2. Instant UDP Broadcast Discovery (Port 41234)
                try (DatagramSocket udp = new DatagramSocket()) {
                    udp.setBroadcast(true);
                    udp.setSoTimeout(450);
                    byte[] probeData = "FREEWORSHIP_DISCOVER".getBytes(StandardCharsets.UTF_8);

                    Set<String> broadcastTargets = new LinkedHashSet<>();
                    broadcastTargets.add("255.255.255.255");
                    if (deviceIp != null && deviceIp.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
                        String[] parts = deviceIp.split("\\.");
                        broadcastTargets.add(parts[0] + "." + parts[1] + "." + parts[2] + ".255");
                    }

                    for (String bAddr : broadcastTargets) {
                        try {
                            DatagramPacket p = new DatagramPacket(
                                    probeData,
                                    probeData.length,
                                    InetAddress.getByName(bAddr),
                                    41234
                            );
                            udp.send(p);
                        } catch (Exception ignored) {}
                    }

                    long endWait = System.currentTimeMillis() + 500;
                    byte[] buf = new byte[2048];
                    while (System.currentTimeMillis() < endWait) {
                        try {
                            DatagramPacket recv = new DatagramPacket(buf, buf.length);
                            udp.receive(recv);
                            String msg = new String(recv.getData(), 0, recv.getLength(), StandardCharsets.UTF_8).trim();
                            if (msg.contains("FreeWorship")) {
                                List<String> candidateIps = new ArrayList<>();
                                int port = 5174;
                                try {
                                    JSONObject json = new JSONObject(msg);
                                    port = json.optInt("port", 5174);
                                    JSONArray ipsArr = json.optJSONArray("ips");
                                    if (ipsArr != null) {
                                        for (int i = 0; i < ipsArr.length(); i++) {
                                            String ipStr = ipsArr.optString(i, "");
                                            if (!ipStr.isEmpty() && !"127.0.0.1".equals(ipStr)) {
                                                candidateIps.add(ipStr);
                                            }
                                        }
                                    }
                                } catch (Exception ignored) {}
                                String senderIp = recv.getAddress().getHostAddress();
                                if (senderIp != null && !candidateIps.contains(senderIp)) {
                                    candidateIps.add(0, senderIp);
                                }
                                for (String cIp : candidateIps) {
                                    if (verifyFreeWorshipHttp(cIp, port, 650)) {
                                        String hit = cIp + ":" + port;
                                        if (!verifiedHosts.contains(hit)) verifiedHosts.add(hit);
                                    } else {
                                        String hit = checkHostPorts(cIp, 450);
                                        if (hit != null && !verifiedHosts.contains(hit)) verifiedHosts.add(hit);
                                    }
                                }
                                if (!verifiedHosts.isEmpty()) {
                                    result.put("foundHost", verifiedHosts.get(0));
                                    result.put("foundHosts", new JSArray(verifiedHosts));
                                    result.put("method", "udp-discovery");
                                    call.resolve(result);
                                    return;
                                }
                            }
                        } catch (Exception timeoutOrErr) {
                            break;
                        }
                    }
                } catch (Exception ignored) {}

                // 3. Multi-threaded Native Java Subnet TCP+HTTP Scan (immune to WebView limits)
                Set<String> prefixes = new LinkedHashSet<>();
                if (deviceIp != null && deviceIp.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
                    String[] parts = deviceIp.split("\\.");
                    int third = Integer.parseInt(parts[2]);
                    String base2 = parts[0] + "." + parts[1] + ".";
                    prefixes.add(base2 + third);

                    // Support wider /22 or /23 mesh router subnets (e.g. UniFi / TP-Link Deco)
                    if (wifiDetails.prefixLength >= 20 && wifiDetails.prefixLength < 24) {
                        int blockSize = 1 << (24 - wifiDetails.prefixLength);
                        int startThird = (third / blockSize) * blockSize;
                        for (int t = startThird; t < startThird + blockSize && t <= 255; t++) {
                            prefixes.add(base2 + t);
                        }
                    }
                }

                if (preferredHost != null && !preferredHost.isEmpty()) {
                    String cleanPref = preferredHost.trim().replaceFirst("^https?://", "").split("/")[0].split(":")[0];
                    if (cleanPref.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
                        String[] p = cleanPref.split("\\.");
                        prefixes.add(p[0] + "." + p[1] + "." + p[2]);
                    }
                }

                if (prefixes.isEmpty()) {
                    String[] defaults = {"192.168.1", "192.168.0", "192.168.68", "192.168.254", "192.168.100", "192.168.8", "192.168.43", "10.0.0"};
                    Collections.addAll(prefixes, defaults);
                }

                ExecutorService pool = Executors.newFixedThreadPool(64);
                try {
                    for (String prefix : prefixes) {
                        List<Callable<String>> tasks = new ArrayList<>();
                        for (int octet = 1; octet <= 254; octet++) {
                            final String targetIp = prefix + "." + octet;
                            if (targetIp.equals(deviceIp)) continue;
                            tasks.add(() -> checkHostPorts(targetIp, 350));
                        }

                        List<Future<String>> futures = pool.invokeAll(tasks);
                        for (Future<String> f : futures) {
                            try {
                                String hit = f.get();
                                if (hit != null && !verifiedHosts.contains(hit)) {
                                    verifiedHosts.add(hit);
                                }
                            } catch (Exception ignored) {}
                        }

                        if (!verifiedHosts.isEmpty()) {
                            result.put("foundHost", verifiedHosts.get(0));
                            result.put("foundHosts", new JSArray(verifiedHosts));
                            result.put("method", "native-subnet-scan");
                            call.resolve(result);
                            return;
                        }
                    }
                } finally {
                    pool.shutdownNow();
                }

                result.put("foundHost", null);
                result.put("foundHosts", new JSArray());
                result.put("method", "none");
                call.resolve(result);
            } catch (Exception e) {
                result.put("foundHost", null);
                result.put("foundHosts", new JSArray());
                result.put("error", e.getMessage());
                call.resolve(result);
            }
        });
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        boolean canInstall = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            canInstall = getContext().getPackageManager().canRequestPackageInstalls();
        }
        JSObject ret = new JSObject();
        ret.put("canInstall", canInstall);
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to open install permission settings: " + e.getMessage());
            }
        } else {
            call.resolve();
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        if (downloadUrl == null || downloadUrl.trim().isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        executor.execute(() -> {
            HttpURLConnection conn = null;
            InputStream in = null;
            FileOutputStream out = null;

            try {
                String currentUrl = downloadUrl.trim();
                int redirects = 0;

                // Follow HTTP/HTTPS redirects (GitHub releases redirect to AWS S3 CDN)
                while (redirects < 10) {
                    URL u = new URL(currentUrl);
                    conn = (HttpURLConnection) u.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setConnectTimeout(30000);
                    conn.setReadTimeout(60000);
                    conn.setRequestProperty("User-Agent", "FreeWorship-Android-Updater");
                    conn.connect();

                    int status = conn.getResponseCode();
                    if (status == HttpURLConnection.HTTP_MOVED_PERM
                            || status == HttpURLConnection.HTTP_MOVED_TEMP
                            || status == 307
                            || status == 308) {
                        String location = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (location != null && !location.isEmpty()) {
                            if (!location.startsWith("http")) {
                                URL prev = new URL(currentUrl);
                                currentUrl = new URL(prev, location).toString();
                            } else {
                                currentUrl = location;
                            }
                            redirects++;
                            continue;
                        }
                    }

                    if (status != HttpURLConnection.HTTP_OK) {
                        throw new Exception("Server returned HTTP " + status + " (" + conn.getResponseMessage() + ")");
                    }
                    break;
                }

                long totalBytes = conn.getContentLengthLong();
                in = conn.getInputStream();

                File cacheDir = getContext().getExternalCacheDir();
                if (cacheDir == null) {
                    cacheDir = getContext().getCacheDir();
                }
                File apkFile = new File(cacheDir, "FreeWorship-StageController.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                out = new FileOutputStream(apkFile);
                byte[] buffer = new byte[16384];
                long bytesRead = 0;
                int readLen;
                int lastReportedPercent = -1;

                while ((readLen = in.read(buffer)) != -1) {
                    out.write(buffer, 0, readLen);
                    bytesRead += readLen;

                    if (totalBytes > 0) {
                        int percent = (int) Math.min(100, Math.floor(((double) bytesRead / totalBytes) * 100));
                        if (percent != lastReportedPercent) {
                            lastReportedPercent = percent;
                            JSObject progress = new JSObject();
                            progress.put("percent", percent);
                            progress.put("bytesRead", bytesRead);
                            progress.put("totalBytes", totalBytes);
                            notifyListeners("downloadProgress", progress);
                        }
                    }
                }

                out.flush();
                out.close();
                out = null;

                // Final 100% notification
                JSObject finalProgress = new JSObject();
                finalProgress.put("percent", 100);
                finalProgress.put("bytesRead", bytesRead);
                finalProgress.put("totalBytes", bytesRead);
                notifyListeners("downloadProgress", finalProgress);

                // Launch package installer intent
                Context ctx = getContext();
                Uri apkUri = FileProvider.getUriForFile(
                        ctx,
                        ctx.getPackageName() + ".fileprovider",
                        apkFile
                );

                Intent installIntent = new Intent(Intent.ACTION_VIEW);
                installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                ctx.startActivity(installIntent);

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("path", apkFile.getAbsolutePath());
                call.resolve(res);

            } catch (Exception e) {
                JSObject errorEvt = new JSObject();
                errorEvt.put("error", e.getMessage());
                notifyListeners("downloadError", errorEvt);
                call.reject("APK Download/Install failed: " + e.getMessage(), e);
            } finally {
                try {
                    if (in != null) in.close();
                } catch (Exception ignored) {}
                try {
                    if (out != null) out.close();
                } catch (Exception ignored) {}
                if (conn != null) conn.disconnect();
            }
        });
    }
}
