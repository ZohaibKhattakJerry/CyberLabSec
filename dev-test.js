const http = require('http');
http.get('http://localhost:3000/api/company/backup?password=CyberLabSec@2024&encrypt=true', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    // console.log(`BODY: ${chunk}`);
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});
