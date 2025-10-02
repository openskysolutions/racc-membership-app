// Role and Permission Policy - handles authorization for content management

/**
 * Service for role-based permission checking
 */
export class PermissionService {
  static isModerator(memberId: any) {
    throw new Error('Method not implemented.');
  }
  private roles: Map<string, any>;
  private memberRoles: Map<string, string[]>;

  constructor() {
    this.roles = new Map(); // Role definitions
    this.memberRoles = new Map(); // memberId -> roleNames[]
    this.initializeDefaultRoles();
  }

  /**
   * Check if member has specific permission
   * @param memberId - Member ID
   * @param permission - Permission to check (e.g., 'events:create', 'content:moderate')
   * @returns True if permission granted
   */
  async hasPermission(memberId, permission) {
    const memberRoleNames = this.memberRoles.get(memberId) || ['member'];
    
    for (const roleName of memberRoleNames) {
      const role = this.getRoleByName(roleName);
      if (role && role.permissions.includes(permission)) {
        return true;
      }
      
      // Check for wildcard permissions
      if (role && this.hasWildcardPermission(role.permissions, permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if member can perform action on content
   * @param memberId - Member ID
   * @param action - Action to perform
   * @param contentType - Type of content
   * @param contentOwnerId - Optional owner ID for ownership checks
   * @returns True if action allowed
   */
  async canPerformAction(
    memberId,
    action,
    contentType,
    contentOwnerId
  ) {
    const permission = `${contentType}:${action}`;
    
    // Check direct permission
    if (await this.hasPermission(memberId, permission)) {
      return true;
    }

    // Check ownership for edit/delete actions
    if ((action === 'edit' || action === 'delete') && contentOwnerId === memberId) {
      const ownerPermission = `${contentType}:${action}:own`;
      if (await this.hasPermission(memberId, ownerPermission)) {
        return true;
      }
    }

    // Check general content permissions
    const generalPermission = `content:${action}`;
    return await this.hasPermission(memberId, generalPermission);
  }

  /**
   * Check if member is a moderator
   * @param memberId - Member ID
   * @returns True if member has moderation permissions
   */
  async isModerator(memberId) {
    return await this.hasPermission(memberId, 'content:moderate');
  }

  /**
   * Check if member is an admin
   * @param memberId - Member ID
   * @returns True if member has admin role
   */
  async isAdmin(memberId) {
    const memberRoleNames = this.memberRoles.get(memberId) || [];
    return memberRoleNames.includes('admin');
  }

  /**
   * Assign role to member
   * @param memberId - Member ID
   * @param roleName - Role name to assign
   */
  async assignRole(memberId, roleName) {
    if (!this.getRoleByName(roleName)) {
      throw new Error(`Role '${roleName}' does not exist`);
    }

    const currentRoles = this.memberRoles.get(memberId) || [];
    if (!currentRoles.includes(roleName)) {
      currentRoles.push(roleName);
      this.memberRoles.set(memberId, currentRoles);
    }
  }

  /**
   * Remove role from member
   * @param memberId - Member ID
   * @param roleName - Role name to remove
   */
  async removeRole(memberId, roleName) {
    const currentRoles = this.memberRoles.get(memberId) || [];
    const updatedRoles = currentRoles.filter(role => role !== roleName);
    
    if (updatedRoles.length === 0) {
      updatedRoles.push('member'); // Ensure every member has at least member role
    }
    
    this.memberRoles.set(memberId, updatedRoles);
  }

  /**
   * Get member's roles
   * @param memberId - Member ID
   * @returns Array of role names
   */
  async getMemberRoles(memberId) {
    return this.memberRoles.get(memberId) || ['member'];
  }

  /**
   * Get member's effective permissions (combined from all roles)
   * @param memberId - Member ID
   * @returns Array of permissions
   */
  async getMemberPermissions(memberId) {
    const memberRoleNames = await this.getMemberRoles(memberId);
    const allPermissions = new Set();

    for (const roleName of memberRoleNames) {
      const role = this.getRoleByName(roleName);
      if (role) {
        role.permissions.forEach(permission => allPermissions.add(permission));
      }
    }

    return Array.from(allPermissions);
  }

  /**
   * Create or update a role
   * @param roleData - Role configuration
   * @returns Created role
   */
  async createRole(roleData) {
    const id = `role_${Date.now()}_${roleData.name}`;
    const role = {
      id,
      name: roleData.name,
      permissions: [...roleData.permissions] // Copy array
    };

    this.roles.set(role.name, role); // Store by name for easy lookup
    return role;
  }

  /**
   * Get all available roles
   * @returns Array of roles
   */
  async getAllRoles() {
    return Array.from(this.roles.values());
  }

  /**
   * Get role by name
   * @param name - Role name
   * @returns Role object or null
   */
  getRoleByName(name) {
    return this.roles.get(name) || null;
  }

  // Private helper methods

  hasWildcardPermission(permissions, targetPermission) {
    // Check for wildcard permissions like 'content:*' or 'events:*'
    const [resource, action] = targetPermission.split(':');
    
    return permissions.some(permission => {
      if (permission.endsWith(':*')) {
        const permissionResource = permission.split(':')[0];
        return permissionResource === resource;
      }
      return false;
    });
  }

  initializeDefaultRoles() {
    // Visitor role - minimal permissions
    this.createRole({
      name: 'visitor',
      permissions: [
        'event:view',
        'news:view',
        'member:view'
      ]
    });

    // Member role - basic member permissions
    this.createRole({
      name: 'member',
      permissions: [
        'event:view',
        'event:create',
        'event:edit:own',
        'event:delete:own',
        'job:view',
        'job:create',
        'job:edit:own',
        'job:delete:own',
        'news:view',
        'news:create',
        'news:edit:own',
        'news:delete:own',
        'nomination:create',
        'post:create',
        'post:edit:own',
        'post:delete:own',
        'post:report',
        'member:view'
      ]
    });

    // Content Manager role - can moderate some content
    this.createRole({
      name: 'content-manager',
      permissions: [
        'event:*',
        'job:*',
        'news:*',
        'nomination:*',
        'post:*',
        'member:view',
        'content:moderate'
      ]
    });

    // Admin role - full permissions
    this.createRole({
      name: 'admin',
      permissions: [
        'event:*',
        'job:*',
        'news:*',
        'nomination:*',
        'post:*',
        'member:*',
        'content:*',
        'role:*',
        'system:*'
      ]
    });
  }
}

// Singleton instance
const permissionService = new PermissionService();

module.exports = { permissionService };
