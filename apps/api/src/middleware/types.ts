import type { User, OrganizationMember } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface SessionUser {
  user: AuthenticatedUser;
  organizationId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      sessionUser?: SessionUser;
    }
  }
}

export type UserWithMemberships = User & {
  memberships: OrganizationMember[];
};
