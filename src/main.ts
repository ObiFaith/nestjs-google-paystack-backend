import { AuthRequest } from './interface';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Capture raw body for Paystack webhook
  app.use(
    '/wallet/paystack/webhook',
    bodyParser.json({
      verify: (req: AuthRequest, res: Response, buf: Buffer) => {
        req.rawBody = buf.toString();
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Wallet Service with Paystack, JWT & API Keys')
    .setDescription(
      'API Documentation for Wallet Service with Paystack, JWT & API Keys',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Enter JWT token obtained from the login endpoint. Format: Bearer <token>',
    })
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'API Key')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, documentFactory, {
    customCssUrl: 'https://unpkg.com/swagger-ui-dist/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js',
    ],
  });

  // Read config values
  const configService = app.get(ConfigService);
  const port = configService.get('app.port') as number;
  const host = configService.get('app.host') as string;

  await app.listen(port, host);
  console.log(`Server running at http://${host}:${port}`);
}

bootstrap();
