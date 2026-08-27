const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('../data.db', { readonly: true });

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

const tables = [
  'clients',
  'departments',
  'client_departments',
  'processes',
];

let output = `
PRAGMA foreign_keys = ON;

`;

for (const table of tables) {
  const rows = db.prepare(`SELECT * FROM "${table}"`).all();

  if (rows.length === 0) {
    continue;
  }

  const columns = Object.keys(rows[0]);

  output += `-- ${table}\n`;

  for (const row of rows) {
    const values = columns.map((column) => sqlValue(row[column]));

    output += `INSERT INTO "${table}" (${columns
      .map((column) => `"${column}"`)
      .join(', ')}) VALUES (${values.join(', ')});\n`;
  }

  output += '\n';
}

db.close();

fs.writeFileSync('../data-migration.sql', output, 'utf8');

console.log('✅ Migration file created: D:\\Collect\\data-migration.sql');
