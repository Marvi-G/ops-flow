import { organizationRepository } from './repository.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../infrastructure/errors.js';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateMemberInput,
} from './schemas.js';

// Higher number = more powerful
const ROLE_RANK: Record<string, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };
const rank = (role: string) => ROLE_RANK[role] ?? -1;

interface Actor {
  userId: string;
  role: string;
}

export class OrganizationService {
  async findById(id: string) {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new NotFoundError('Organization not found');
    }
    return org;
  }

  async findByUserId(userId: string) {
    return organizationRepository.findByUserId(userId);
  }

  async create(input: CreateOrganizationInput, ownerId: string) {
    if (await organizationRepository.findBySlug(input.slug)) {
      throw new ConflictError('Organization slug already exists', 'DUPLICATE_SLUG');
    }
    return organizationRepository.create(input, ownerId);
  }

  async update(id: string, input: UpdateOrganizationInput) {
    const org = await this.findById(id);

    if (input.slug && input.slug !== org.slug && (await organizationRepository.findBySlug(input.slug))) {
      throw new ConflictError('This slug is already taken', 'DUPLICATE_SLUG');
    }

    await organizationRepository.update(id, input);
    // Read again so the response has the member count the frontend shows
    return this.findById(id);
  }

  async getMembers(organizationId: string) {
    return organizationRepository.getMembers(organizationId);
  }

  /**
   * Who may change or remove whom:
   * - never yourself (this also means an organization can't lose its last owner:
   *   only an owner can touch another owner, and that owner stays),
   * - owners can manage everyone,
   * - everyone else only people ranked below them, and can only hand out roles ranked below their own.
   */
  private assertCanManage(actor: Actor, targetUserId: string, targetRole: string, newRole?: string) {
    if (actor.userId === targetUserId) {
      throw new ForbiddenError("You can't change your own role or remove yourself", 'CANNOT_MODIFY_SELF');
    }

    if (actor.role === 'owner') return;

    if (rank(targetRole) >= rank(actor.role)) {
      throw new ForbiddenError(`You can't manage ${targetRole}s`, 'INSUFFICIENT_ROLE');
    }

    if (newRole !== undefined && rank(newRole) >= rank(actor.role)) {
      throw new ForbiddenError(`Only an owner can give the ${newRole} role`, 'INSUFFICIENT_ROLE');
    }
  }

  private async findMembership(organizationId: string, userId: string) {
    const member = await organizationRepository.getMember(organizationId, userId);
    if (!member) {
      throw new NotFoundError('Member not found');
    }
    return member;
  }

  async updateMemberRole(organizationId: string, actor: Actor, userId: string, input: UpdateMemberInput) {
    const member = await this.findMembership(organizationId, userId);
    this.assertCanManage(actor, userId, member.role, input.role);

    if (member.role === input.role) return member;

    await organizationRepository.updateMemberRole(organizationId, userId, input.role);
    return this.findMembership(organizationId, userId);
  }

  async removeMember(organizationId: string, actor: Actor, userId: string) {
    const member = await this.findMembership(organizationId, userId);
    this.assertCanManage(actor, userId, member.role);

    await organizationRepository.removeMember(organizationId, userId);
  }
}

export const organizationService = new OrganizationService();
