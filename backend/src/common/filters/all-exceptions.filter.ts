import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

const INTERNAL_ERROR_MESSAGE = 'Erro interno do servidor.';
const INVALID_REQUEST_MESSAGE = 'Requisição inválida.';
const DUPLICATE_MESSAGE = 'Já existe um registro com esses dados.';
const UNIQUE_VIOLATION = 'P2002';

interface ErrorReply {
  status: number;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, message } = this.toReply(exception);
    response.status(status).json({ message });
  }

  private toReply(exception: unknown): ErrorReply {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        message: readHttpExceptionMessage(exception),
      };
    }
    // Unicidade garantida pelo banco (RN10): uma gravação simultânea que escapou das conferências.
    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      exception.code === UNIQUE_VIOLATION
    ) {
      return { status: HttpStatus.CONFLICT, message: DUPLICATE_MESSAGE };
    }
    const clientStatus = readClientErrorStatus(exception);
    if (clientStatus !== null) {
      return { status: clientStatus, message: INVALID_REQUEST_MESSAGE };
    }
    this.logger.error(
      'Falha inesperada',
      exception instanceof Error ? exception.stack : String(exception),
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: INTERNAL_ERROR_MESSAGE,
    };
  }
}

function readHttpExceptionMessage(exception: HttpException): string {
  const body = exception.getResponse();
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body;
    if (Array.isArray(message) && message.length > 0) {
      return message.join('; ');
    }
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return exception.message || INVALID_REQUEST_MESSAGE;
}

// Erros do parser do corpo (como JSON inválido) chegam fora de HttpException.
function readClientErrorStatus(exception: unknown): number | null {
  if (typeof exception !== 'object' || exception === null) {
    return null;
  }
  const { status } = exception as { status?: unknown };
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return status;
  }
  return null;
}
