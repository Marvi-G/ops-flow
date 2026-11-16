import bcrypt from 'bcryptjs';
import { userRepository } from './repository.js';
import { getDatabase } from '../../infrastructure/database/index.js';
import { getConfig } from '../../config/index.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../infrastructure/errors.js';
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

  /**
   * The public demo account is shared by every visitor, so nobody may change its name
   * or password (otherwise the first visitor could lock everyone else out).
   */
  private assertNotDemoAccount(email: string) {
    if (email.toLowerCase() === getConfig().DEMO_USER_EMAIL.toLowerCase()) {
      throw new ForbiddenError('The demo account is read-only', 'DEMO_ACCOUNT');
    }
  }

  async update(id: string, input: UpdateUserInput) {
    const user = await this.findById(id);
    this.assertNotDemoAccount(user.email);
    return userRepository.update(id, input);
  }

  /**
   * Changes the password and signs the person out everywhere else, so a stolen
   * session stops working. The session making this request stays signed in.
   */
  async changePassword(userId: string, input: ChangePasswordInput, currentSessionToken: string | undefined) {
    const db = getDatabase();
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    this.assertNotDemoAccount(user.email);

    // A field error (422), not a 401: the frontend treats any 401 as "your session ended"
    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new ValidationError('Current password is incorrect', {
        currentPassword: ['Current password is incorrect'],
      });
    }

    const newPasswordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      }),
      db.session.deleteMany({
        where: {
          userId,
          ...(currentSessionToken ? { token: { not: currentSessionToken } } : {}),
        },
      }),
    ]);
  }

  async findByOrganization(organizationId: string) {
    return userRepository.findByOrganization(organizationId);
  }
}

export const userService = new UserService();
