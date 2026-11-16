import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// The public, read-only account shown on the login page. Keep DEMO_USER_EMAIL
// (src/config) in step with this address: the API refuses to let it be edited.
export const DEMO_EMAIL = 'demo@northstarlabs.io';
export const DEMO_PASSWORD = 'demo';

/** Creates the demo visitor (or resets it) as a viewer of the given organization. Safe to run again. */
export async function ensureDemoUser(prisma: PrismaClient, organizationId: string) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, name: 'Demo Visitor' },
    create: { email: DEMO_EMAIL, passwordHash, name: 'Demo Visitor' },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    update: { role: 'viewer' },
    create: { organizationId, userId: user.id, role: 'viewer' },
  });

  return user;
}
