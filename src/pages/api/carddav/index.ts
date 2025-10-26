import type { NextApiRequest, NextApiResponse } from "next";
import { validateBasicAuth, sendUnauthorized } from "~/lib/basicAuth";

function escapeXml(input?: string) {
  if (!input) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  };
  return input.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  // Handle OPTIONS for capability discovery
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "OPTIONS, PROPFIND");
    res.setHeader("DAV", "1, 2, 3, addressbook");
    res.status(200).end();
    return;
  }

  if (req.method !== "PROPFIND") {
    res.setHeader("Allow", "OPTIONS, PROPFIND");
    res.status(405).send(`Method ${req.method} Not Allowed`);
    return;
  }

  // Validate authentication
  console.log('[CARDDAV] Auth header present:', !!req.headers.authorization);
  const auth = await validateBasicAuth(req);
  console.log('[CARDDAV] Auth result:', auth.authenticated ? `authenticated as ${auth.userId}` : 'failed');
  if (!auth.authenticated || !auth.userId) {
    sendUnauthorized(res);
    return;
  }

  const userId = auth.userId;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
  <response>
    <href>/api/carddav/</href>
    <propstat>
      <prop>
        <current-user-principal>
          <href>/api/principals/users/${escapeXml(userId)}/</href>
        </current-user-principal>
        <resourcetype>
          <collection/>
        </resourcetype>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
</multistatus>`.trim();

  res.status(207);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("DAV", "1, 2, 3, addressbook");
  res.send(xml);
}
