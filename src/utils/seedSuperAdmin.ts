import env from "../config/env.js";
import prisma from "../config/prisma.js";
import { UserStatus } from "@prisma/client";
import cryptoHelper from "./crypto.js";
import logger from "./logger.js";

export const seedSuperAdmin = async () => {
  if (!env.admin.email || !env.admin.password) {
    return;
  }

  const isExist = await prisma.user.findFirst({
    where: {
      email: env.admin.email,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  // Ensure SUPER_ADMIN and system roles exist
  let superAdminRole = await prisma.role.findFirst({
    where: { code: "SUPER_ADMIN", instituteId: null },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: "Super Administrator",
        code: "SUPER_ADMIN",
        description: "Global system administrator with full access",
        isSystem: true,
      },
    });
  }

  // Ensure default roles exist
  const defaultRoles = [
    { name: "Institute Admin", code: "ADMIN", desc: "Institute Administrator" },
    { name: "Teacher", code: "TEACHER", desc: "Faculty / Instructor" },
    { name: "Student", code: "STUDENT", desc: "Enrolled Student" },
    { name: "Staff", code: "STAFF", desc: "General Staff" },
    { name: "Guardian", code: "GUARDIAN", desc: "Parent / Guardian" },
  ];

  for (const r of defaultRoles) {
    const roleExists = await prisma.role.findFirst({
      where: { code: r.code, instituteId: null },
    });
    if (!roleExists) {
      await prisma.role.create({
        data: {
          name: r.name,
          code: r.code,
          description: r.desc,
          isSystem: true,
        },
      });
    }
  }

  if (!isExist) {
    const hashedPassword = await cryptoHelper.hashPassword(env.admin.password);

    const newUser = await prisma.user.create({
      data: {
        firstName: env.admin.name || "Super Admin",
        lastName: "Admin",
        email: env.admin.email,
        phone: env.admin.phone || null,
        passwordHash: hashedPassword,
        avatarUrl: env.admin.avatar || null,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });

    // Assign SUPER_ADMIN role
    await prisma.userRole.create({
      data: {
        userId: newUser.id,
        roleId: superAdminRole.id,
      },
    });

    logger.success(`🌱 Super admin created: ${env.admin.email}`);
  } else {
    logger.info(`Super admin already exists: ${env.admin.email}`);
  }
};

export default seedSuperAdmin;
