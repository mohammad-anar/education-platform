import { JwtPayload } from "jsonwebtoken";
import { PermissionScope } from "../modules/identity/permission-engine/permission-catalog.js";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload | any;
      ctx?: {
        userId: string;
        instituteId?: string | null;
        isPlatformAdmin?: boolean;
        scope?: PermissionScope;
        ipAddress?: string | null;
        userAgent?: string | null;
        requestId?: string | null;
      };
    }
  }
}
