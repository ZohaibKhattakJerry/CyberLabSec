import { list, get } from '@vercel/blob';
import archiver from 'archiver';
import { PassThrough, Readable } from 'stream';

async function test() {
    const archive = archiver("zip", { zlib: { level: 5 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);
    
    archive.on('error', (err) => {
      console.error("Archive Error:", err);
    });

    const { blobs } = await list();
    for (const blob of blobs.slice(0, 2)) {
      const res = await get(blob.url, { access: "private" });
      if (res && res.stream) {
        const nodeStream = Readable.fromWeb(res.stream);
        archive.append(nodeStream, { name: `uploads/${blob.pathname}` });
      }
    }
    
    archive.finalize();

    passThrough.on('data', (chunk) => {
        // console.log("Chunk", chunk.length);
    });
    passThrough.on('end', () => {
        console.log("Stream ended successfully");
    });
}
test();
