import express, { Request, Response } from 'express';
import request from 'supertest';
import { jsonBodyParser } from './json-body.middleware';

function createApp() {
  const app = express();
  app.use(jsonBodyParser);
  const echo = (req: Request, res: Response) => {
    const body = req.body as unknown;
    res.json({ received: body === undefined ? 'nenhum' : body });
  };
  app.post('/echo', echo);
  app.delete('/echo', echo);
  return app;
}

function send(method: 'post' | 'delete', body: string) {
  return request(createApp())
    [method]('/echo')
    .set('Content-Type', 'application/json')
    .send(body);
}

describe('jsonBodyParser', () => {
  it.each(['{bad', '{"name": }', '"x"', '10', 'true', "{'name': 'x'}"])(
    'descarta o corpo inválido %s em vez de recusar o pedido',
    async (body) => {
      const response = await send('post', body);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ received: 'nenhum' });
    },
  );

  it('deixa a exclusão seguir quando chega com corpo inválido (V1)', async () => {
    const response = await send('delete', '{bad');

    expect(response.status).toBe(200);
  });

  it.each([
    ['{"name":"Meia Lua"}', { name: 'Meia Lua' }],
    ['{"agility":50.0}', { agility: 50 }],
    ['[]', []],
    ['{}', {}],
  ])('entrega o corpo %s já convertido', async (body, expected) => {
    const response = await send('post', body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: expected });
  });

  it('segue sem corpo quando nada é enviado', async () => {
    const response = await request(createApp()).post('/echo');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: 'nenhum' });
  });
});
