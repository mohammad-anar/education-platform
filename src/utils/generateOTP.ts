import cryptoHelper from "./crypto.js";

export const generateOTP = (length = 6): number => {
  return Number(cryptoHelper.generateOTP(length));
};

export default generateOTP;
