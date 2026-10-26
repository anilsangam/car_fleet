import { connectDB, disconnectDB } from '../config/database';
import { SeedService } from '../services/seed.service';

async function runSeed() {
  await connectDB();
  await SeedService.seedAll();
  await disconnectDB();
  console.log('Seed command completed.');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed command failed:', err);
  process.exit(1);
});

