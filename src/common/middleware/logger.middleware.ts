import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private getStatusColor(status: number): string {
    if (status >= 500) return '\x1b[31m'; // Red
    if (status >= 400) return '\x1b[33m'; // Yellow
    if (status >= 300) return '\x1b[36m'; // Cyan
    if (status >= 200) return '\x1b[32m'; // Green
    return '\x1b[0m'; // Default
  }

  private getMethodColor(method: string): string {
    switch (method.toUpperCase()) {
      case 'GET': return '\x1b[32m'; // Green
      case 'POST': return '\x1b[34m'; // Blue
      case 'PUT': return '\x1b[33m'; // Yellow
      case 'DELETE': return '\x1b[31m'; // Red
      case 'PATCH': return '\x1b[35m'; // Magenta
      default: return '\x1b[0m'; // Default
    }
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    const sanitized = { ...body };
    if (sanitized.password) sanitized.password = '********';
    return sanitized;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = uuidv4();
    const startTime = Date.now();
    const reset = '\x1b[0m';
    
    // Add requestId to the request object for tracking
    (req as any).requestId = requestId;

    // Log request details
    const methodColor = this.getMethodColor(req.method);
    console.log(`\n[${new Date().toISOString()}] 🔍 Request ${requestId}`);
    console.log(`${methodColor}${req.method}${reset} ${req.originalUrl}`);
    
    // Log headers excluding authorization
    const headers = { ...req.headers };
    if (headers.authorization) {
      headers.authorization = headers.authorization.substring(0, 20) + '...';
    }
    console.log('Headers:', JSON.stringify(headers, null, 2));
    
    // Log query parameters if present
    if (Object.keys(req.query).length > 0) {
      console.log('Query:', JSON.stringify(req.query, null, 2));
    }
    
    // Log sanitized body if present
    if (Object.keys(req.body || {}).length > 0) {
      console.log('Body:', JSON.stringify(this.sanitizeBody(req.body), null, 2));
    }

    // Add response logging
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const statusColor = this.getStatusColor(res.statusCode);
      console.log(`[${new Date().toISOString()}] ✨ Response ${requestId}`);
      console.log(
        `${methodColor}${req.method}${reset} ${req.originalUrl} ${statusColor}${res.statusCode}${reset} ${duration}ms\n`
      );
    });

    next();
  }
} 