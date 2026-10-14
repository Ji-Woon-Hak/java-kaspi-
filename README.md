# Перерасчёт цен

Приложение состоит из чистой функции расчёта цены, Express API и React-интерфейса на Vite.

## Запуск

```powershell
npm.cmd install
npm.cmd run dev
```

Vite откроет интерфейс по адресу `http://localhost:5173` и перенаправит запросы `/reprice` к Express на порту `3001`.

Для проверки типов и production-сборки:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd start
```

После сборки Express обслуживает интерфейс и API на `http://localhost:3001`. Порт API можно изменить переменной окружения `PORT`.

## API

`POST /reprice` принимает JSON-массив товаров. Каждый товар должен содержать:

| Поле | Тип | Описание |
| --- | --- | --- |
| `sku` | string | Артикул |
| `name` | string | Название |
| `myPrice` | number | Текущая цена |
| `minPrice` | number | Минимально допустимая цена |
| `maxPrice` | number | Максимально допустимая цена |
| `step` | number | Шаг снижения цены относительно конкурента |
| `competitors` | array | Конкуренты с числовой `price` и булевым `inStock` |

Цена рассчитывается ниже минимальной цены конкурента в наличии на величину `step`, но не выходит за диапазон `minPrice`–`maxPrice`. Если конкурентов в наличии нет, текущая цена округляется и ограничивается этим диапазоном. Ответ содержит `sku`, `name`, `oldPrice`, `newPrice` и причину расчёта.

Пример:

```json
[
  {
    "sku": "KB-104",
    "name": "Механическая клавиатура",
    "myPrice": 8500,
    "minPrice": 7000,
    "maxPrice": 12000,
    "step": 100,
    "competitors": [
      { "price": 7900, "inStock": true },
      { "price": 7600, "inStock": false }
    ]
  }
]
```
