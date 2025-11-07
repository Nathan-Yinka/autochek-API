import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    const message = customMessage || this.getDefaultMessage(context);

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message,
        data,
      })),
    );
  }

  private getDefaultMessage(context: ExecutionContext): string {
    const method = context.switchToHttp().getRequest().method;

    const messages = {
      GET: 'Data retrieved successfully',
      POST: 'Created successfully',
      PATCH: 'Updated successfully',
      PUT: 'Updated successfully',
      DELETE: 'Deleted successfully',
    };

    return messages[method] || 'Operation completed successfully';
  }
}

