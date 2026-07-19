import { list } from '@vercel/blob';
async function run() {
  try {
    const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
    console.log(blobs[0]);
  } catch (e) {
    console.error(e);
  }
}
run();
