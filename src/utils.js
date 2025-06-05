export function formatCurrency(amount, locale = "en-US", currency = "NGN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(Math.abs(amount));
}

export function getBaseUrl() {
  // In production, use the actual domain
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  // In development, you can still use localhost
  return "http://localhost:5173";
}
