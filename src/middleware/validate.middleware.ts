import { NextFunction, Request, Response } from "express";
import { ZodTypeAny } from "zod";

export const validateRequest =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let parsedBody = req.body;
      if (typeof req.body?.data === "string") {
        try {
          parsedBody = JSON.parse(req.body.data);
        } catch {
          parsedBody = req.body;
        }
      }

      const hasBodyKey = (schema as any)?.shape && "body" in (schema as any).shape;
      if (hasBodyKey && !(parsedBody && "body" in parsedBody)) {
        await schema.parseAsync({
          body: parsedBody,
          query: req.query,
          params: req.params,
          cookies: req.cookies,
        });
      } else {
        await schema.parseAsync(parsedBody);
      }

      req.body = parsedBody;
      return next();
    } catch (error) {
      next(error);
    }
  };

export default validateRequest;
