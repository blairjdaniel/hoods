import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = 'auto';

function makeS3Client(){
  const endpoint = process.env.S3_API_ENDPOINT;
  if (!endpoint) throw new Error('S3_API_ENDPOINT is not set');
  return new S3Client({
    region: REGION,
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: false,
  });
}

export async function GET(req: Request) {
  try{
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    const bucketParam = url.searchParams.get('bucket');
    const expiresParam = url.searchParams.get('expires');
    const expiresIn = expiresParam ? Math.min(Math.max(parseInt(expiresParam, 10) || 60, 1), 3600) : 60;
    if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 });

    // Bucket may be set as <bucket>/<prefix> in env — split if needed
    const fullBucket = (bucketParam || process.env.R2_PAGE_MEDIA_BUCKET || process.env.R2_AVATARS_BUCKET || '').replace(/\/$/, '');
    let bucket = fullBucket;
    let prefix = '';
    if (fullBucket.includes('/')){
      const parts = fullBucket.split('/');
      bucket = parts.shift() as string;
      prefix = parts.join('/') + '/';
    }

    const s3 = makeS3Client();
    const headCmd = new HeadObjectCommand({ Bucket: bucket, Key: `${prefix}${key}` });
    try{
      await s3.send(headCmd);
    }catch(err:any){
      // Not found or no access
      return NextResponse.json({ error: 'object not found' }, { status: 404 });
    }

    const cmd = new GetObjectCommand({ Bucket: bucket, Key: `${prefix}${key}` });
    const signed = await getSignedUrl(s3, cmd, { expiresIn });
    return NextResponse.json({ url: signed });
  }catch(e:any){
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
