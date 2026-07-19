import { list, get } from '@vercel/blob';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { Readable } from 'stream';

async function run() {
  try {
    const archive = archiver("zip", { zlib: { level: 5 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    const { blobs } = await list();
    if (blobs.length > 0) {
      const blob = blobs[0];
      const res = await get(blob.url, { access: 'private' });
      if (res && res.stream) {
        const nodeStream = Readable.fromWeb(res.stream);
        archive.append(nodeStream, { name: `uploads/${blob.pathname}` });
        console.log("Appended", blob.pathname);
      }
    }
    
    archive.finalize();

    passThrough.on('data', (chunk) => {
        console.log("Received chunk", chunk.length);
    });
    passThrough.on('end', () => {
        console.log("Done");
    });
    passThrough.on('error', (err) => {
        console.error("PassThrough error", err);
    });
  } catch (e) {
    console.error("Exception:", e);
  }
}
run();
