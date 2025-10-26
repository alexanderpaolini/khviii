import { db } from "~/server/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { validateBasicAuth, sendUnauthorized } from "~/lib/basicAuth";
import crypto from "crypto";

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

function generateVCard(contact: ContactData): string {
  const firstName = contact.firstName ?? "";
  const lastName = contact.lastName ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";

  let vcard = `BEGIN:VCARD\nVERSION:4.0\nUID:${contact.id}\nFN:${fullName}\nN:${lastName};${firstName};;;`;

  if (contact.email) vcard += `\nEMAIL;TYPE=INTERNET:${contact.email}`;
  if (contact.phoneNumber) vcard += `\nTEL;TYPE=CELL:${contact.phoneNumber}`;
  if (contact.nickname) vcard += `\nNICKNAME:${contact.nickname}`;
  if (contact.instagram) vcard += `\nX-SOCIALPROFILE;TYPE=instagram:${contact.instagram}`;
  if (contact.discord) vcard += `\nX-SOCIALPROFILE;TYPE=discord:${contact.discord}`;
  if (contact.company) vcard += `\nORG:${contact.company}`;
  if (contact.address) vcard += `\nADR;TYPE=HOME:;;${contact.address};;;;`;
  if (contact.birthday) {
    const year = contact.birthday.getFullYear();
    const month = String(contact.birthday.getMonth() + 1).padStart(2, "0");
    const day = String(contact.birthday.getDate()).padStart(2, "0");
    vcard += `\nBDAY:${year}${month}${day}`;
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
  const { id, contactId } = req.query;

  if (!id || Array.isArray(id) || !contactId || Array.isArray(contactId)) {
    res.status(400).send("Missing or invalid parameters");
    return;
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "OPTIONS, GET");
    res.setHeader("DAV", "1, 2, 3, addressbook");
    res.status(200).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "OPTIONS, GET");
    res.status(405).send(`Method ${req.method} Not Allowed`);
    return;
  }

  const auth = await validateBasicAuth(req);
  if (!auth.authenticated || !auth.userId) {
    sendUnauthorized(res);
    return;
  }

  if (auth.userId !== id) {
    res.status(403).send("Forbidden");
    return;
  }

  // remove extension from contactid
  const cleanContactId = contactId.replace(/\.vcf$/, "");

  // try and find the requested contact, if it's real and they're friends, serve it
  try {
    const contact = await db.contact.findUnique({
      where: { id: cleanContactId },
      include: {
        user: {
          include: {
            friendsA: { where: { userBId: id } },
            friendsB: { where: { userAId: id } },
          },
        },
      },
    });

    if (!contact) {
      res.status(404).send("Contact not found");
      return;
    }

    const isFriend =
      contact.user.friendsA.length > 0 || contact.user.friendsB.length > 0;

    if (!isFriend) {
      res.status(403).send("You are not friends with this user");
      return;
    }

    // Generate and return vCard
    const vcard = generateVCard(contact);
    const etag = generateETag(contact);

    res.status(200);
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("ETag", etag);
    res.send(vcard);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
}
