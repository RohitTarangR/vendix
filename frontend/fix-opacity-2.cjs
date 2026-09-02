const fs = require('fs');
const path = require('path');
const dirs = [path.join(__dirname, 'src/pages'), path.join(__dirname, 'src/components')];
const replaceInFile = (fp) => {
  let content = fs.readFileSync(fp, 'utf8');
  let newContent = content.replace(/dark:bg-white\/5\/55/g, 'dark:hover:bg-white/5');
  newContent = newContent.replace(/dark:bg-white\/5\/50/g, 'dark:hover:bg-white/5');
  if (content !== newContent) { fs.writeFileSync(fp, newContent, 'utf8'); console.log('Fixed', fp); }
};
const walk = (d) => {
  if (!fs.existsSync(d)) return;
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (fp.endsWith('.jsx')) replaceInFile(fp);
  }
};
dirs.forEach(walk);
