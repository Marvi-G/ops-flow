// Adds the read-only demo account to an existing database WITHOUT wiping anything
// (unlike seed.ts). Run it against the live database from your own machine:
//   npm run db:add-demo
import { PrismaClient } from '@prisma/client';
import { DEMO_EMAIL, DEMO_PASSWORD, ensureDemoUser } from './demo-user.js';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.findUnique({ where: { slug: 'northstar-labs' } });

  if (!organization) {
    throw new Error('Organization "northstar-labs" not found. Run the seed first.');
  }

  await ensureDemoUser(prisma, organization.id);

  console.log(`✅ Demo account ready (viewer of ${organization.name})`);
  console.log(`   Email: ${DEMO_EMAIL}`);
  console.log(`   Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
