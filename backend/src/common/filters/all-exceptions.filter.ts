import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
      }
    } else if (exception instanceof Error) {
      // Handle Zod validation errors
      if (exception.name === 'ZodError') {
        status = HttpStatus.BAD_REQUEST;
        message = exception.message;
      } else {
        // Log full error details in development
        console.error('Unhandled error:', {
          message: exception.message,
          stack: exception.stack,
          name: exception.name,
          path: request.url,
          method: request.method,
        });
        message = exception.message || 'Internal server error';
      }
    } else {
      console.error('Unknown error:', exception);
    }

    // In development, include error details
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    const responseBody: any = {
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Include error details in development
    if (isDevelopment && exception instanceof Error) {
      responseBody.error = exception.message;
      responseBody.stack = exception.stack;
    }

    response.status(status).json(responseBody);
  }
}

