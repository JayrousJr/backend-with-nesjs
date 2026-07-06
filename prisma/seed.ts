import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcrypt';
import { ALL_PERMISSIONS } from '@permissions';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

function describePermission(action: string): string {
  const [resource, verb] = action.split('.');
  return `${verb.charAt(0).toUpperCase()}${verb.slice(1)} ${resource}`;
}

async function main() {
  for (const action of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: action },
      update: {},
      create: { name: action, description: describePermission(action) },
    });
  }

  await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Default role for new accounts' },
  });

  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { permissions: { set: ALL_PERMISSIONS.map((name) => ({ name })) } },
    create: {
      name: 'ADMIN',
      description: 'Full administrative access',
      permissions: { connect: ALL_PERMISSIONS.map((name) => ({ name })) },
    },
  });

  // Demo accounts are sample data for local development, not something a real
  // deployment should ever get from a shared seed script — a known password
  // for an admin account is a standing credential leak the moment this
  // template's source (and therefore this file) is public. Bootstrap your
  // first production admin through a separate, one-off process instead.
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping demo accounts (NODE_ENV=production).');
    console.log('Seeding complete');
    return;
  }

  const password = await bcrypt.hash('Password123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password,
      firstName: 'Admin',
      lastName: 'User',
      role: { connect: { name: 'ADMIN' } },
      emailVerifiedAt: new Date(),
      preferredLocale: 'en',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password,
      firstName: 'Regular',
      lastName: 'User',
      role: { connect: { name: 'USER' } },
      emailVerifiedAt: new Date(),
      preferredLocale: 'en',
    },
  });

  console.log(
    'Seeded demo accounts: admin@example.com / user@example.com (password: Password123!) — development only.',
  );
  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
