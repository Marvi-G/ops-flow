import type { User, Organization, OrganizationMember } from '@prisma/client';

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    role: string;
  };
}

export interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    role: string;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
}

export type UserWithMemberships = User & {
  memberships: (OrganizationMember & {
    organization: Organization;
  })[];
};
