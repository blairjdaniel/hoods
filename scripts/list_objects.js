const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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
}catch(e){ }

async function list(prefix){
  const endpoint = process.env.S3_API_ENDPOINT;
  if (!endpoint) return console.error('S3_API_ENDPOINT not set');
  const fullBucket = (process.env.R2_PAGE_MEDIA_BUCKET || '').replace(/\/$/, '');
  if (!fullBucket) return console.error('R2_PAGE_MEDIA_BUCKET not set');

  let bucket = fullBucket;
  let basePrefix = '';
  if (fullBucket.includes('/')){
    const parts = fullBucket.split('/');
    bucket = parts.shift();
    basePrefix = parts.join('/') + '/';
  }

  const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY }, forcePathStyle: false });
  const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: `${basePrefix}${prefix || ''}`, MaxKeys: 1000 });
  try{
    const res = await client.send(cmd);
    const keys = (res.Contents || []).map(c=>c.Key);
    console.log('Found', keys.length, 'objects:');
    for (const k of keys) console.log('-', k);
  }catch(e){
    console.error('List error', e.name || e.code || e.message || e);
  }
}

(async ()=>{
  const p = process.argv[2] || '';
  await list(p);
})();
