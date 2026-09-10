const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const roots = ['server.js', 'src', 'scripts', 'public/app.js'];
const files = [];

function collect(target) {
  const stats = fs.statSync(target);

  if (stats.isFile() && target.endsWith('.js')) {
    files.push(target);
    return;
  }

  if (stats.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      collect(path.join(target, entry));
    }
  }
}

for (const root of roots) collect(root);

for (const file of files) {
  new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
}

console.log(`Syntax check passed for ${files.length} JavaScript files.`);
