import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

/**
 * Async Delay Middleware
 * Simulates real-world API processing delay using setTimeout
 * Demonstrates async cloud processing behavior
 */
export const simulateDelay = (customDelay?: number) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const delay = customDelay || config.apiDelay;

    setTimeout(() => {
      next();
    }, delay);
  };
};
