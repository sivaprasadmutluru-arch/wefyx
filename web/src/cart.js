const STORAGE_KEY = "wefyx-customer-cart";
export const CART_EVENT = "wefyx-cart-changed";

export function loadCart() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  const clean = Array.isArray(items) ? items : [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: clean }));
  return clean;
}

export function addToCart(product) {
  const items = loadCart();
  const key = `${product.id}:${product.mode || "RENT"}`;
  const found = items.find((item) => `${item.id}:${item.mode || "RENT"}` === key);
  const next = found
    ? items.map((item) =>
        `${item.id}:${item.mode || "RENT"}` === key
          ? { ...item, ...product, quantity: Number(item.quantity || 1) + Number(product.quantity || 1), selected: true }
          : item,
      )
    : [...items, { quantity: 1, months: 1, rentalPeriod: "MONTH", rentalDuration: 1, startDate: new Date().toISOString().slice(0,10), selected: true, mode: "RENT", ...product }];
  return saveCart(next);
}

export function clearCart() {
  return saveCart([]);
}

export function cartCount(items = loadCart()) {
  return items.reduce((total, item) => total + Number(item.quantity || 1), 0);
}
