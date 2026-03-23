import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function getClient(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });
}

const bucket = (): string => process.env.R2_BUCKET_NAME ?? '';

/** Returns a presigned PUT URL valid for 1 hour. */
export async function generateUploadUrl(key: string, contentType: string): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }),
    { expiresIn: 3600 },
  );
}

/** Returns a presigned GET URL valid for 15 minutes. */
export async function generateDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: 900 },
  );
}

/** Downloads an object from R2 and returns its contents as a Buffer. */
export async function downloadObject(key: string): Promise<Buffer> {
  const response = await getClient().send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const stream = response.Body as Readable;
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

/** Deletes an object from R2. Does not throw if the object is already gone. */
export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
