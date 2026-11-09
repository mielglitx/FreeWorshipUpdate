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
const TAG_NAME = 'v1.1.5';
const RELEASE_TITLE = 'FreeWorship v1.1.5 - 100% Built-in Offline 66-Book Bibles (KJV, NIV, NASB, ESV, MBB 1901) & Zero Internet Requirement';

const RELEASE_BODY = `## FreeWorship v1.1.5 Update

### 🚀 Highlights & Major Features
- **100% Pre-bundled Offline Bibles (Zero Internet Required)**: All 5 sanctuary standard translations (**KJV**, **NIV**, **NASB**, **ESV**, and **MBB 1901**) are now completely built-in and packaged directly with the application on both Windows Desktop and Android. Eliminated any need to download Bibles over the internet or CDN.
- **Full 66-Book Magandang Balita Bibliya (MBB 1901) Fix**: Resolved missing verses by establishing strict canonical 1-to-1 mapping for all 66 Tagalog book names (*Genesis* through *Pahayag*), allowing instant filtering, chapter navigation, and full-text search.
- **Enhanced Bible Import Parser**: Expanded natural language Tagalog and Spanish book aliases across all 66 books, ensuring any imported external JSON or Zefania/OpenSong XML files map correctly.
- **Sanctuary Offline Indicator**: Cleaned up Bible management header to display a permanent green **Built-in Offline** status badge.

### 📥 Direct Downloads
- **Windows Setup Installer**: [FreeWorship Studio-Setup-1.1.5.exe](https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.5/FreeWorship.Studio-Setup-1.1.5.exe)
- **Windows Portable**: [FreeWorship Studio-Portable-1.1.5.exe](https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.5/FreeWorship.Studio-Portable-1.1.5.exe)
- **Android Remote APK**: [FreeWorship-StageController.apk](https://github.com/mielglitx/FreeWorshipUpdate/releases/download/v1.1.5/FreeWorship-StageController.apk)
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
      filePath: path.resolve(__dirname, '../release/FreeWorship Studio-Setup-1.1.4.exe'),
      name: 'FreeWorship.Studio-Setup-1.1.4.exe',
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    {
      filePath: path.resolve(__dirname, '../release/FreeWorship Studio-Portable-1.1.4.exe'),
      name: 'FreeWorship.Studio-Portable-1.1.4.exe',
      contentType: 'application/vnd.microsoft.portable-executable',
    },
    {
      filePath: path.resolve(__dirname, '../FreeWorship-StageController.apk'),
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
