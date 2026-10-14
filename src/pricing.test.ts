import assert from "node:assert/strict";
import test from "node:test";
import { calculatePrice } from "./pricing";
import type { Product } from "./types";

const product: Product = {
  sku: "SKU-1",
  name: "Тестовый товар",
  myPrice: 500,
  minPrice: 100,
  maxPrice: 1000,
  step: 10,
  competitors: [],
};

test("undercuts the cheapest in-stock competitor by the configured step", () => {
  const result = calculatePrice({
    ...product,
    competitors: [
      { price: 250, inStock: true },
      { price: 220, inStock: true },
      { price: 180, inStock: false },
    ],
  });

  assert.deepEqual(result, {
    sku: "SKU-1",
    name: "Тестовый товар",
    oldPrice: 500,
    newPrice: 210,
    reason: "UNDERCUT",
  });
});

test("clamps the target price to the minimum", () => {
  const result = calculatePrice({
    ...product,
    competitors: [{ price: 105, inStock: true }],
  });

  assert.equal(result.newPrice, 100);
  assert.equal(result.reason, "AT_MIN");
});

test("clamps the target price to the maximum", () => {
  const result = calculatePrice({
    ...product,
    competitors: [{ price: 5000, inStock: true }],
  });

  assert.equal(result.newPrice, 1000);
  assert.equal(result.reason, "AT_MAX");
});

test("rounds and clamps the current price if no competitor is available", () => {
  const result = calculatePrice({
    ...product,
    myPrice: 90.4,
    competitors: [{ price: 200, inStock: false }],
  });

  assert.equal(result.newPrice, 100);
  assert.equal(result.reason, "NO_COMPETITORS");
});
