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

// Dummy static contacts data
// TODO: pull this from database instead
const DUMMY_CONTACTS = [
  {
    id: "contact-1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-0100",
  },
  {
    id: "contact-2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+1-555-0200",
  },
  {
    id: "contact-3",
    firstName: "Bob",
    lastName: "Johnson",
    email: "bob.johnson@example.com",
    phone: "+1-555-0300",
  },
];

function generateVCard(contact: (typeof DUMMY_CONTACTS)[0]): string {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  return `BEGIN:VCARD
VERSION:3.0
UID:${contact.id}
FN:${fullName}
N:${contact.lastName};${contact.firstName};;;
EMAIL;TYPE=INTERNET:${contact.email}
TEL;TYPE=CELL:${contact.phone}
REV:2024-01-01T00:00:00Z
END:VCARD`;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    res.status(400).send("Missing or invalid user ID");
    return;
  }

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "OPTIONS, PROPFIND, REPORT, GET");
    res.setHeader("DAV", "1, 2, 3, addressbook");
    res.status(200).end();
    return;
  }

  if (req.method !== "PROPFIND" && req.method !== "REPORT") {
    res.setHeader("Allow", "OPTIONS, PROPFIND, REPORT, GET");
    res.status(405).send(`Method ${req.method} Not Allowed`);
    return;
  }

  // Validate authentication
  const auth = validateBasicAuth(req);
  if (!auth.authenticated || !auth.userId) {
    sendUnauthorized(res);
    return;
  }

  // Verify user can only access their own contacts
  if (auth.userId !== id) {
    res.status(403).send("Forbidden");
    return;
  }

  const userId = escapeXml(id);

  // Handle REPORT method - returns vCard data inline
  if (req.method === "REPORT") {
    const entries = DUMMY_CONTACTS.map((contact) => {
      const href = escapeXml(
        `/api/addressbooks/users/${userId}/contacts/${contact.id}.vcf`,
      );
      const etag = escapeXml(`"${contact.id}-v1"`);
      const vcard = generateVCard(contact);

      return `
  <response>
    <href>${href}</href>
    <propstat>
      <prop>
        <getetag>${etag}</getetag>
        <C:address-data>${escapeXml(vcard)}</C:address-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>`;
    }).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
${entries}
</multistatus>`.trim();

    res.status(207);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("DAV", "1, 2, 3, addressbook");
    res.send(xml);
    return;
  }

  // Handle PROPFIND method - returns metadata only
  const entries = DUMMY_CONTACTS.map((contact) => {
    const href = escapeXml(
      `/api/addressbooks/users/${userId}/contacts/${contact.id}.vcf`,
    );
    const displayName = escapeXml(
      `${contact.firstName} ${contact.lastName}`.trim(),
    );
    const etag = escapeXml(`"${contact.id}-v1"`);

    return `
  <response>
    <href>${href}</href>
    <propstat>
      <prop>
        <displayname>${displayName}</displayname>
        <getcontenttype>text/vcard; charset=utf-8</getcontenttype>
        <getetag>${etag}</getetag>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
${entries}
</multistatus>`.trim();

  res.status(207);
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("DAV", "1, 2, 3, addressbook");
  res.send(xml);
}
