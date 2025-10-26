import crypto from "crypto";

export interface ContactData {
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

export function escapeXml(input?: string): string {
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

export function generateETag(contact: ContactData): string {
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

export function generateCTag(contacts: ContactData[]): string {
  // CTag changes when collection changes (add/edit/delete)
  // Hash the list of contact IDs and their ETags
  const collectionData = contacts
    .map(c => generateETag(c))
    .sort()
    .join(',');

  const hash = crypto.createHash("md5").update(collectionData).digest("hex");
  return hash.substring(0, 16);
}

export function encodeSyncToken(contacts: ContactData[]): string {
  // Encode contact IDs and their ETags into the sync token
  // Format: base64(contactId1:etag1,contactId2:etag2,...)
  const data = contacts
    .map(c => `${c.id}:${generateETag(c)}`)
    .sort()
    .join(',');
  return Buffer.from(data, 'utf-8').toString('base64');
}

export function decodeSyncToken(token: string): Map<string, string> {
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

export function generateVCard(contact: ContactData): string {
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