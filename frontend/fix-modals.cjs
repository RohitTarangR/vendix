const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'src/pages'),
  path.join(__dirname, 'src/components')
];

const processFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace bg-surface in modal headers/bodies with pure bg-white for light mode
  content = content.replace(/bg-surface dark:bg-\[#1C1C1E\]/g, 'bg-white dark:bg-[#282828]');
  content = content.replace(/bg-surfaceSolid\/50/g, 'bg-slate-50');
  content = content.replace(/border-surfaceSolid/g, 'border-slate-200/80');

  // Fix button hovers in light mode
  content = content.replace(/hover:bg-slate-200/g, 'hover:bg-slate-100 dark:hover:bg-white/10');
  content = content.replace(/hover:bg-surfaceSolid/g, 'hover:bg-slate-100 dark:hover:bg-white/10');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated modal styling in: ${filePath}`);
  }
};

const walk = (d) => {
  if (!fs.existsSync(d)) return;
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (fp.endsWith('.jsx')) processFile(fp);
  }
};

dirs.forEach(walk);
console.log('Modal style update complete!');
