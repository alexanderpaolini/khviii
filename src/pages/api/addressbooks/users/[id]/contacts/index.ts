import { db } from "~/server/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { validateBasicAuth, sendUnauthorized } from "~/lib/basicAuth";
import crypto from "crypto";

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

function generateETag(contact: ContactData): string {
  // Create a stable hash based on all contact fields
  const contactData = JSON.stringify({
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    nickname: contact.nickname,
    phoneNumber: contact.phoneNumber,
    email: contact.email,
    instagram: contact.instagram,
    discord: contact.discord,
    pronouns: contact.pronouns,
    company: contact.company,
    address: contact.address,
    birthday: contact.birthday?.toISOString(),
  });

  const hash = crypto.createHash("md5").update(contactData).digest("hex");
  return `"${contact.id}-${hash.substring(0, 8)}"`;
}

interface ContactData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  phoneNumber: string | null;
  email: string | null;
  instagram: string | null;
  discord: string | null;
  pronouns: string | null;
  company: string | null;
  address: string | null;
  birthday: Date | null;
}

function generateVCard(contact: ContactData): string {
  const firstName = contact.firstName ?? "";
  const lastName = contact.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";

  let vcard = `BEGIN:VCARD
VERSION:3.0
UID:${contact.id}
FN:${fullName}
N:${lastName};${firstName};;;`;

  if (contact.email) {
    vcard += `\nEMAIL;TYPE=INTERNET:${contact.email}`;
  }
  if (contact.phoneNumber) {
    vcard += `\nTEL;TYPE=CELL:${contact.phoneNumber}`;
  }
  if (contact.nickname) {
    vcard += `\nNICKNAME:${contact.nickname}`;
  }
  if (contact.instagram) {
    vcard += `\nX-SOCIALPROFILE;TYPE=instagram:${contact.instagram}`;
  }
  if (contact.discord) {
    vcard += `\nX-SOCIALPROFILE;TYPE=discord:${contact.discord}`;
  }
  if (contact.company) {
    vcard += `\nORG:${contact.company}`;
  }
  if (contact.address) {
    vcard += `\nADR;TYPE=HOME:;;${contact.address};;;;`;
  }
  if (contact.birthday) {
    const year = contact.birthday.getFullYear();
    const month = String(contact.birthday.getMonth() + 1).padStart(2, "0");
    const day = String(contact.birthday.getDate()).padStart(2, "0");
    vcard += `\nBDAY:${year}${month}${day}`;
  }
  if (contact.pronouns) {
    vcard += `\nX-PRONOUNS:${contact.pronouns}`;
  }

  vcard += `\nREV:2024-01-01T00:00:00Z`;
  vcard += `\nEND:VCARD`;

  return vcard;
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
  const auth = await validateBasicAuth(req);
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
  const depth = req.headers.depth || "1";

  // Log request details
  console.log(`[CONTACTS] ${req.method} - Depth: ${depth}, Body length: ${req.body ? JSON.stringify(req.body).length : 0}`);
  if (req.body) {
    console.log(`[CONTACTS] Request body:`, typeof req.body === 'string' ? req.body.substring(0, 200) : JSON.stringify(req.body).substring(0, 200));
  }

  // Handle Depth: 0 - return collection properties only (for ctag check)
  if (depth === "0" && req.method === "PROPFIND") {
    console.log(`[CONTACTS] Returning Depth:0 response with ctag`);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav" xmlns:CS="http://calendarserver.org/ns/">
  <response>
    <href>/api/addressbooks/users/${userId}/contacts/</href>
    <propstat>
      <prop>
        <resourcetype>
          <collection/>
          <C:addressbook/>
        </resourcetype>
        <displayname>Contacts</displayname>
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
    return;
  }

  // Query database for user and their friends' contacts
  try {
    // Look up user by ID
    const user = await db.user.findUnique({
      where: { id: id },
      include: {
        friendsA: {
          include: {
            userB: {
              include: { contact: true },
            },
          },
        },
        friendsB: {
          include: {
            userA: {
              include: { contact: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    // Collect all friends' contacts
    const friendContacts: ContactData[] = [];

    // Add contacts from friendsA (where user is userA)
    for (const friendship of user.friendsA) {
      if (friendship.userB.contact) {
        friendContacts.push(friendship.userB.contact);
      }
    }

    // Add contacts from friendsB (where user is userB)
    for (const friendship of user.friendsB) {
      if (friendship.userA.contact) {
        friendContacts.push(friendship.userA.contact);
      }
    }

    // Handle REPORT method - returns vCard data inline
    if (req.method === "REPORT") {
      console.log(`[CONTACTS] REPORT returning ${friendContacts.length} contacts`);
      friendContacts.forEach(c => {
        const name = `${c.firstName} ${c.lastName}`.trim();
        console.log(`[CONTACTS]   - ${name} (${c.id})`);
      });

      const entries = friendContacts.map((contact) => {
      const href = escapeXml(
        `/api/addressbooks/users/${userId}/contacts/${contact.id}.vcf`,
      );
      const etag = escapeXml(generateETag(contact));
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
    console.log(`[CONTACTS] PROPFIND Depth:${depth} returning ${friendContacts.length} contacts`);
    friendContacts.forEach(c => {
      const name = `${c.firstName} ${c.lastName}`.trim();
      console.log(`[CONTACTS]   - ${name} (${c.id})`);
    });

    const entries = friendContacts.map((contact) => {
      const href = escapeXml(
        `/api/addressbooks/users/${userId}/contacts/${contact.id}.vcf`,
      );
      const firstName = contact.firstName ?? "";
      const lastName = contact.lastName ?? "";
      const displayName = escapeXml(`${firstName} ${lastName}`.trim() || "Unknown");
      const etag = escapeXml(generateETag(contact));

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
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
}
