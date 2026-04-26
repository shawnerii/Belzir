import fs from 'fs';
import path from 'path';
import { config, requireJwtSecret, requireJwtExpiresInSeconds } from './config/env';
import app from './app';

async function start() {
  requireJwtSecret();
  requireJwtExpiresInSeconds();

  const dbDir = path.resolve(__dirname, '../', path.dirname(config.dbPath));
  fs.mkdirSync(dbDir, { recursive: true });

  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
