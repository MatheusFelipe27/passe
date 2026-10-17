import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { API_PREFIX } from './common/http/api-prefix';
import { jsonBodyParser } from './common/middleware/json-body.middleware';
import { Env } from './config/env';

const DOCS_PATH = 'api/docs';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  // O frontend lê o nome do arquivo do CSV no Content-Disposition, que o navegador só expõe se for liberado.
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    exposedHeaders: ['Content-Disposition'],
  });
  app.use(jsonBodyParser);
  app.enableShutdownHooks();

  const openApiConfig = new DocumentBuilder()
    .setTitle('Passe')
    .setDescription('API do mercado de jogadores da liga fictícia.')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup(
    DOCS_PATH,
    app,
    SwaggerModule.createDocument(app, openApiConfig),
  );

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
