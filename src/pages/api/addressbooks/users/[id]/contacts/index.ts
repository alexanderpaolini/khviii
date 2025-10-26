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
    linkedin: contact.linkedin,
    pronouns: contact.pronouns,
    company: contact.company,
    address: contact.address,
    birthday: contact.birthday?.toISOString(),
  });

  const hash = crypto.createHash("md5").update(contactData).digest("hex");
  return `"${contact.id}-${hash.substring(0, 8)}"`;
}

function generateCTag(contacts: ContactData[]): string {
  // CTag changes when collection changes (add/edit/delete)
  // Hash the list of contact IDs and their ETags
  const collectionData = contacts
    .map(c => generateETag(c))
    .sort()
    .join(',');

  const hash = crypto.createHash("md5").update(collectionData).digest("hex");
  return hash.substring(0, 16);
}

function encodeSyncToken(contacts: ContactData[]): string {
  // Encode contact IDs and their ETags into the sync token
  // Format: base64(contactId1:etag1,contactId2:etag2,...)
  const data = contacts
    .map(c => `${c.id}:${generateETag(c)}`)
    .sort()
    .join(',');
  return Buffer.from(data, 'utf-8').toString('base64');
}

function decodeSyncToken(token: string): Map<string, string> {
  // Decode sync token to get previous contact IDs and ETags
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const map = new Map<string, string>();
    if (decoded) {
      decoded.split(',').forEach(entry => {
        const [id, etag] = entry.split(':');
        if (id && etag) {
          map.set(id, etag);
        }
      });
    }
    return map;
  } catch (err) {
    // Invalid token, return empty map
    return new Map();
  }
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
  linkedin: string | null;
  pronouns: string | null;
  company: string | null;
  address: string | null;
  birthday: Date | null;
}

function generateVCard(contact: ContactData): string {
  const firstName = contact.firstName ?? "";
  const lastName = contact.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";

  let vcard = `BEGIN:VCARD\nVERSION:4.0\nUID:${contact.id}\nFN:${fullName}\nN:${lastName};${firstName};;;`;
  let iloveapple = 1; // because of apple's weird social media inclusions for vcards since this is a dead format

  if (contact.email) vcard += `\nEMAIL;TYPE=INTERNET:${contact.email}`;
  if (contact.phoneNumber) vcard += `\nTEL;TYPE=CELL:${contact.phoneNumber}`;
  if (contact.nickname) vcard += `\nNICKNAME:${contact.nickname}`;
  if (contact.instagram) {
    vcard += `\nitem${iloveapple}.X-SOCIALPROFILE;X-USER=${contact.instagram}:https://instagram.com/${contact.instagram}`
    vcard += `\nitem${iloveapple}.X-ABLABEL:Instagram`
    iloveapple++;
  }
  if (contact.discord) {
    vcard += `\nitem${iloveapple}.X-SOCIALPROFILE;X-USER=${contact.discord}:https://discord.com`
    vcard += `\nitem${iloveapple}.X-ABLABEL:Discord`
    iloveapple++;
  }
  if (contact.linkedin) vcard += `\nX-SOCIALPROFILE;X-USER=${contact.linkedin};TYPE=linkedin:https://linkedin.com/in/${contact.linkedin}`;
  if (contact.company) vcard += `\nORG:${contact.company}`;
  if (contact.address) vcard += `\nADR;TYPE=HOME:;;${contact.address};;;;`;
  if (contact.birthday) {
    const year = contact.birthday.getFullYear();
    const month = String(contact.birthday.getMonth() + 1).padStart(2, "0");
    const day = String(contact.birthday.getDate()).padStart(2, "0");
    vcard += `\nBDAY:${year}-${month}-${day}`;
  }
  if (contact.pronouns) vcard += contact.pronouns ? `\nX-PRONOUNS:${contact.pronouns}` : ``;

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
    try {
      // Need to fetch contacts to generate accurate CTag
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

      const friendContacts: ContactData[] = [];
      for (const friendship of user.friendsA) {
        if (friendship.userB.contact) {
          friendContacts.push(friendship.userB.contact);
        }
      }
      for (const friendship of user.friendsB) {
        if (friendship.userA.contact) {
          friendContacts.push(friendship.userA.contact);
        }
      }

      const ctag = generateCTag(friendContacts);
      const syncToken = encodeSyncToken(friendContacts);
      console.log(`[CONTACTS] Returning Depth:0 response with ctag: ${ctag} (${friendContacts.length} contacts)`);
      friendContacts.forEach(c => {
        const name = `${c.firstName} ${c.lastName}`.trim();
        console.log(`[CONTACTS]   Depth:0 - ${name} (${c.id})`);
      });

      // i hate multiline strings like this
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
        <CS:getctag>${ctag}</CS:getctag>
        <sync-token>${syncToken}</sync-token>
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
    } catch (error) {
      console.error("Database error:", error);
      res.status(500).send("Internal Server Error");
      return;
    }
  }

  // find user relations
  try {
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

    // flatten that
    const friendContacts: ContactData[] = [];

    for (const friendship of user.friendsA) {
      if (friendship.userB.contact) {
        friendContacts.push(friendship.userB.contact);
      }
    }
    for (const friendship of user.friendsB) {
      if (friendship.userA.contact) {
        friendContacts.push(friendship.userA.contact);
      }
    }


    // REPORT requested
    if (req.method === "REPORT") {
      const requestBody = req.body?.toString() || '';
      const isSyncCollection = requestBody.includes('sync-collection') || requestBody.includes('sync-token');

      if (isSyncCollection) {
        // we are resyncing
        const oldTokenMatch = requestBody.match(/<sync-token>(.*?)<\/sync-token>/);

        const oldSyncToken = oldTokenMatch ? oldTokenMatch[1] : null;
        const newSyncToken = encodeSyncToken(friendContacts);

        const previousContacts = oldSyncToken ? decodeSyncToken(oldSyncToken) : new Map<string, string>();
        const currentContactIds = new Set(friendContacts.map(c => c.id));
        const deletedContactIds = Array.from(previousContacts.keys()).filter(
          id => !currentContactIds.has(id)
        );

        // logging
        console.log(`[CONTACTS] Sync-collection REPORT - Old token: ${oldSyncToken?.substring(0, 20)}...`);
        console.log(`[CONTACTS] Previous: ${previousContacts.size} contacts, Current: ${friendContacts.length} contacts`);
        console.log(`[CONTACTS] Deleted: ${deletedContactIds.length} contacts`);
        
        if (deletedContactIds.length > 0) console.log(`[CONTACTS] Deleted IDs: ${deletedContactIds.join(', ')}`);

        const currentEntries = friendContacts.map((contact) => {
          const href = `/api/addressbooks/users/${userId}/contacts/${contact.id}.vcf`;
          const etag = generateETag(contact);
          const vcard = generateVCard(contact);

          return `
  <response>
    <href>${escapeXml(href)}</href>
    <propstat>
      <prop>
        <getetag>${escapeXml(etag)}</getetag>
        <C:address-data>${escapeXml(vcard)}</C:address-data>
      </prop>
      <status>HTTP/1.1 200 OK</status>
    </propstat>
  </response>`;
        }).join("");

        // Build response entries for deleted contacts (RFC 6578 format)
        const deletedEntries = deletedContactIds.map((contactId) => {
          const href = `/api/addressbooks/users/${userId}/contacts/${contactId}.vcf`;
          return `
  <response>
    <href>${escapeXml(href)}</href>
    <status>HTTP/1.1 404 Not Found</status>
  </response>`;
        }).join("");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<multistatus xmlns="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
${currentEntries}${deletedEntries}
  <sync-token>${escapeXml(newSyncToken)}</sync-token>
</multistatus>`.trim();

        console.log(`[CONTACTS] XML response length: ${xml.length} bytes`);
        res.status(207);
        res.setHeader("Content-Type", "application/xml; charset=utf-8");
        res.setHeader("DAV", "1, 2, 3, addressbook");
        res.send(xml);
        return;
      }

      // Regular addressbook-query REPORT
      console.log(`[CONTACTS] Regular REPORT returning ${friendContacts.length} contacts`);
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
