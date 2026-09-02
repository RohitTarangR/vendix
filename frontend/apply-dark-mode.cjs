const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src/pages'),
  path.join(__dirname, 'src/components')
];

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Add dark classes intelligently without duplicating them if they already exist
  
  // Backgrounds
  content = content.replace(/bg-white(?!.*dark:bg-)/g, 'bg-white dark:bg-[#1C1C1E]');
  content = content.replace(/bg-surface(?!.*dark:bg-)/g, 'bg-surface dark:bg-[#1C1C1E]');
  content = content.replace(/bg-surfaceSolid\/50(?!.*dark:bg-)/g, 'bg-surfaceSolid/50 dark:bg-black/40');
  content = content.replace(/bg-surfaceSolid(?!.*dark:bg-)/g, 'bg-surfaceSolid dark:bg-[#2C2C2E]');
  content = content.replace(/bg-slate-50(?!.*dark:bg-)/g, 'bg-slate-50 dark:bg-white/5');
  content = content.replace(/bg-slate-100(?!.*dark:bg-)/g, 'bg-slate-100 dark:bg-white/10');
  
  // Text Colors
  content = content.replace(/text-slate-900(?!.*dark:text-)/g, 'text-slate-900 dark:text-white');
  content = content.replace(/text-slate-800(?!.*dark:text-)/g, 'text-slate-800 dark:text-gray-100');
  content = content.replace(/text-slate-700(?!.*dark:text-)/g, 'text-slate-700 dark:text-gray-300');
  content = content.replace(/text-slate-600(?!.*dark:text-)/g, 'text-slate-600 dark:text-gray-400');
  content = content.replace(/text-slate-500(?!.*dark:text-)/g, 'text-slate-500 dark:text-gray-400');
  content = content.replace(/text-slate-400(?!.*dark:text-)/g, 'text-slate-400 dark:text-gray-500');
  content = content.replace(/text-textPrimary(?!.*dark:text-)/g, 'text-textPrimary dark:text-white');
  content = content.replace(/text-textSecondary(?!.*dark:text-)/g, 'text-textSecondary dark:text-gray-400');
  
  // Borders
  content = content.replace(/border-slate-100(?!.*dark:border-)/g, 'border-slate-100 dark:border-white/10');
  content = content.replace(/border-slate-200(?!.*dark:border-)/g, 'border-slate-200 dark:border-white/10');
  content = content.replace(/border-slate-300(?!.*dark:border-)/g, 'border-slate-300 dark:border-white/20');
  content = content.replace(/border-separator(?!.*dark:border-)/g, 'border-separator dark:border-white/10');
  content = content.replace(/border-surfaceSolid(?!.*dark:border-)/g, 'border-surfaceSolid dark:border-white/10');
  content = content.replace(/ring-slate-200(?!.*dark:ring-)/g, 'ring-slate-200 dark:ring-white/10');
  
  // Divide
  content = content.replace(/divide-slate-50(?!.*dark:divide-)/g, 'divide-slate-50 dark:divide-white/5');
  content = content.replace(/divide-slate-100(?!.*dark:divide-)/g, 'divide-slate-100 dark:divide-white/10');
  content = content.replace(/divide-slate-200(?!.*dark:divide-)/g, 'divide-slate-200 dark:divide-white/10');
  content = content.replace(/divide-separator(?!.*dark:divide-)/g, 'divide-separator dark:divide-white/10');

  // Shadows
  content = content.replace(/shadow-\[0_4px_24px_rgba\(0,0,0,0\.04\)\](?!.*dark:shadow-)/g, 'shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none');
  content = content.replace(/shadow-mac-card(?!.*dark:shadow-)/g, 'shadow-mac-card dark:shadow-none');
  content = content.replace(/shadow-mac-subtle(?!.*dark:shadow-)/g, 'shadow-mac-subtle dark:shadow-none');
  content = content.replace(/shadow-sm(?!.*dark:shadow-)/g, 'shadow-sm dark:shadow-none');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated for Dark Mode: ${filePath}`);
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
console.log('Global dark mode styling complete!');
