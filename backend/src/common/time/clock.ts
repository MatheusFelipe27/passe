import { Global, Injectable, Module } from '@nestjs/common';

// RN01: nas regras de data vale o instante do servidor no momento da operação. Cada operação lê o
// instante uma vez e usa o mesmo valor em todas as regras; nos testes, o relógio é fixo.
@Injectable()
export class Clock {
  now(): Date {
    return new Date();
  }
}

@Global()
@Module({ providers: [Clock], exports: [Clock] })
export class ClockModule {}
