import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse as SwaggerApiResponse } from '@nestjs/swagger';

export const ApiStandardResponse = <T>(
  statusCode: number,
  description: string,
  type?: Type<T>,
) => {
  const schema = type
    ? {
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: description },
          data: { $ref: `#/components/schemas/${type.name}` },
        },
      }
    : {
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: description },
          data: { type: 'object' },
        },
      };

  return applyDecorators(
    SwaggerApiResponse({
      status: statusCode,
      description,
      schema,
    }),
  );
};

export const ApiErrorResponse = (statusCode: number, description: string) => {
  return applyDecorators(
    SwaggerApiResponse({
      status: statusCode,
      description,
      schema: {
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: description },
          error: {
            type: 'object',
            properties: {
              statusCode: { type: 'number', example: statusCode },
              timestamp: { type: 'string', example: '2025-11-06T00:00:00.000Z' },
              path: { type: 'string', example: '/api/endpoint' },
            },
          },
        },
      },
    }),
  );
};

