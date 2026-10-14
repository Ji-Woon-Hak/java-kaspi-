export interface Competitor {
  price: number;
  inStock: boolean;
}

export interface Product {
  sku: string;
  name: string;
  myPrice: number;
  minPrice: number;
  maxPrice: number;
  step: number;
  competitors: Competitor[];
}

export type PriceReason = "NO_COMPETITORS" | "AT_MIN" | "AT_MAX" | "UNDERCUT";

export interface PriceResult {
  sku: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  reason: PriceReason;
}
