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
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    res.status(400).send("Missing or invalid user ID");
    return;
  }

  // Handle OPTIONS
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
  const auth = await validateBasicAuth(req);
  if (!auth.authenticated || !auth.userId) {
    sendUnauthorized(res);
    return;
  }

  // Verify user can only access their own addressbooks
  if (auth.userId !== id) {
    res.status(403).send("Forbidden");
    return;
  }

  // Return addressbook collection information
  const userId = escapeXml(id);
  const contactsHref = `/api/addressbooks/users/${userId}/contacts/`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav" xmlns:CS="http://calendarserver.org/ns/">
  <response>
    <href>/api/addressbooks/users/${userId}/</href>
    <propstat>
      <prop>
        <resourcetype>
          <collection/>
        </resourcetype>
        <displayname>Addressbooks for ${userId}</displayname>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>
  <response>
    <href>${contactsHref}</href>
    <propstat>
      <prop>
        <resourcetype>
          <collection/>
          <C:addressbook/>
        </resourcetype>
        <displayname>Contacts</displayname>
        <C:addressbook-description>Auto-updating contacts</C:addressbook-description>
        <CS:getctag>1</CS:getctag>
        <sync-token>1</sync-token>
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
