import { applyDecorators } from '@nestjs/common';
import { ApiBodyOptions, ApiQuery } from '@nestjs/swagger';
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

// Documenta cada query param do schema como um parâmetro opcional no Swagger.
export function ApiQueryFromSchema(schema: ZodType): MethodDecorator {
  const { properties = {} } = toOpenApiSchema(schema) as {
    properties?: Record<string, OpenApiSchema>;
  };
  return applyDecorators(
    ...Object.entries(properties).map(([name, property]) =>
      ApiQuery({ name, required: false, schema: property }),
    ),
  );
}
