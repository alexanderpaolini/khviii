import type { NextApiRequest, NextApiResponse } from "next";
import { validateBasicAuth, sendUnauthorized } from "~/lib/basicAuth";

// Dummy static contacts data (same as in index.ts)
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

  // vCard 3.0 format
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
  const { id, contactId } = req.query;

  if (!id || Array.isArray(id) || !contactId || Array.isArray(contactId)) {
    res.status(400).send("Missing or invalid parameters");
    return;
  }

  // Handle OPTIONS
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

  // Remove .vcf extension if present
  const cleanContactId = contactId.replace(/\.vcf$/, "");

  // Find the contact
  const contact = DUMMY_CONTACTS.find((c) => c.id === cleanContactId);

  if (!contact) {
    res.status(404).send("Contact not found");
    return;
  }

  // Generate and return vCard
  const vcard = generateVCard(contact);

  res.status(200);
  res.setHeader("Content-Type", "text/vcard; charset=utf-8");
  res.setHeader("ETag", `"${contact.id}-v1"`);
  res.send(vcard);
}
