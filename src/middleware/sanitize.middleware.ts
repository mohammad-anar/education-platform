import { Request, Response, NextFunction } from "express";

const sanitizeValue = (val: any): any => {
  if (typeof val === "string") {
    return val.trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeValue);
  }
  if (typeof val === "object" && val !== null) {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      sanitizedObj[key] = sanitizeValue(val[key]);
    }
    return sanitizedObj;
  }
  return val;
};

export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) {
      (req.query as any)[key] = sanitizeValue((req.query as any)[key]);
    }
  }
  next();
};

export default sanitizeRequest;
