const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const ext = require('path').extname;

// load .env
try{
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  envFile.split(/\r?\n/).forEach(line=>{
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx);
    let val = trimmed.slice(idx+1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))){
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
}catch(e){ /* ignore */ }

async function upload(localPath, key){
  const endpoint = process.env.S3_API_ENDPOINT;
  if (!endpoint) return console.error('S3_API_ENDPOINT not set');
  const bucket = (process.env.R2_PAGE_MEDIA_BUCKET || process.env.R2_PAGE_MEDIA_BUCKET || 'hoodsdao').replace(/\/$/, '');

  const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }, forcePathStyle: false });

  const body = fs.readFileSync(localPath);
  const extension = ext(localPath).toLowerCase();
  const types = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp'
  };
  const contentType = types[extension] || 'application/octet-stream';

  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType });
  try{
    await client.send(cmd);
    console.log('Uploaded', key);
  }catch(e){
    console.error('Upload failed', key, e.name || e.code || e.message || e);
  }
}

(async ()=>{
  const mapping = [
    // local path, target key in bucket
    [path.join(__dirname, '..','public','Burrowborn','0.png'), 'trait-swap/Burrowborn/0.png'],
    [path.join(__dirname, '..','public','UTH','IMG_5698.JPG'), 'trait-swap/UTH/IMG_5698.JPG'],
  ];
  for (const [local, key] of mapping){
    if (!fs.existsSync(local)){
      console.error('Local file not found', local);
      continue;
    }
    await upload(local, key);
  }
})();
