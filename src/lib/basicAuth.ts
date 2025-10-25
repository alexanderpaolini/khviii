import type { NextApiRequest, NextApiResponse } from "next";

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
}

/**
 * Simple basic auth validator
 * For MVP: accepts any username/password combination
 * The username becomes the userId
 */
export function validateBasicAuth(req: NextApiRequest): AuthResult {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
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

    // For MVP: accept any credentials, use username as userId
    return {
      authenticated: true,
      userId: username,
    };
  } catch (err) {
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
