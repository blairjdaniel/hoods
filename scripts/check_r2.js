const fs = require('fs');
const path = require('path');
// Parse .env manually so this script has no external dependencies
try{
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  envFile.split(/\r?\n/).forEach(line=>{
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx);
    let val = trimmed.slice(idx+1);
    // Remove surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))){
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  });
}catch(e){
  // ignore if .env not present
}

const { env } = process;
const fetch = global.fetch || require('node-fetch');

const s3Endpoint = (env.S3_API_ENDPOINT || '').replace(/\/$/, '');
const pageMediaBase = (env.R2_PAGE_MEDIA_PUBLIC_BASE || 'trait-swap').replace(/^\//, '').replace(/\/$/, '');
const avatarsBase = (env.R2_AVATARS_PUBLIC_BASE || 'avatars').replace(/^\//, '').replace(/\/$/, '');

if (!s3Endpoint){
  console.error('S3_API_ENDPOINT is not set. Please set S3_API_ENDPOINT in test/.env or export it to test Cloudflare R2 URLs.');
  process.exit(1);
}

const candidateBg = `${s3Endpoint}/${pageMediaBase}/004.png`;
const candidateBurrow = `${s3Endpoint}/${pageMediaBase}/Burrowborn/0.png`;
const candidateLogo = `${s3Endpoint}/${avatarsBase}/hoods_logo.png`;

async function head(url){
  if (!url.startsWith('http')) return { ok: true, status: 'local' };
  try{
    const res = await fetch(url, { method: 'HEAD' });
    return { ok: res.ok, status: res.status };
  }catch(e){
    return { ok:false, error: String(e) };
  }
}

(async ()=>{
  console.log('S3_API_ENDPOINT=', env.S3_API_ENDPOINT);
  console.log('R2_PAGE_MEDIA_PUBLIC_BASE=', env.R2_PAGE_MEDIA_PUBLIC_BASE);
  console.log('candidateBg=', candidateBg);
  console.log('candidateBurrow=', candidateBurrow);
  console.log('candidateLogo=', candidateLogo);

  console.log('\nChecking candidateBg...');
  console.log(await head(candidateBg));

  console.log('\nChecking candidateBurrow...');
  console.log(await head(candidateBurrow));

  console.log('\nChecking candidateLogo...');
  console.log(await head(candidateLogo));

  // Try also a GET for more info when HTTP
  if (candidateBg.startsWith('http')){
    try{
      const res = await fetch(candidateBg);
      console.log('\nGET candidateBg status', res.status);
      console.log('content-type:', res.headers.get('content-type'));
    }catch(e){
      console.log('GET error', String(e));
    }
  }
})();
