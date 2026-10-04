import colors from "colors/safe.js";
import env from "../config/env.js";

type LogLevel = "info" | "warn" | "error" | "debug" | "success" | "http";

const getTimestamp = (): string => {
  return new Date().toISOString();
};

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = colors.gray(`[${getTimestamp()}]`);
  switch (level) {
    case "info":
      return `${timestamp} ${colors.cyan("[INFO]")} ${message}`;
    case "success":
      return `${timestamp} ${colors.green("[SUCCESS]")} ${message}`;
    case "warn":
      return `${timestamp} ${colors.yellow("[WARN]")} ${message}`;
    case "error":
      return `${timestamp} ${colors.red("[ERROR]")} ${message}`;
    case "debug":
      return `${timestamp} ${colors.magenta("[DEBUG]")} ${message}`;
    case "http":
      return `${timestamp} ${colors.blue("[HTTP]")} ${message}`;
    default:
      return `${timestamp} [${String(level).toUpperCase()}] ${message}`;
  }
};

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(formatMessage("info", message), ...args);
  },
  success: (message: string, ...args: any[]) => {
    console.log(formatMessage("success", message), ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(formatMessage("warn", message), ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(formatMessage("error", message), ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (env.node_env !== "production") {
      console.debug(formatMessage("debug", message), ...args);
    }
  },
  http: (message: string, ...args: any[]) => {
    console.log(formatMessage("http", message), ...args);
  },
};

export default logger;
