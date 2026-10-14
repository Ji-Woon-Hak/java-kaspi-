import assert from "node:assert/strict";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { createApp } from "./server";

test("POST /reprice returns recalculated products", async () => {
  const server = createApp().listen(0);
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/reprice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        {
          sku: "SKU-1",
          name: "Тестовый товар",
          myPrice: 500,
          minPrice: 100,
          maxPrice: 1000,
          step: 10,
          competitors: [{ price: 220, inStock: true }],
        },
      ]),
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), [
      {
        sku: "SKU-1",
        name: "Тестовый товар",
        oldPrice: 500,
        newPrice: 210,
        reason: "UNDERCUT",
      },
    ]);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /reprice rejects invalid products", async () => {
  const server = createApp().listen(0);
  const address = server.address() as AddressInfo;

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/reprice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ sku: "SKU-1" }]),
    });

    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /массив товаров/);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
