import { getDatabase } from '../../infrastructure/database/index.js';
import type { UpdateUserInput } from './schemas.js';

export class UserRepository {
  async findById(id: string) {
    const db = getDatabase();
    return db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, input: UpdateUserInput) {
    const db = getDatabase();
    return db.user.update({
      where: { id },
      data: input,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByOrganization(organizationId: string) {
    const db = getDatabase();
    const members = await db.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return members.map((m) => ({
      ...m.user,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }
}

export const userRepository = new UserRepository();
