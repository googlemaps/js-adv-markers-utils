#!/usr/bin/env zx

import 'zx/globals';

const examples = await globby(__dirname + '/../examples/*ts');

const data = {};
for (let f of examples) {
  const basename = path.basename(f);
  const source = await fs.readFile(f, 'utf-8');

  let title = basename;
  const firstLine = source.slice(0, source.indexOf('\n')).trim();
  if (firstLine.startsWith('// title:')) {
    title = firstLine.replace(/\/\/ title:\s*/, '');
  }
  data[basename] = {
    title,
    filename: basename,
    source
  };
}

await fs.writeJSON(__dirname + '/../examples/examples.json', data);
