const fs = require('fs');
const path = require('path');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');

// Load .env manually (same approach as other scripts)
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

async function head(keyArg){
  const endpoint = process.env.S3_API_ENDPOINT;
  if (!endpoint) return console.error('S3_API_ENDPOINT not set');

  const fullBucket = (process.env.R2_PAGE_MEDIA_BUCKET || '').replace(/\/$/, '');
  if (!fullBucket) return console.error('R2_PAGE_MEDIA_BUCKET not set');

  let bucket = fullBucket;
  let prefix = '';
  if (fullBucket.includes('/')){
    const parts = fullBucket.split('/');
    bucket = parts.shift();
    prefix = parts.join('/') + '/';
  }

  const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }, forcePathStyle: false });

  const cmd = new HeadObjectCommand({ Bucket: bucket, Key: `${prefix}${keyArg}` });
  try{
    const res = await client.send(cmd);
    console.log('HEAD OK', `${bucket}/${prefix}${keyArg}`, res.ContentLength ? `${res.ContentLength} bytes` : 'no-size');
  }catch(e){
    console.error('HEAD ERROR', `${bucket}/${prefix}${keyArg}`, e.name || e.code || e.message || e);
  }
}

(async ()=>{
  const keys = process.argv.slice(2);
  if (!keys.length) return console.error('Usage: node scripts/head_object.js <key> [key2 ...]');
  for (const k of keys){
    // run sequentially
    await head(k);
  }
})();
