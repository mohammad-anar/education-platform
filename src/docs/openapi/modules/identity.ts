import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { UserValidation } from "../../../modules/identity/user/user.validation.js";
import { RoleValidation } from "../../../modules/identity/role/role.validation.js";
import { PermissionValidation } from "../../../modules/identity/permission/permission.validation.js";
import { IdParamSchema } from "../components.js";

// Schemas & Examples
const UserEntitySchema = z.object({
  id: z.string().openapi({ example: "cly01user_kalam101" }),
  email: z.string().email().openapi({ example: "kalam.hossain@dhakacollege.edu.bd" }),
  firstName: z.string().openapi({ example: "Abul" }),
  lastName: z.string().nullable().optional().openapi({ example: "Kalam" }),
  phone: z.string().nullable().optional().openapi({ example: "+8801812345678" }),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"]).openapi({ example: "ACTIVE" }),
  twoFactorEnabled: z.boolean().openapi({ example: false }),
  createdAt: z.string().openapi({ example: "2026-01-15T09:30:00.000Z" }),
});

const RoleEntitySchema = z.object({
  id: z.string().openapi({ example: "cly01role_teacher" }),
  code: z.string().openapi({ example: "TEACHER" }),
  name: z.string().openapi({ example: "Senior Teacher" }),
  description: z.string().nullable().optional().openapi({ example: "Academic course instructor and attendance marker" }),
  isSystem: z.boolean().openapi({ example: true }),
  instituteId: z.string().nullable().optional().openapi({ example: "cly01inst_dhaka2026" }),
  createdAt: z.string().openapi({ example: "2026-01-01T00:00:00.000Z" }),
});

const PermissionEntitySchema = z.object({
  id: z.string().openapi({ example: "cly01perm_academic_read" }),
  code: z.string().openapi({ example: "academic.subject.read" }),
  module: z.string().openapi({ example: "academic" }),
  description: z.string().openapi({ example: "Allows viewing enrolled subject listings" }),
  allowedScopes: z.array(z.string()).openapi({ example: ["INSTITUTE", "ASSIGNED"] }),
});

// -----------------------------------------------------------------------
// 1. User Management Routes
// -----------------------------------------------------------------------
registerRoute({
  method: "get",
  path: "/api/v1/identity/users",
  tag: "Identity",
  summary: "List users with filtering and pagination",
  permission: "identity.user.read",
  scope: "INSTITUTE",
  operationId: "identityListUsers",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      limit: z.string().optional().openapi({ example: "10" }),
      searchTerm: z.string().optional().openapi({ example: "Kalam" }),
      status: z.string().optional().openapi({ example: "ACTIVE" }),
    }),
  },
  responses: {
    200: {
      description: "Paginated list of users",
      content: {
        "application/json": {
          schema: paginated(UserEntitySchema, "Users retrieved successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/identity/users",
  tag: "Identity",
  summary: "Create new user account within institute",
  permission: "identity.user.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identityCreateUser",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserValidation.createZodSchema,
          example: {
            email: "tanvir.hasan@dhakacollege.edu.bd",
            firstName: "Tanvir",
            lastName: "Hasan",
            phone: "+8801912345678",
            password: "StrongPassword123!",
            roleCode: "TEACHER",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created successfully",
      content: {
        "application/json": {
          schema: successResponse(UserEntitySchema, "User created successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/identity/users/:id",
  tag: "Identity",
  summary: "Get detailed user by ID",
  permission: "identity.user.read",
  scope: "INSTITUTE",
  operationId: "identityGetUserById",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: "User profile details",
      content: {
        "application/json": {
          schema: successResponse(UserEntitySchema, "User retrieved successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "patch",
  path: "/api/v1/identity/users/:id",
  tag: "Identity",
  summary: "Update user profile and details",
  permission: "identity.user.update",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identityUpdateUser",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UserValidation.updateZodSchema,
          example: {
            firstName: "Tanvir",
            lastName: "Hossain",
            phone: "+8801912345678",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "User updated successfully",
      content: {
        "application/json": {
          schema: successResponse(UserEntitySchema, "User updated successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "delete",
  path: "/api/v1/identity/users/:id",
  tag: "Identity",
  summary: "Delete user account",
  permission: "identity.user.delete",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identityDeleteUser",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: "User removed successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({}), "User deleted successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/identity/users/:id/roles",
  tag: "Identity",
  summary: "Assign role to user",
  permission: "identity.user.assignRole",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identityAssignUserRole",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UserValidation.assignRoleZodSchema,
          example: {
            roleId: "cly01role_teacher",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Role assigned to user successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({ success: z.boolean() }), "Role assigned successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "delete",
  path: "/api/v1/identity/users/:id/roles/:roleId",
  tag: "Identity",
  summary: "Revoke role from user",
  permission: "identity.user.assignRole",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identityRevokeUserRole",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "cly01user_kalam101" }),
      roleId: z.string().openapi({ example: "cly01role_teacher" }),
    }),
  },
  responses: {
    200: {
      description: "Role revoked from user successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({ success: z.boolean() }), "Role revoked successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/identity/users/:id/permission-overrides",
  tag: "Identity",
  summary: "Grant or deny permission override for specific user",
  permission: "identity.user.overridePermission",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identityCreatePermissionOverride",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UserValidation.grantOverrideZodSchema,
          example: {
            permissionCode: "academic.subject.create",
            effect: "ALLOW",
            scope: "INSTITUTE",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Permission override saved",
      content: {
        "application/json": {
          schema: successResponse(z.object({ success: z.boolean() }), "Override updated"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/identity/users/:id/effective-permissions",
  tag: "Identity",
  summary: "Get computed effective permissions matrix for user",
  permission: "identity.user.read",
  scope: "INSTITUTE",
  operationId: "identityGetUserEffectivePermissions",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: "Effective permissions dictionary with scopes and sources",
      content: {
        "application/json": {
          schema: successResponse(
            z.record(z.string(), z.string()).openapi({
              example: {
                "academic.subject.read": "INSTITUTE",
                "attendance.session.create": "ASSIGNED",
              },
            }),
            "Effective permissions computed"
          ),
        },
      },
    },
  },
});

// -----------------------------------------------------------------------
// 2. Role Management Routes
// -----------------------------------------------------------------------
registerRoute({
  method: "get",
  path: "/api/v1/identity/roles",
  tag: "Identity",
  summary: "List all defined RBAC roles",
  permission: "identity.role.read",
  scope: "INSTITUTE",
  operationId: "identityListRoles",
  responses: {
    200: {
      description: "List of roles",
      content: {
        "application/json": {
          schema: successResponse(z.array(RoleEntitySchema), "Roles retrieved successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/identity/roles",
  tag: "Identity",
  summary: "Create custom institute role",
  permission: "identity.role.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identityCreateRole",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RoleValidation.createZodSchema,
          example: {
            code: "HEAD_EXAMINER",
            name: "Head of Examination Committee",
            description: "Manages final term exam grade approvals and publishing",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Role created successfully",
      content: {
        "application/json": {
          schema: successResponse(RoleEntitySchema, "Role created successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/identity/roles/:id/matrix",
  tag: "Identity",
  summary: "Get permission matrix for role",
  permission: "identity.role.read",
  scope: "INSTITUTE",
  operationId: "identityGetRoleMatrix",
  request: {
    params: IdParamSchema,
  },
  responses: {
    200: {
      description: "Permissions matrix mapped to role",
      content: {
        "application/json": {
          schema: successResponse(
            z.array(
              z.object({
                code: z.string().openapi({ example: "assessment.exam.create" }),
                scope: z.string().openapi({ example: "INSTITUTE" }),
              })
            ),
            "Role matrix retrieved"
          ),
        },
      },
    },
  },
});

registerRoute({
  method: "put",
  path: "/api/v1/identity/roles/:id/matrix",
  tag: "Identity",
  summary: "Batch update permission assignments for role",
  permission: "identity.role.assignPermissions",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "identitySetRoleMatrix",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: RoleValidation.setRoleMatrixZodSchema,
          example: {
            permissions: [
              { code: "assessment.exam.create", scope: "INSTITUTE" },
              { code: "assessment.exam.read", scope: "INSTITUTE" },
            ],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Role matrix updated",
      content: {
        "application/json": {
          schema: successResponse(z.object({ success: z.boolean() }), "Matrix updated successfully"),
        },
      },
    },
  },
});

// -----------------------------------------------------------------------
// 3. Permission Catalog Routes
// -----------------------------------------------------------------------
registerRoute({
  method: "get",
  path: "/api/v1/identity/permissions/catalog",
  tag: "Identity",
  summary: "List complete static permission catalog definitions",
  permission: "identity.permission.read",
  scope: "INSTITUTE",
  operationId: "identityListPermissionCatalog",
  responses: {
    200: {
      description: "Permission catalog indexed by modules",
      content: {
        "application/json": {
          schema: successResponse(z.array(PermissionEntitySchema), "Catalog retrieved"),
        },
      },
    },
  },
});
