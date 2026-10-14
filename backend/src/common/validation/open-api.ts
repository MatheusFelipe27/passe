import { ApiBodyOptions } from '@nestjs/swagger';
import { z, ZodType } from 'zod';

type OpenApiSchema = Extract<ApiBodyOptions, { schema: object }>['schema'];

export function toOpenApiSchema(schema: ZodType): OpenApiSchema {
  const jsonSchema = z.toJSONSchema(schema, {
    io: 'input',
    target: 'openapi-3.0',
    unrepresentable: 'any',
  });
  delete jsonSchema.$schema;
  return jsonSchema as OpenApiSchema;
}
