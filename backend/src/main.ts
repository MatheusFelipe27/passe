import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Env } from './config/env';

const API_PREFIX = 'api/v1';
const DOCS_PATH = 'api/docs';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({ origin: config.get('CORS_ORIGIN', { infer: true }) });
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
