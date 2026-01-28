export const PREMIUM_LS_KEY = "isPremiumUser";

export function getIsPremiumUser(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREMIUM_LS_KEY) === "true";
}

export function setIsPremiumUser(value: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREMIUM_LS_KEY, value ? "true" : "false");
}
