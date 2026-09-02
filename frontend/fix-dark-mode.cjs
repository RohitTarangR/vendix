const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src/pages'),
  path.join(__dirname, 'src/components')
];

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Fix the broken surfaceSolid replacements
  content = content.replace(/bg-surface dark:bg-\[#1C1C1E\]Solid\/50/g, 'bg-surfaceSolid/50 dark:bg-white/5');
  content = content.replace(/hover:bg-surface dark:bg-\[#1C1C1E\]Solid\/50/g, 'hover:bg-surfaceSolid/50 dark:hover:bg-white/10');
  content = content.replace(/bg-surface dark:bg-\[#1C1C1E\]Solid/g, 'bg-surfaceSolid dark:bg-white/10');
  
  // Fix the broken slate replacements (e.g. dark:bg-white/5/50)
  content = content.replace(/dark:bg-\[#1C1C1E\]Solid\/50\/55/g, 'dark:bg-white/5');
  content = content.replace(/dark:bg-\[#1C1C1E\]Solid\/50\/50/g, 'dark:bg-white/5');
  
  content = content.replace(/hover:bg-slate-50 dark:bg-white\/5\/50/g, 'hover:bg-slate-50/50 dark:hover:bg-white/5');
  content = content.replace(/hover:bg-slate-50 dark:bg-white\/5\/55/g, 'hover:bg-slate-50/50 dark:hover:bg-white/5');
  content = content.replace(/hover:bg-slate-50 dark:bg-white\/5/g, 'hover:bg-slate-50 dark:hover:bg-white/5');
  
  // Also any dark:bg-[#1C1C1E]Solid/50/55 inside hover:bg-surface...
  content = content.replace(/hover:bg-surface dark:bg-white\/5/g, 'hover:bg-surfaceSolid/50 dark:hover:bg-white/5');

  // Fix chart tooltips
  content = content.replace(/bg-slate-900 text-white/g, 'bg-slate-900 text-white dark:bg-white dark:text-black');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed Dark Mode: ${filePath}`);
  }
};

const walkSync = (dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.jsx')) {
      replaceInFile(filePath);
    }
  }
};

directories.forEach(dir => walkSync(dir));
console.log('Cleanup complete!');
