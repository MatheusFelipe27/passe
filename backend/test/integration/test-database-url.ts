export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('Defina TEST_DATABASE_URL no .env (veja o .env.example).');
  }
  // O banco de teste é apagado a cada execução: o nome precisa terminar em _test.
  if (!new URL(url).pathname.endsWith('_test')) {
    throw new Error('O banco de TEST_DATABASE_URL precisa terminar em _test.');
  }
  return url;
}
