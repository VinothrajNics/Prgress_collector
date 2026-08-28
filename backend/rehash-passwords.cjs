const { scrypt: scryptCallback, randomBytes } = require('crypto');
const { promisify } = require('util');
const { DatabaseSync } = require('node:sqlite');

const scrypt = promisify(scryptCallback);

const DB_PATH = process.env.COLLECT_DB || '../data.db';
const PASSWORD_ITERATIONS = 100_000;
const CANDIDATES = [
  'client',
  'Client1',
  'Client2',
  'password',
  'admin123',
  '123456',
];

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function hashPasswordPbkdf2(password) {
  const salt = bytesToHex(randomBytes(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(salt),
      iterations: PASSWORD_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return `pbkdf2:${PASSWORD_ITERATIONS}:${salt}:${bytesToHex(new Uint8Array(bits))}`;
}

async function verifyLegacy(password, stored) {
  const [salt, key] = String(stored).split(':');
  if (!salt || !key) return false;
  const derived = await scrypt(password, salt, 64);
  return derived.toString('hex') === key;
}

(async () => {
  const db = new DatabaseSync(DB_PATH);
  const clients = db
    .prepare('SELECT id, username, password_hash FROM clients')
    .all();

  const statements = [];

  for (const client of clients) {
    const stored = client.password_hash;

    if (!stored || String(stored).startsWith('pbkdf2:')) {
      console.log(`SKIP ${client.username} (already pbkdf2 or empty)`);
      continue;
    }

    let password = null;

    for (const candidate of CANDIDATES) {
      if (await verifyLegacy(candidate, stored)) {
        password = candidate;
        break;
      }
    }

    if (!password) {
      console.error(
        `!! ${client.username}: could not verify a candidate password. Leaving unchanged.`
      );
      continue;
    }

    const newHash = await hashPasswordPbkdf2(password);

    db.prepare('UPDATE clients SET password_hash = ? WHERE id = ?').run(
      newHash,
      client.id
    );

    statements.push(
      `UPDATE clients SET password_hash = '${newHash}' WHERE username = '${client.username}';`
    );

    console.log(
      `OK ${client.username}: rehashed (password "${password}")`
    );
  }

  db.close();

  if (statements.length) {
    console.log('\n-- SQL to run against remote D1:\n');
    console.log(statements.join('\n'));
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
