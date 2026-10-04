import { Response } from "express";
import { IMeta } from "../types/pagination.js";

type IData<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: IMeta;
  pagination?: IMeta;
  data?: T;
};

export const sendResponse = <T>(res: Response, data: IData<T>): void => {
  const meta = data.meta || data.pagination || undefined;

  const resData: any = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message || "Success",
  };

  if (meta) {
    resData.meta = meta;
  }

  if (data.data !== undefined) {
    resData.data = data.data;
  }

  res.status(data.statusCode).json(resData);
};

export default sendResponse;
