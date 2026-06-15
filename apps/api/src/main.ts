import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";
import { config } from "./common/config.js";

/**
 * NestJS-Bootstrap. Globaler API-Prefix /api/v1, CORS für das Web-Frontend
 * (mit Credentials für Refresh-Cookie), Cookie-Parser, Health unter /api/v1/health.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: config.webOrigin, credentials: true });
  app.use(cookieParser());
  app.setGlobalPrefix("api/v1");

  await app.listen(config.apiPort);
  Logger.log(`API läuft auf http://localhost:${config.apiPort}/api/v1`, "Bootstrap");
}

void bootstrap();
