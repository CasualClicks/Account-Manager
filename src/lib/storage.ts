import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;

function getClient() {
  if (client) return client;

  const region = process.env.AWS_REGION;
  if (!region) throw new Error("AWS_REGION is required for Neon Object Storage.");
  if (!process.env.AWS_ENDPOINT_URL_S3) {
    throw new Error("AWS_ENDPOINT_URL_S3 is required for Neon Object Storage.");
  }

  // The AWS SDK reads AWS_ENDPOINT_URL_S3 and AWS_* credentials from the environment.
  // Path-style addressing is required by Neon Object Storage.
  client = new S3Client({ region, forcePathStyle: true });
  return client;
}

export function getStorageBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is required for Neon Object Storage.");
  return bucket;
}

export async function putStorageObject(input: {
  key: string;
  body: Uint8Array;
  contentType: string;
}) {
  const bucket = getStorageBucket();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
  return { bucket, key: input.key };
}

export async function createStorageDownloadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: getStorageBucket(), Key: key }),
    { expiresIn },
  );
}

export async function deleteStorageObject(key: string) {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: getStorageBucket(), Key: key }),
  );
}
