import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodType } from 'zod';
import { validationErrorMap } from '../validation/error-messages';

export class ZodValidationPipe<Output> implements PipeTransform<
  unknown,
  Output
> {
  constructor(private readonly schema: ZodType<Output>) {}

  transform(value: unknown): Output {
    const result = this.schema.safeParse(value, { error: validationErrorMap });
    if (result.success) {
      return result.data;
    }
    const [issue] = result.error.issues;
    const field = issue.path.join('.');
    throw new BadRequestException(
      field ? `${field}: ${issue.message}` : issue.message,
    );
  }
}
