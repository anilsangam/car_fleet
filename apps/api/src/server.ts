import { createApp } from './app';
import { connectDB, disconnectDB } from './config/database';
import { env } from './config/env';
import { SeedService } from './services/seed.service';

async function bootstrap() {
  try {
    await connectDB();
    
    // Auto-seed baseline data on startup if database is brand new
    if (env.NODE_ENV !== 'test') {
      await SeedService.seedAll();
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`===============================================`);
      console.log(` EliteRide Car Booking API Server Started`);
      console.log(` Environment : ${env.NODE_ENV}`);
      console.log(` Port        : ${env.PORT}`);
      console.log(` API Base    : http://localhost:${env.PORT}/api/v1`);
      console.log(` Health Check: http://localhost:${env.PORT}/health`);
      console.log(` Admin Email : ${env.ADMIN_EMAIL}`);
      console.log(`===============================================`);
    });

    const shutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Fatal Server Bootstrap Error:', error);
    process.exit(1);
  }
}

bootstrap();

