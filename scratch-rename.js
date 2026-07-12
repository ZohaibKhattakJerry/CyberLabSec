const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const files = walkSync(path.join(__dirname, 'app'));
files.push(...walkSync(path.join(__dirname, 'components')));
files.push(path.join(__dirname, 'proxy.ts'));
files.push(path.join(__dirname, 'lib', 'email.ts'));

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace Next.js router and fetch paths
  // Using a regex to match quotes or backticks followed by /admin or /portal
  
  // /admin -> /company
  content = content.replace(/(['"`])\/admin\b/g, '$1/company');
  content = content.replace(/(['"`])\/api\/admin\b/g, '$1/api/company');

  // /portal -> /employee
  content = content.replace(/(['"`])\/portal\b/g, '$1/employee');
  content = content.replace(/(['"`])\/api\/portal\b/g, '$1/api/employee');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated paths in ${file}`);
  }
}
