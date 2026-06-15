import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module.js";

/**
 * NestJS-Bootstrap. Globaler API-Prefix /api/v1, CORS für das Web-Frontend,
 * Health-Endpoint unter /api/v1/health.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);

  Logger.log(`API läuft auf http://localhost:${port}/api/v1`, "Bootstrap");
}

void bootstrap();
