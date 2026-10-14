import { BadRequestException } from '@nestjs/common';
import { json, NextFunction, Request, Response } from 'express';

const INVALID_JSON_MESSAGE = 'O corpo da requisição não é um JSON válido.';
const PARSE_FAILURE_TYPE = 'entity.parse.failed';

const parseJson = json();

// V1: corpo que não é JSON válido é recusado com 400, com mensagem própria.
export function jsonBodyParser(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  parseJson(request, response, (error?: unknown) => {
    next(
      isParseFailure(error)
        ? new BadRequestException(INVALID_JSON_MESSAGE)
        : error,
    );
  });
}

function isParseFailure(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === PARSE_FAILURE_TYPE
  );
}
