import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

const POSITIVE_INTEGER = /^[1-9]\d*$/;
export const MAX_ID = 2_147_483_647;

// V8: id da URL fora do formato conta como recurso inexistente (404), e não como dado inválido.
@Injectable()
export class ParseResourceIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = POSITIVE_INTEGER.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(id) || id > MAX_ID) {
      throw new NotFoundException('Recurso não encontrado.');
    }
    return id;
  }
}
