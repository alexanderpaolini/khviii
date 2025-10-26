import { db } from "~/server/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { validateBasicAuth, sendUnauthorized } from "~/lib/basicAuth";
import {
  type ContactData,
  escapeXml,
  generateETag,
  generateCTag,
  encodeSyncToken,
  decodeSyncToken,
  generateVCard,
} from "~/lib/addressbook";

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
