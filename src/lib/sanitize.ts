export function cleanText(s: string, max = 5000) {
  return s.replace(/[<>]/g, "").trim().slice(0, max);
}