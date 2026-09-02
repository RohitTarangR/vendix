const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Fix badges without dark mode
  content = content.replace(/bg-blue-50 text-blue-700/g, 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20');
  content = content.replace(/bg-green-50 text-green-700/g, 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20');
  content = content.replace(/bg-amber-50 text-amber-700/g, 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20');
  content = content.replace(/bg-red-50 text-red-700/g, 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20');

  // Fix text-slate-550, text-slate-450
  content = content.replace(/text-slate-550/g, 'text-textSecondary dark:text-gray-400');
  content = content.replace(/text-slate-450/g, 'text-textSecondary dark:text-gray-400');

  // Replace text-slate-900 or text-slate-950 without dark mode override
  content = content.replace(/\btext-slate-900\b(?!\s*dark:text-)/g, 'text-slate-900 dark:text-white');
  content = content.replace(/\btext-slate-950\b(?!\s*dark:text-)/g, 'text-slate-950 dark:text-white');
  content = content.replace(/\btext-slate-800\b(?!\s*dark:text-)/g, 'text-slate-800 dark:text-gray-200');
  content = content.replace(/\btext-slate-700\b(?!\s*dark:text-)/g, 'text-slate-700 dark:text-gray-300');
  content = content.replace(/\btext-slate-600\b(?!\s*dark:text-)/g, 'text-slate-600 dark:text-gray-300');
  content = content.replace(/\btext-slate-500\b(?!\s*dark:text-)/g, 'text-slate-500 dark:text-gray-400');
  content = content.replace(/\btext-slate-400\b(?!\s*dark:text-)/g, 'text-slate-400 dark:text-gray-400');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed dark mode text in: ${filePath}`);
  }
};

const walk = (d) => {
  if (!fs.existsSync(d)) return;
  for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (fp.endsWith('.jsx') || fp.endsWith('.js')) fixFile(fp);
  }
};

walk(srcDir);
console.log('Finished dark mode text sweep!');
