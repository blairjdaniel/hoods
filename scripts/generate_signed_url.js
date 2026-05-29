const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Load .env manually
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

async function run(){
  const endpoint = process.env.S3_API_ENDPOINT;
  if (!endpoint) return console.error('S3_API_ENDPOINT not set in test/.env');
  const fullBucket = (process.env.R2_PAGE_MEDIA_BUCKET || '').replace(/\/$/, '');
  if (!fullBucket) return console.error('R2_PAGE_MEDIA_BUCKET not set');

  let bucket = fullBucket;
  let prefix = '';
  if (fullBucket.includes('/')){
    const parts = fullBucket.split('/');
    bucket = parts.shift();
    prefix = parts.join('/') + '/';
  }

  const keyArg = process.argv[2] || 'UTH/IMG_5698.JPG';

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
  });

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: `${prefix}${keyArg}` });
  try{
    const url = await getSignedUrl(client, cmd, { expiresIn: 60 });
    console.log('Signed URL:', url);
  }catch(e){
    console.error('Error generating signed URL', e);
  }
}

run();
