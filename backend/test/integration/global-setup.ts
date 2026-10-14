import 'dotenv/config';
import { execSync } from 'node:child_process';
import { Client } from 'pg';
import { testDatabaseUrl } from './test-database-url';

// Recria do zero o banco de teste (separado do banco da aplicação) e aplica as migrations.
export default async function globalSetup(): Promise<void> {
  const url = new URL(testDatabaseUrl());
  const databaseName = url.pathname.slice(1);
  const serverUrl = new URL(url);
  serverUrl.pathname = '/postgres';
  serverUrl.search = '';

  const client = new Client({ connectionString: serverUrl.toString() });
  await client.connect();
  try {
    const name = client.escapeIdentifier(databaseName);
    await client.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${name}`);
  } finally {
    await client.end();
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: url.toString() },
  });
}
