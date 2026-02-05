export const CART_LS_KEY = "cartPremiumRecipeIds";

export function getCart(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function setCart(ids: string[]) {
  localStorage.setItem(CART_LS_KEY, JSON.stringify(ids));
}

export function addToCart(id: string) {
  const cart = getCart();
  if (!cart.includes(id)) {
    cart.push(id);
    setCart(cart);
  }
}

export function removeFromCart(id: string) {
  const cart = getCart().filter((x) => x !== id);
  setCart(cart);
}
