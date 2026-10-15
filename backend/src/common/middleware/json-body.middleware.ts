import { json, NextFunction, Request, Response } from 'express';

const PARSE_FAILURE_TYPE = 'entity.parse.failed';

const parseJson = json();

// V1: corpo que não é JSON válido é descartado aqui. As rotas que exigem corpo o recusam com 400
// na validação, e as rotas sem corpo (consultas, exclusão e venda) simplesmente o ignoram.
export function jsonBodyParser(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  parseJson(request, response, (error?: unknown) => {
    if (isParseFailure(error)) {
      request.body = undefined;
      next();
      return;
    }
    next(error);
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
