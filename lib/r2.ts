import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function getSignedUrlFor(key: string, bucketEnv = 'R2_PAGE_MEDIA_BUCKET', expiresIn = 60) {
  const endpoint = process.env.S3_API_ENDPOINT;
  if (!endpoint) throw new Error('S3_API_ENDPOINT not set');

  const fullBucket = (process.env[bucketEnv] || '').replace(/\/$/, '');
  if (!fullBucket) throw new Error(`${bucketEnv} not set`);

  let bucket = fullBucket;
  let prefix = '';
  if (fullBucket.includes('/')) {
    const parts = fullBucket.split('/');
    bucket = parts.shift() as string;
    prefix = parts.join('/') + '/';
  }

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    },
    forcePathStyle: false,
  });

  const cmd = new GetObjectCommand({ Bucket: bucket, Key: `${prefix}${key}` });
  return getSignedUrl(client, cmd, { expiresIn });
}
