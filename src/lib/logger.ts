import pino from "pino";

// Pino logger configuration for browser environment.
const logger = pino({
  level: import.meta.env.DEV ? "debug" : "info",
  browser: {
    serialize: true,
    asObject: false,
  },
});

export default logger;

type LogArgs = unknown[];

export const log = {
  debug: (message: string, ...args: LogArgs) => {
    logger.debug(message, ...args);
  },
  info: (message: string, ...args: LogArgs) => {
    logger.info(message, ...args);
  },
  warn: (message: string, ...args: LogArgs) => {
    logger.warn(message, ...args);
  },
  error: (message: string, ...args: LogArgs) => {
    logger.error(message, ...args);
  },
  fatal: (message: string, ...args: LogArgs) => {
    logger.fatal(message, ...args);
  },
};
