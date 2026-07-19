import { GET } from './app/api/company/backup/route';
import { NextRequest } from 'next/server';

async function test() {
    const req = new NextRequest("http://localhost:3000/api/company/backup?password=CyberLabSec@2024&encrypt=true");
    try {
        const res = await GET(req);
        console.log("Status:", res.status);
        if (res.status !== 200) {
            const body = await res.json();
            console.log("Error body:", body);
        } else {
            console.log("Success! Stream initialized.");
        }
    } catch (err) {
        console.error("Caught exception:", err);
    }
}
test();
