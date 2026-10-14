import { useState } from "react";
import type { PriceReason, PriceResult, Product } from "./types";

const initialProducts: Product[] = [
  {
    sku: "KB-104",
    name: "Механическая клавиатура",
    myPrice: 8500,
    minPrice: 7000,
    maxPrice: 12000,
    step: 100,
    competitors: [
      { price: 8200, inStock: true },
      { price: 7900, inStock: true },
      { price: 7600, inStock: false },
    ],
  },
  {
    sku: "MS-208",
    name: "Беспроводная мышь",
    myPrice: 2400,
    minPrice: 1800,
    maxPrice: 4000,
    step: 50,
    competitors: [{ price: 1750, inStock: true }],
  },
  {
    sku: "HD-310",
    name: "Наушники с микрофоном",
    myPrice: 5200,
    minPrice: 4000,
    maxPrice: 8000,
    step: 100,
    competitors: [],
  },
];

const reasonLabels: Record<PriceReason, string> = {
  NO_COMPETITORS: "Нет конкурентов в наличии",
  AT_MIN: "Минимальная цена",
  AT_MAX: "Максимальная цена",
  UNDERCUT: "Ниже цены конкурента",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(price);

function isPriceResult(value: unknown): value is PriceResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "sku" in value &&
    typeof value.sku === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "oldPrice" in value &&
    typeof value.oldPrice === "number" &&
    "newPrice" in value &&
    typeof value.newPrice === "number" &&
    "reason" in value &&
    typeof value.reason === "string" &&
    Object.hasOwn(reasonLabels, value.reason)
  );
}

export default function App() {
  const [productsJson, setProductsJson] = useState(
    JSON.stringify(initialProducts, null, 2),
  );
  const [results, setResults] = useState<PriceResult[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function repriceProducts(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResults([]);

    let products: unknown;
    try {
      products = JSON.parse(productsJson);
    } catch {
      setError("Проверьте JSON: не удалось разобрать список товаров.");
      return;
    }

    if (!Array.isArray(products)) {
      setError("Введите массив товаров в формате JSON.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/reprice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "Не удалось пересчитать цены.";
        throw new Error(message);
      }
      if (!Array.isArray(body) || !body.every(isPriceResult)) {
        throw new Error("Сервер вернул ответ в неожиданном формате.");
      }
      setResults(body);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось связаться с сервером.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="eyebrow">ИНСТРУМЕНТ ПЕРЕОЦЕНКИ</div>
        <h1>Перерасчёт цен</h1>
        <p>Сравните цены с конкурентами и получите рекомендуемую цену товара.</p>
      </header>

      <form className="panel input-panel" onSubmit={repriceProducts}>
        <div className="section-heading">
          <div>
            <h2>Товары</h2>
            <p>Передайте массив товаров в формате JSON.</p>
          </div>
          <span className="method-badge">POST /reprice</span>
        </div>
        <label className="sr-only" htmlFor="products">
          Товары в формате JSON
        </label>
        <textarea
          id="products"
          spellCheck={false}
          value={productsJson}
          onChange={(event) => setProductsJson(event.target.value)}
        />
        <div className="form-footer">
          <span>Цены конкурентов учитываются, только если товар в наличии.</span>
          <button type="submit" disabled={loading}>
            {loading ? "Считаем…" : "Пересчитать цены"}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <section className="panel results-panel" aria-live="polite">
          <div className="section-heading">
            <div>
              <h2>Результаты</h2>
              <p>Старая и рассчитанная цена для каждого товара.</p>
            </div>
            <span className="result-count">{results.length} товаров</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Название</th>
                  <th>Старая цена</th>
                  <th>Новая цена</th>
                  <th>Причина</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={`${result.sku}-${index}`}>
                    <td className="sku">{result.sku}</td>
                    <td className="product-name">{result.name}</td>
                    <td>{formatPrice(result.oldPrice)}</td>
                    <td className="new-price">{formatPrice(result.newPrice)}</td>
                    <td>
                      <span className={`reason reason-${result.reason.toLowerCase()}`}>
                        {reasonLabels[result.reason]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
