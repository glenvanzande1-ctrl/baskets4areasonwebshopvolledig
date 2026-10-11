import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const CUSTOMER_SESSION_COOKIE = "b4a_customer_session";
const duration = 60 * 60 * 24 * 30;

type CustomerPayload = { sub: string; email: string };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET moet minimaal 32 tekens bevatten.");
  return new TextEncoder().encode(value);
}

export async function createCustomerSessionToken(payload: CustomerPayload) {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${duration}s`)
    .sign(secret());
}

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return { customerId: payload.sub as string, email: payload.email as string };
  } catch {
    return null;
  }
}
