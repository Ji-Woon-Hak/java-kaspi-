import type { PriceResult, Product } from "./types";

export function calculatePrice(product: Product): PriceResult {
  const availableCompetitors = product.competitors.filter(
    (competitor) =>
      competitor.inStock &&
      Number.isFinite(competitor.price) &&
      competitor.price >= 0,
  );

  if (availableCompetitors.length === 0) {
    return {
      sku: product.sku,
      name: product.name,
      oldPrice: product.myPrice,
      newPrice: Math.round(
        Math.min(product.maxPrice, Math.max(product.minPrice, product.myPrice)),
      ),
      reason: "NO_COMPETITORS",
    };
  }

  const cheapestCompetitor = availableCompetitors.reduce(
    (cheapest, competitor) => Math.min(cheapest, competitor.price),
    Number.POSITIVE_INFINITY,
  );
  const targetPrice = Math.floor(cheapestCompetitor - product.step);

  if (targetPrice <= product.minPrice) {
    return {
      sku: product.sku,
      name: product.name,
      oldPrice: product.myPrice,
      newPrice: product.minPrice,
      reason: "AT_MIN",
    };
  }

  if (targetPrice >= product.maxPrice) {
    return {
      sku: product.sku,
      name: product.name,
      oldPrice: product.myPrice,
      newPrice: product.maxPrice,
      reason: "AT_MAX",
    };
  }

  return {
    sku: product.sku,
    name: product.name,
    oldPrice: product.myPrice,
    newPrice: targetPrice,
    reason: "UNDERCUT",
  };
}
