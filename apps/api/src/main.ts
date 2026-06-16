import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { config } from "./common/config.js";

/** In Produktion dürfen keine Default-/Leersecrets aktiv sein. */
function assertProdSecrets() {
  if (config.nodeEnv !== "production") return;
  const bad: string[] = [];
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes("change_me") || process.env.JWT_SECRET.includes("dev_"))
    bad.push("JWT_SECRET");
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes("change_me") || process.env.JWT_REFRESH_SECRET.includes("dev_"))
    bad.push("JWT_REFRESH_SECRET");
  if (!process.env.FIVEM_BRIDGE_TOKEN || process.env.FIVEM_BRIDGE_TOKEN.includes("change_me"))
    bad.push("FIVEM_BRIDGE_TOKEN");
  if (bad.length) {
    throw new Error(
      `Produktion mit Default-/fehlenden Secrets verweigert: ${bad.join(", ")}`,
    );
  }
}

/**
 * NestJS-Bootstrap. Helmet, globaler API-Prefix /api/v1, CORS für das
 * Web-Frontend (mit Credentials für Refresh-Cookie), Cookie-Parser.
 */
async function bootstrap() {
  assertProdSecrets();

  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: config.webOrigin, credentials: true });
  app.use(cookieParser());
  app.setGlobalPrefix("api/v1");

  await app.listen(config.apiPort);
  Logger.log(`API läuft auf http://localhost:${config.apiPort}/api/v1`, "Bootstrap");
}

void bootstrap();
