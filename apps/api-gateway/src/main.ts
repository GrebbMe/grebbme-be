import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GatewayRpcExceptionFilter } from './common/filter/gateway-rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const configService = app.get(ConfigService);
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    credentials: true,
  });

  // Swagger Setting
  const config = new DocumentBuilder()
    .setTitle('GrabbMe API Docs')
    .setDescription('GrabbMe Backend API Documents')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addServer('api')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // root Endpoint 설정
  app.setGlobalPrefix('api');

  // API 통신을 위한 validator
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.useGlobalFilters(new GatewayRpcExceptionFilter(httpAdapterHost));
  await app.listen(configService.get<number>('GATEWAY_PORT'));
}

bootstrap();
