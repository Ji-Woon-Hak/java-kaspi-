import express, { type ErrorRequestHandler } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculatePrice } from "./pricing";
import type { Product } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isProduct(value: unknown): value is Product {
  if (!isRecord(value)) return false;
  if (
    typeof value.sku !== "string" ||
    value.sku.trim().length === 0 ||
    typeof value.name !== "string" ||
    value.name.trim().length === 0 ||
    !isFiniteNumber(value.myPrice) ||
    value.myPrice < 0 ||
    !isFiniteNumber(value.minPrice) ||
    value.minPrice < 0 ||
    !isFiniteNumber(value.maxPrice) ||
    value.maxPrice < value.minPrice ||
    !isFiniteNumber(value.step) ||
    value.step < 0 ||
    !Array.isArray(value.competitors)
  ) {
    return false;
  }

  return value.competitors.every(
    (competitor) =>
      isRecord(competitor) &&
      isFiniteNumber(competitor.price) &&
      competitor.price >= 0 &&
      typeof competitor.inStock === "boolean",
  );
}

function isProductArray(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/reprice", (request, response) => {
    const body: unknown = request.body;
    if (!isProductArray(body)) {
      response.status(400).json({
        error:
          "Ожидается массив товаров с полями sku, name, myPrice, minPrice, maxPrice, step и competitors.",
      });
      return;
    }

    response.json(body.map(calculatePrice));
  });

  const distPath = path.resolve(process.cwd(), "dist");
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get(/.*/, (_request, response) => {
      response.sendFile(path.join(distPath, "index.html"));
    });
  }

  const handleJsonError: ErrorRequestHandler = (error, _request, response, next) => {
    if (
      error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400
    ) {
      response.status(400).json({ error: "Некорректный JSON в теле запроса." });
      return;
    }
    next(error);
  };
  app.use(handleJsonError);

  return app;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT ?? 3001);
  createApp().listen(port, () => {
    console.log(`Repricing API listening on http://localhost:${port}`);
  });
}
