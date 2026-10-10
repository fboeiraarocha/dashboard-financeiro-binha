import { SignJWT, jwtVerify } from "jose";
import { sessionSecret } from "./env";

export const SESSION_COOKIE = "df_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(sessionSecret());
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
