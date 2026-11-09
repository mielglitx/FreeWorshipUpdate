package com.freeworship.stagecontroller;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.URL;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void getDeviceWifiIp(PluginCall call) {
        JSObject ret = new JSObject();
        try {
            List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
            String foundIp = null;
            // First pass: look specifically for wlan / wi-fi interfaces
            for (NetworkInterface intf : interfaces) {
                if (intf.isLoopback() || !intf.isUp()) continue;
                String name = intf.getName().toLowerCase();
                if (name.contains("wlan") || name.contains("wifi") || name.contains("ap") || name.contains("eth")) {
                    List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                    for (InetAddress addr : addrs) {
                        if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                            String sAddr = addr.getHostAddress();
                            if (sAddr != null && !sAddr.startsWith("127.")) {
                                foundIp = sAddr;
                                break;
                            }
                        }
                    }
                }
                if (foundIp != null) break;
            }

            // Fallback pass: any non-loopback IPv4 interface
            if (foundIp == null) {
                for (NetworkInterface intf : interfaces) {
                    if (intf.isLoopback() || !intf.isUp()) continue;
                    List<InetAddress> addrs = Collections.list(intf.getInetAddresses());
                    for (InetAddress addr : addrs) {
                        if (!addr.isLoopbackAddress() && addr instanceof Inet4Address) {
                            String sAddr = addr.getHostAddress();
                            if (sAddr != null && !sAddr.startsWith("127.")) {
                                foundIp = sAddr;
                                break;
                            }
                        }
                    }
                    if (foundIp != null) break;
                }
            }

            ret.put("ip", foundIp);
            call.resolve(ret);
        } catch (Exception e) {
            ret.put("ip", null);
            call.resolve(ret);
        }
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
