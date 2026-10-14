import { HttpException } from '@nestjs/common';
import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { jsonBodyParser } from './json-body.middleware';

function createApp() {
  const app = express();
  app.use(jsonBodyParser);
  app.post('/echo', (req: Request, res: Response) => {
    res.json({ received: req.body as unknown });
  });
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      const message = error instanceof Error ? error.message : '';
      res.status(status).json({ message });
    },
  );
  return app;
}

function post(body: string) {
  return request(createApp())
    .post('/echo')
    .set('Content-Type', 'application/json')
    .send(body);
}

describe('jsonBodyParser', () => {
  it.each(['{bad', '{"name": }', '"x"', '10', 'true', "{'name': 'x'}"])(
    'recusa com 400 o corpo %s',
    async (body) => {
      const response = await post(body);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'O corpo da requisição não é um JSON válido.',
      });
    },
  );

  it.each([
    ['{"name":"Meia Lua"}', { name: 'Meia Lua' }],
    ['{"agility":50.0}', { agility: 50 }],
    ['[]', []],
    ['{}', {}],
  ])('entrega o corpo %s já convertido', async (body, expected) => {
    const response = await post(body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: expected });
  });

  it('entrega um objeto vazio quando não há corpo', async () => {
    const response = await request(createApp()).post('/echo');

    expect(response.status).toBe(200);
  });
});
