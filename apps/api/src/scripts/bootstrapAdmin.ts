import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/database';
import { AdminUser } from '../models/AdminUser';
import { env } from '../config/env';

async function bootstrap() {
  await connectDB();
  const email = process.argv[2] || env.ADMIN_EMAIL;
  const password = process.argv[3] || env.ADMIN_PASSWORD;

  const existing = await AdminUser.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.isActive = true;
    await existing.save();
    console.log(`Updated existing administrator password for ${email}`);
  } else {
    await AdminUser.create({
      name: 'System Superadmin',
      email,
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });
    console.log(`Created new administrator: ${email}`);
  }

  await disconnectDB();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('Admin bootstrap failed:', err);
  process.exit(1);
});

