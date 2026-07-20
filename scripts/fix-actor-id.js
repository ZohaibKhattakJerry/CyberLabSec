const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;

      // Replace actorId: auth.sub with actorId: null
      if (content.includes('actorId: auth.sub')) {
        content = content.replace(/actorId:\s*auth\.sub/g, 'actorId: null');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Modified', fullPath);
      }
    }
  }
}

replaceInDir(path.join(__dirname, '../app/api/company'));
