import express from "express";
import { UserRoutes } from "./user/user.route.js";
import { RoleRoutes } from "./role/role.route.js";
import { PermissionRoutes } from "./permission/permission.route.js";

const router = express.Router();

router.use("/users", UserRoutes);
router.use("/roles", RoleRoutes);
router.use("/permissions", PermissionRoutes);

export const IdentityRoutes = router;
export default IdentityRoutes;
