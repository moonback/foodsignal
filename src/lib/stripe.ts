const STRIPE_API = "https://api.stripe.com";

export function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  return key;
}

export async function stripeRequest<T>(path: string, method: "GET" | "POST", params?: URLSearchParams, idempotencyKey?: string): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeSecretKey()}`,
  };
  if (params) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers,
    body: method === "POST" ? params?.toString() ?? "" : undefined,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || "Stripe a refusé la requête.";
    const error = new Error(message);
    Object.assign(error, { status: response.status, code: payload?.error?.code });
    throw error;
  }
  return payload as T;
}

export function appBaseUrl() {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) throw new Error("APP_URL_NOT_CONFIGURED");
  return value.replace(/\/$/, "");
}

export function platformFeeAmount(totalCents: number) {
  const raw = process.env.FOOD_SIGNAL_PLATFORM_FEE_BPS;
  if (raw === undefined || raw.trim() === "") throw new Error("PLATFORM_FEE_NOT_CONFIGURED");
  const bps = Number(raw);
  if (!Number.isInteger(bps) || bps < 0 || bps > 3000) throw new Error("PLATFORM_FEE_INVALID");
  return Math.floor((totalCents * bps) / 10000);
}
