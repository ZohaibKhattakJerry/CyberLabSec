import { list, get } from '@vercel/blob';
async function run() {
  const { blobs } = await list();
  const blob = blobs[0];
  const res = await get(blob.url, { access: 'private' });
  console.log("Stream exists?", !!res.stream);
}
run();
