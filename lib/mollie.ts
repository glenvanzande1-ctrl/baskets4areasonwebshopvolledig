const MOLLIE_API = "https://api.mollie.com/v2";

function apiKey() {
  const raw = process.env.MOLLIE_API_KEY;

  if (!raw) throw new Error("MOLLIE_API_KEY ontbreekt.");

  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  key = key.replace(/^Bearer\s+/i, "").trim();

  if (!/^(test|live)_[A-Za-z0-9]+$/.test(key)) {
    throw new Error(
      "MOLLIE_API_KEY heeft een ongeldig formaat. Gebruik alleen de volledige test_... of live_... API-key."
    );
  }

  return key;
}

export function appUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

async function mollieFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${MOLLIE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mollie API ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export type MolliePayment = {
  id: string;
  status:
    | "open"
    | "pending"
    | "authorized"
    | "paid"
    | "failed"
    | "canceled"
    | "expired";
  method?: string | null;
  amount: { value: string; currency: string };
  metadata?: { orderId?: string; orderNumber?: string } | string | null;
  _links?: { checkout?: { href?: string } };
};

export async function createMolliePayment(input: {
  orderId: string;
  orderNumber: string;
  amount: string;
}) {
  const base = appUrl();

  const body: Record<string, unknown> = {
    amount: { currency: "EUR", value: input.amount },
    description: `Baskets4areason ${input.orderNumber}`,
    redirectUrl: `${base}/bestelling/${encodeURIComponent(input.orderNumber)}`,
    metadata: { orderId: input.orderId, orderNumber: input.orderNumber },
    locale: "nl_BE",
  };

  if (!base.includes("localhost") && !base.includes("127.0.0.1")) {
    body.webhookUrl = `${base}/api/mollie/webhook`;
  }

  return mollieFetch<MolliePayment>("/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMolliePayment(paymentId: string) {
  return mollieFetch<MolliePayment>(
    `/payments/${encodeURIComponent(paymentId)}`
  );
}
