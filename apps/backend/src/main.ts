import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({ origin: true, credentials: false });
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
			transformOptions: { enableImplicitConversion: true },
		}),
	);

	const port = Number(process.env.PORT ?? 3000);

	await app.listen(port);

	Logger.log(`🚀 http://localhost:${port}`, 'Bootstrap');
}

void bootstrap();
