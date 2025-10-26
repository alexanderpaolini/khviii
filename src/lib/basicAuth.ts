import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
}

/**
 * Simple basic auth validator
 * Looks up user by ID (username should be the user ID like "user-bob")
 * For MVP: accepts any password
 */
export async function validateBasicAuth(
  req: NextApiRequest,
): Promise<AuthResult> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Basic ")) {
    return { authenticated: false };
  }

  try {
    // Decode Basic auth header
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [username, password] = credentials.split(":");

    if (!username || !password) {
      return { authenticated: false };
    }

    // Look up user by ID (username = user ID like "user-bob")
    const user = await db.user.findUnique({
      where: { id: username },
      select: { id: true },
    });

    if (!user) {
      return { authenticated: false };
    }

    // For MVP: accept any password, return actual user ID
    return {
      authenticated: true,
      userId: user.id,
    };
  } catch (err) {
    console.error("Auth error:", err);
    return { authenticated: false };
  }
}

/**
 * Sends 401 Unauthorized response
 */
export function sendUnauthorized(res: NextApiResponse): void {
  res.status(401);
  res.setHeader("WWW-Authenticate", 'Basic realm="CardDAV Server"');
  res.send("Unauthorized");
}
