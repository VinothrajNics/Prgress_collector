const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const BACKEND_DIR = __dirname;
const DATA_DB = process.env.COLLECT_DB || path.resolve(BACKEND_DIR, '../data.db');
const D1_DIR = path.join(BACKEND_DIR, '.wrangler', 'state', 'v3', 'd1');

function findLocalD1() {
  if (!fs.existsSync(D1_DIR)) return null;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const found = walk(full);
        if (found) return found;
      } else if (
        entry.name.endsWith('.sqlite') &&
        entry.name !== 'metadata.sqlite'
      ) {
        return full;
      }
    }
    return null;
  };

  return walk(D1_DIR);
}

if (!fs.existsSync(DATA_DB)) {
  console.error(`data.db not found at ${DATA_DB}`);
  process.exit(1);
}

const target = findLocalD1();

if (!target) {
  console.error(
    'Local D1 database not found. Start `wrangler dev` once to create it, then run `npm run db:sync`.'
  );
  process.exit(0);
}

if (fs.existsSync(target)) {
  fs.rmSync(target);
}

const source = new DatabaseSync(DATA_DB, { readOnly: true });
source.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
source.close();

console.log(`Synced data.db -> ${target}`);
