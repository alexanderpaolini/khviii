import { db } from "~/server/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { validateBasicAuth, sendUnauthorized } from "~/lib/basicAuth";
import {
  type ContactData,
  generateETag,
  generateVCard,
} from "~/lib/addressbook";

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
    // Extract only ContactData fields
    const contactData: ContactData = {
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
      birthday: contact.birthday,
    };

    const vcard = generateVCard(contactData);
    const etag = generateETag(contactData);

    res.status(200);
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("ETag", etag);
    res.send(vcard);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Internal Server Error");
  }
}
