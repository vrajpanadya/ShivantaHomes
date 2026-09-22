import dns from 'node:dns';
import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { runSeed } from './seed/seed';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function main() {
  await connectDB();
  // Idempotent auto-seed keeps verified content present (disable with AUTO_SEED=false)
  if (process.env.AUTO_SEED !== 'false') {
    try {
      await runSeed();
    } catch (err) {
      console.error('[seed] auto-seed failed (continuing):', err);
    }
  }
  const app = createApp();
  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🏡  SHIVANTA HOMES API ready on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
