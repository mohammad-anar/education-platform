import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import env from "../config/env.js";
import logger from "./logger.js";
import ApiError from "./ApiError.js";
import { StatusCodes } from "http-status-codes";

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.cloudinary.cloud_name,
  api_key: env.cloudinary.api_key,
  api_secret: env.cloudinary.api_secret,
  secure: true,
});

export const cloudinaryHelper = {
  /**
   * Upload local file to Cloudinary
   */
  uploadFile: async (
    filePath: string,
    folder = "backend_starter",
  ): Promise<UploadApiResponse | null> => {
    if (!env.cloudinary.cloud_name || !env.cloudinary.api_key) {
      logger.warn("Cloudinary credentials not configured, skipping cloud upload");
      return null;
    }

    try {
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "auto",
      });
      return uploadResult;
    } catch (error: any) {
      logger.error("Cloudinary upload failed:", error.message);
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Cloudinary upload failed");
    }
  },

  /**
   * Upload buffer directly to Cloudinary
   */
  uploadBuffer: async (
    buffer: Buffer,
    folder = "backend_starter",
  ): Promise<UploadApiResponse | null> => {
    if (!env.cloudinary.cloud_name || !env.cloudinary.api_key) {
      logger.warn("Cloudinary credentials not configured, skipping cloud upload");
      return null;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "auto" },
        (error, result) => {
          if (error) {
            logger.error("Cloudinary buffer upload failed:", error.message);
            reject(new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, "Cloudinary buffer upload failed"));
          } else {
            resolve(result || null);
          }
        },
      );
      uploadStream.end(buffer);
    });
  },

  /**
   * Delete file from Cloudinary by public ID
   */
  deleteFile: async (publicId: string): Promise<boolean> => {
    if (!env.cloudinary.cloud_name) return false;
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === "ok";
    } catch (error: any) {
      logger.error("Cloudinary delete failed:", error.message);
      return false;
    }
  },
};

export default cloudinaryHelper;
