const fetch = require('node-fetch');

async function test() {
  const res = await fetch("http://localhost:3000/api/auth/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminId: "CyberLabSec", password: "ZohaibKhattak" })
  });
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", text);
}
test();
