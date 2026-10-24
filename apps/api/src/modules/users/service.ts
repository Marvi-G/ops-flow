import bcrypt from 'bcrypt';
import { userRepository } from './repository.js';
import { getDatabase } from '../../infrastructure/database/index.js';
import { NotFoundError, UnauthorizedError } from '../../infrastructure/errors.js';
import type { UpdateUserInput, ChangePasswordInput } from './schemas.js';

const SALT_ROUNDS = 12;

export class UserService {
  async findById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return userRepository.update(id, input);
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const db = getDatabase();
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    // Update password
    await db.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  async findByOrganization(organizationId: string) {
    return userRepository.findByOrganization(organizationId);
  }
}

export const userService = new UserService();
