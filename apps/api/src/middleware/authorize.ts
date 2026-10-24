import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../infrastructure/errors.js';

// Permission definitions
export const PERMISSIONS = {
  // Incidents
  INCIDENTS_READ: 'incidents.read',
  INCIDENTS_CREATE: 'incidents.create',
  INCIDENTS_UPDATE: 'incidents.update',
  INCIDENTS_DELETE: 'incidents.delete',

  // Projects
  PROJECTS_READ: 'projects.read',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  PROJECTS_DELETE: 'projects.delete',

  // Services
  SERVICES_READ: 'services.read',
  SERVICES_MANAGE: 'services.manage',

  // Members
  MEMBERS_READ: 'members.read',
  MEMBERS_INVITE: 'members.invite',
  MEMBERS_MANAGE: 'members.manage',

  // Settings
  SETTINGS_MANAGE: 'settings.manage',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role permissions mapping
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.INCIDENTS_CREATE,
    PERMISSIONS.INCIDENTS_UPDATE,
    PERMISSIONS.INCIDENTS_DELETE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.SERVICES_READ,
    PERMISSIONS.SERVICES_MANAGE,
    PERMISSIONS.MEMBERS_READ,
    PERMISSIONS.MEMBERS_INVITE,
    PERMISSIONS.MEMBERS_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
  ],
  member: [
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.INCIDENTS_CREATE,
    PERMISSIONS.INCIDENTS_UPDATE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.SERVICES_READ,
    PERMISSIONS.SERVICES_MANAGE,
    PERMISSIONS.MEMBERS_READ,
  ],
  viewer: [
    PERMISSIONS.INCIDENTS_READ,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.SERVICES_READ,
    PERMISSIONS.MEMBERS_READ,
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function authorize(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.sessionUser) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    const userRole = req.sessionUser.role;

    // Check if user has at least one of the required permissions
    const hasAccess = permissions.some((permission) =>
      hasPermission(userRole, permission)
    );

    if (!hasAccess) {
      next(
        new ForbiddenError(
          'You do not have permission to perform this action'
        )
      );
      return;
    }

    next();
  };
}

export function authorizeAll(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.sessionUser) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    const userRole = req.sessionUser.role;

    // Check if user has all required permissions
    const hasAccess = permissions.every((permission) =>
      hasPermission(userRole, permission)
    );

    if (!hasAccess) {
      next(
        new ForbiddenError(
          'You do not have permission to perform this action'
        )
      );
      return;
    }

    next();
  };
}
