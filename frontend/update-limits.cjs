const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace query param limit=10 and limit=12 with limit=8
  content = content.replace(/limit=10(?!\d)/g, 'limit=8');
  content = content.replace(/limit=12(?!\d)/g, 'limit=8');
  content = content.replace(/limit:\s*10/g, 'limit: 8');
  content = content.replace(/limit:\s*12/g, 'limit: 8');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated limit to 8 in: ${filePath}`);
  }
};

const walk = (d) => {
  if (!fs.existsSync(d)) return;
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (fp.endsWith('.jsx') || fp.endsWith('.js')) processFile(fp);
  }
};

walk(srcDir);
console.log('All pagination limits updated to 8!');
