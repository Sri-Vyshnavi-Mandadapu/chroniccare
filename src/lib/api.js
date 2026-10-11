let csrf = "";
export async function prepareSignIn() {
  const response = await fetch("/api/auth/csrf", {
    credentials: "same-origin",
  });
  const json = await response.json();
  if (!response.ok)
    throw new Error("Could not initialize sign in. Please retry.");
  csrf = json.data.csrf;
}
export async function api(path, options = {}) {
  if (["/auth/login", "/auth/register"].includes(path)) await prepareSignIn();
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      signal: controller.signal,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await response.json();
    if (!response.ok)
      throw Object.assign(new Error(json.error?.message || "Request failed"), {
        status: response.status,
      });
    if (json.data?.csrf) csrf = json.data.csrf;
    return json.data;
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error("Request timed out. Please try again.");
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
