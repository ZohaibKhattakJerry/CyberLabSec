const fs = require('fs');
let content = fs.readFileSync('lib/email.ts', 'utf8');
// Remove backslashes before $ and `
content = content.replace(/\\\$/g, '$');
content = content.replace(/\\`/g, '`');
fs.writeFileSync('lib/email.ts', content);
console.log("Fixed lib/email.ts");
