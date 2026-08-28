const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.resolve(__dirname, '../data.db'), {
  readOnly: true,
});

const tables = db
  .prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `)
  .all();

console.log('\nTables in data.db:\n');

for (const table of tables) {
  console.log(`- ${table.name}`);

  const columns = db
    .prepare(`PRAGMA table_info("${table.name}")`)
    .all();

  console.log('  Columns:');

  for (const column of columns) {
    console.log(
      `    ${column.name} ${column.type}${column.pk ? ' PRIMARY KEY' : ''}`
    );
  }

  const count = db
    .prepare(`SELECT COUNT(*) AS count FROM "${table.name}"`)
    .get();

  console.log(`  Rows: ${count.count}\n`);
}

db.close();
