function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

export async function apiFetch(url: string, options: RequestInit = {}) {
  const csrf = getCookie("csrf");

  const headers = new Headers(options.headers || {});
  if (csrf) {
    headers.set("x-csrf-token", csrf);
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: "include", 
  });
}