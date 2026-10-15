#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];
const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

if (!['local', 'supabase'].includes(target)) {
  console.log('Usage: node scripts/switch-db.js [local|supabase]');
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

if (target === 'local') {
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider = "sqlite"\n  url      = env("DATABASE_URL")\n}`
  );
  console.log('Switched prisma/schema.prisma to SQLite (local)');
} else {
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {\n  provider  = "postgresql"\n  url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")\n}`
  );
  console.log('Switched prisma/schema.prisma to PostgreSQL (Supabase)');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Running prisma generate...');
execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
console.log(`Database provider successfully set to ${target}!`);
