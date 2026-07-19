import { list, head } from '@vercel/blob';
async function test() {
  const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
  console.log("Blob:", blobs[0]);
}
test().catch(console.error);
