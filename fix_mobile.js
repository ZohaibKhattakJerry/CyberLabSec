const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('app/company');

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  // Fix grid-mobile-1
  const gridRegex = /<div(?!\s+className)[^>]*style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr"/g;
  const matchGrid = content.match(gridRegex);
  if (matchGrid) {
    content = content.replace(gridRegex, '<div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr"');
    changed = true;
  }

  const gridRegex3 = /<div(?!\s+className)[^>]*style=\{\{\s*display:\s*"grid",\s*gridTemplateColumns:\s*"1fr 1fr 1fr"/g;
  const matchGrid3 = content.match(gridRegex3);
  if (matchGrid3) {
    // Wait, globals.css only maps grid-mobile-1 to 1fr. Let's add grid-mobile-1 to 1fr 1fr 1fr too.
    content = content.replace(gridRegex3, '<div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(f, content, 'utf8');
    console.log("Fixed:", f);
  }
});
