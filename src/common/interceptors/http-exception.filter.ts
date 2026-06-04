import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

type ErrorResponse = {
  success: false;
  statusCode: number;
  path: string;
  message: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as ZodError;

      const errors = Object.fromEntries(
        zodError.issues.map((issues) => [
          issues.path.join('.'),
          issues.message,
        ]),
      );

      response.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        path: request.url,
        errors,
      });

      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = exceptionResponse.message as string | string[];
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      path: request.url,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
