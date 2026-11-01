
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';

const bucket = process.env.AWS_S3_BUCKET;
const region = process.env.AWS_REGION;

const s3 = bucket && region
  ? new S3Client({ region })
  : null;

// Create a temporary URL for uploading an image to S3
export async function createUploadUrl({ contentType }) {
  if (!s3) {
    throw new Error('S3 is not configured');
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  if (!allowedTypes.includes(contentType)) {
    throw new Error('Only JPEG, PNG, and WebP images are allowed');
  }

  const key = `products/${crypto.randomUUID()}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 300
  });

  return { uploadUrl, key };
}

// Create a temporary URL for viewing an image
export async function createViewUrl(key) {
  if (!s3) {
    throw new Error('S3 is not configured');
  }

  const safeKey = await getImageKey(key);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: safeKey
  });

  return getSignedUrl(s3, command, {
    expiresIn: 3600
  });
}

// Validate image key or an existing S3 image URL
export async function getImageKey(value) {
  if (typeof value !== 'string') {
    throw new Error('Invalid image');
  }

  if (value.startsWith('https://')) {
    const url = new URL(value);
    const expectedHost = `${bucket}.s3.${region}.amazonaws.com`;

    if (url.hostname !== expectedHost) {
      throw new Error('Invalid image URL');
    }

    value = decodeURIComponent(url.pathname.slice(1));
  }

  if (!/^products\/[a-f0-9-]+$/i.test(value)) {
    throw new Error('Invalid image key');
  }

  return value;
}

// Download the image from the private S3 bucket through the backend
export async function getImageObject(key) {
  if (!s3) {
    throw new Error('S3 is not configured');
  }

  const safeKey = await getImageKey(key);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: safeKey
  });

  return await s3.send(command);
}
