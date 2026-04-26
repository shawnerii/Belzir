import fs from 'fs';
import path from 'path';
import app from './app';
import { config } from './config/env';

async function start(): Promise<void> {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  app.listen(config.port, () => {
    console.log(`SOC server running on port ${config.port} [${config.nodeEnv}]`);
  });
}

start().catch((err) => {
  console.error('Failed to start SOC server:', err);
  process.exit(1);
});
