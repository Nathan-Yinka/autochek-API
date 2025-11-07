import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ResponseMessage } from './response-message.decorator';
import { ApiStandardResponse, ApiErrorResponse } from './api-standard-response.decorator';

export function ApiEndpoint(
  summary: string,
  successMessage: string,
  successStatus: number = 200,
  errorResponses?: Array<{ status: number; description: string }>,
) {
  const decorators = [
    ApiOperation({ summary }),
    ResponseMessage(successMessage),
    ApiStandardResponse(successStatus, successMessage),
  ];

  if (errorResponses) {
    errorResponses.forEach(({ status, description }) => {
      decorators.push(ApiErrorResponse(status, description));
    });
  }

  return applyDecorators(...decorators);
}

