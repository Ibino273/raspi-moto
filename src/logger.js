import winston from 'winston';
import { config } from './config.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Crea directory logs se non esiste
const logDir = dirname(config.logging.file);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const base = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    return stack ? `${base}\n${stack}` : base;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

export default logger;
