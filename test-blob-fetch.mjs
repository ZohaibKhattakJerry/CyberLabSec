import { list } from '@vercel/blob';
async function run() {
  const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
  const blob = blobs[0];
  console.log("Fetching: ", blob.downloadUrl);
  const res = await fetch(blob.downloadUrl);
  console.log("Status: ", res.status, res.statusText);
  if (!res.ok) {
    const text = await res.text();
    console.log("Error text: ", text);
  }
}
run();
