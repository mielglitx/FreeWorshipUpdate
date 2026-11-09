const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

function getGitToken() {
  try {
    const out = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n',
      encoding: 'utf-8',
    });
    for (const line of out.split('\n')) {
      if (line.startsWith('password=')) {
        return line.substring('password='.length).trim();
      }
    }
  } catch (err) {
    console.error('Failed to get git token:', err.message);
  }
  return null;
}

const token = getGitToken();
if (!token) {
  console.error('No GitHub token found!');
  process.exit(1);
}

const REPO_OWNER = 'mielglitx';
const REPO_NAME = 'FreeWorshipUpdate';
const TAG_NAME = 'v1.1.7';
const RELEASE_TITLE = 'FreeWorship v1.1.7 - Bulletproof Android ↔ Windows LAN Sync, Wi-Fi Auto-Discovery & Network Security Config';

const RELEASE_BODY = `## FreeWorship v1.1.7 Update

### 🚀 Highlights & Major Features
- **Android Cleartext Traffic & Security Config**: Added explicit Android network security configuration (\`network_security_config.xml\`) and WebView Mixed Content Mode (\`MIXED_CONTENT_ALWAYS_ALLOW\`), completely resolving the Android 9+ system-level silent blocking of local HTTP connections.
- **Native Wi-Fi Subnet Detection & Zero-Guesswork Auto-Discovery**: Android app now uses a native network plugin to read the device's actual Wi-Fi IPv4 address directly from the hardware network interface (detecting subnets like TP-Link Deco \`192.168.68.x\`, PLDT \`192.168.254.x\` / \`192.168.1.x\`, Globe \`192.168.100.x\`, mobile hotspots, etc.), concurrently scanning both ports 5174 and 5173 with priority DHCP ranges in under 2 seconds.
- **Dual-Port Windows LAN Server (5174 & 5173) & Resilient Host Normalization**: Windows desktop app now listens simultaneously on port 5174 and alias port 5173 with universal CORS headers (\`*\`). Manual IP connection now automatically normalizes raw IPs, full URLs (e.g. \`http://.../api/lan-sync\`), and missing ports with instant visual status feedback ("Connecting...", "Connected!", or diagnostics).
- **Operator Android Remote Header Bar & Windows Firewall Helper**: Added an "Android Remote" button in the Windows top header displaying the active LAN IP (e.g. \`192.168.68.130:5174\`) and connected device count with 1-click copy, connection guide, and a 1-click Windows Firewall rule helper.

### 📥 Direct Downloads
- **Windows Setup Installer**: [FreeWorship Studio-Setup-1.1.7.exe](https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.7/FreeWorship.Studio-Setup-1.1.7.exe)
- **Windows Portable**: [FreeWorship Studio-Portable-1.1.7.exe](https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.7/FreeWorship.Studio-Portable-1.1.7.exe)
- **Android Remote APK**: [FreeWorship-StageController.apk](https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.7/FreeWorship-StageController.apk)
`;

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: body ? JSON.parse(body) : null });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      if (Buffer.isBuffer(data) || typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }
    req.end();
  });
}

function uploadAsset(uploadUrl, filePath, assetName, contentType) {
  return new Promise((resolve, reject) => {
    const stat = fs.statSync(filePath);
    const urlObj = new URL(uploadUrl.replace(/\{[^\}]+\}/g, ''));
    urlObj.searchParams.set('name', assetName);

    console.log(`Uploading ${assetName} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);

    const req = https.request(
      urlObj,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'FreeWorship-Release-Publisher',
          'Content-Type': contentType,
          'Content-Length': stat.size,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✓ Uploaded ${assetName} successfully!`);
            resolve();
          } else {
            console.error(`Upload error for ${assetName}:`, res.statusCode, body);
            reject(new Error(`Failed to upload ${assetName}: ${res.statusCode} ${body}`));
          }
        });
      }
    );

    req.on('error', reject);

    const stream = fs.createReadStream(filePath);
    let bytesSent = 0;
    stream.on('data', (chunk) => {
      bytesSent += chunk.length;
      process.stdout.write(`\r  > ${(bytesSent / 1024 / 1024).toFixed(1)} / ${(stat.size / 1024 / 1024).toFixed(1)} MB (${Math.round((bytesSent / stat.size) * 100)}%)`);
    });
    stream.on('end', () => {
      console.log('');
    });
    stream.pipe(req);
  });
}

async function main() {
  console.log(`Checking if release ${TAG_NAME} exists...`);
  let release = null;
  const getRes = await request({
    hostname: 'api.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/tags/${TAG_NAME}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'FreeWorship-Release-Publisher',
      Accept: 'application/vnd.github+json',
    },
  });

  if (getRes.status === 200 && getRes.data) {
    release = getRes.data;
    console.log(`Found existing release: ${release.name} (id: ${release.id})`);
  } else {
    console.log(`Creating new release for ${TAG_NAME}...`);
    const createRes = await request(
      {
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'FreeWorship-Release-Publisher',
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
      },
      {
        tag_name: TAG_NAME,
        name: RELEASE_TITLE,
        body: RELEASE_BODY,
        draft: false,
        prerelease: false,
      }
    );
    if (createRes.status !== 201 && createRes.status !== 200) {
      console.error('Failed to create release:', createRes.status, createRes.data);
      process.exit(1);
    }
    release = createRes.data;
    console.log(`Created release successfully: ${release.name} (id: ${release.id})`);
  }

  // Delete existing matching assets if any so we can re-upload fresh
  const existingAssets = release.assets || [];
  const filesToUpload = [
    {
      filePath: path.resolve(__dirname, '../release/FreeWorship Studio-Setup-1.1.7.exe'),
      name: 'FreeWorship.Studio-Setup-1.1.7.exe',
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    {
      filePath: path.resolve(__dirname, '../release/FreeWorship Studio-Portable-1.1.7.exe'),
      name: 'FreeWorship.Studio-Portable-1.1.7.exe',
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    {
      filePath: path.resolve(__dirname, '../public/FreeWorship-StageController.apk'),
      name: 'FreeWorship-StageController.apk',
      contentType: 'application/vnd.android.package-archive',
    },
  ];

  for (const file of filesToUpload) {
    const existing = existingAssets.find((a) => a.name === file.name);
    if (existing) {
      console.log(`Deleting existing asset ${file.name} (id: ${existing.id})...`);
      await request({
        hostname: 'api.github.com',
        path: `/repos/${REPO_OWNER}/${REPO_NAME}/releases/assets/${existing.id}`,
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'FreeWorship-Release-Publisher',
        },
      });
    }

    if (fs.existsSync(file.filePath)) {
      await uploadAsset(release.upload_url, file.filePath, file.name, file.contentType);
    } else {
      console.warn(`File not found: ${file.filePath}`);
    }
  }

  console.log('\nAll release assets uploaded successfully to GitHub!');
}

main().catch((err) => {
  console.error('Publish error:', err);
  process.exit(1);
});
