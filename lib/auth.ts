import * as jose from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-me"
);

export interface JWTPayload {
  sub: string; // user id (employee id or "admin")
  email: string;
  role: "admin" | "employee";
  employeeCode?: string;
  iat?: number;
  exp?: number;
}

export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">) {
  return await new jose.SignJWT(payload as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      clockTolerance: "5 mins"
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("JWT Verification Failed:", error);
    return null;
  }
}

export async function getAuthFromCookies(expectedRole?: "admin" | "employee" | "any"): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    
    if (expectedRole === "admin") {
      const adminTokens = cookieStore.getAll("admin_token");
      for (const tokenObj of adminTokens) {
        if (!tokenObj.value) continue;
        const payload = await verifyToken(tokenObj.value);
        if (payload) {
          if (payload.role !== "admin") return null;
          return payload;
        }
      }
      return null;
    } 
    
    if (expectedRole === "employee") {
      const employeeTokens = cookieStore.getAll("employee_token");
      for (const tokenObj of employeeTokens) {
        if (!tokenObj.value) continue;
        const payload = await verifyToken(tokenObj.value);
        if (payload) {
          if (payload.role !== "admin") {
            const emp = await (prisma as any).employee.findUnique({ where: { id: payload.sub }, select: { status: true } });
            if (!emp || emp.status !== "Active") return null;
          }
          return payload;
        }
      }
      return null;
    }

    // "any" fallback
    const allAdminTokens = cookieStore.getAll("admin_token");
    for (const tokenObj of allAdminTokens) {
      if (!tokenObj.value) continue;
      const payload = await verifyToken(tokenObj.value);
      if (payload) return payload;
    }

    const allEmployeeTokens = cookieStore.getAll("employee_token");
    for (const tokenObj of allEmployeeTokens) {
      if (!tokenObj.value) continue;
      const payload = await verifyToken(tokenObj.value);
      if (payload) {
        if (payload.role !== "admin") {
          const emp = await (prisma as any).employee.findUnique({ where: { id: payload.sub }, select: { status: true } });
          if (!emp || emp.status !== "Active") continue;
        }
        return payload;
      }
    }

    // legacy fallback
    const oldToken = cookieStore.get("auth_token")?.value;
    if (oldToken) return await verifyToken(oldToken);

    return null;
  } catch {
    return null;
  }
}

export function setAuthCookie(res: Response, token: string, role: string = "employee") {
  const cookieName = role === "admin" ? "admin_token" : "employee_token";
  res.headers.append(
    "Set-Cookie",
    `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${8 * 3600}${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );
}

export function clearAuthCookie(res: Response, role: string = "employee") {
  const cookieName = role === "admin" ? "admin_token" : "employee_token";
  res.headers.append(
    "Set-Cookie",
    `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
  );
}
