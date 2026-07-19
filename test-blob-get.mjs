import { list, get } from '@vercel/blob';
async function run() {
  const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
  const blob = blobs[0];
  const res = await get(blob.url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  console.log(Object.keys(res));
  console.log("Stream exists?", !!res.stream);
}
run();
