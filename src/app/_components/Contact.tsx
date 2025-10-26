"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { InputGroup } from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";

export function ContactInput() {
  const { data } = api.contact.get.useQuery();

  // Basic info
  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  
  // Social media
  const [instagram, setInstagram] = useState("");
  const [discord, setDiscord] = useState("");
  const [linkedin, setLinkedin] = useState("");
  
  // Additional info
  const [pronouns, setPronouns] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");

  useEffect(() => {
    if (!data) return;
    setNickname(data.nickname ?? "");
    setFirstName(data.firstName ?? "");
    setLastName(data.lastName ?? "");
    setPhoneNumber(data.phoneNumber ?? "");
    setEmail(data.email ?? "");
    setInstagram(data.instagram ?? "");
    setDiscord(data.discord ?? "");
    setLinkedin(data.linkedin ?? "");
    setPronouns(data.pronouns ?? "");
    setCompany(data.company ?? "");
    setAddress(data.address ?? "");
    setBirthday((data.birthday ? new Date(data.birthday).toISOString().split('T')[0] : "") || "");
  }, [data]);

  const utils = api.useUtils();
  const updateContact = api.contact.update.useMutation();

  const handleSave = () => {
    const birthdayDate = birthday ? new Date(birthday) : undefined;
    
    updateContact.mutate(
      { 
        nickname: nickname || undefined, 
        firstName: firstName || undefined, 
        lastName: lastName || undefined, 
        phoneNumber: phoneNumber || undefined,
        email: email || undefined,
        instagram: instagram || undefined,
        discord: discord || undefined,
        linkedin: linkedin || undefined,
        pronouns: pronouns || undefined,
        company: company || undefined,
        address: address || undefined,
        birthday: birthdayDate
      },
      {
        onSuccess: async () => {
          console.log("Contact updated successfully");
          await utils.contact.get.refetch();
        },
        onError: (error) => {
          console.error("Failed to update contact:", error.message);
        },
      }
    );
  };

  return (
    <div className="rounded-xl bg-white/5 p-6 shadow-md backdrop-blur-sm">
      <h2 className="mb-2 text-lg font-semibold">Your Contact</h2>
      <p className="mb-4 text-sm font-light">
        Fill out your contact information to share with friends.
      </p>

      <div className="flex flex-col gap-4">
        {/* Basic Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Basic Information</h3>
          
          <InputGroup>
            <Input
              name="nickname"
              placeholder="Nickname"
              aria-label="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </InputGroup>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputGroup>
              <Input
                name="firstName"
                placeholder="First name"
                aria-label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <Input
                name="lastName"
                placeholder="Last name"
                aria-label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputGroup>
              <Input
                name="phoneNumber"
                type="tel"
                placeholder="Phone number"
                aria-label="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                aria-label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>

        {/* Social Media */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Social Media</h3>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InputGroup>
              <Input
                name="instagram"
                placeholder="Instagram"
                aria-label="Instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <Input
                name="discord"
                placeholder="Discord"
                aria-label="Discord"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <Input
                name="linkedin"
                placeholder="LinkedIn"
                aria-label="LinkedIn"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Additional Information</h3>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputGroup>
              <Input
                name="pronouns"
                placeholder="Pronouns (e.g., they/them)"
                aria-label="Pronouns"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
              />
            </InputGroup>
            <InputGroup>
              <Input
                name="company"
                placeholder="Company"
                aria-label="Company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </InputGroup>
          </div>

          <InputGroup>
            <Input
              name="address"
              placeholder="Address"
              aria-label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </InputGroup>

          <InputGroup>
            <Input
              name="birthday"
              type="date"
              placeholder="Birthday"
              aria-label="Birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button 
            type="submit" 
            onClick={() => handleSave()}
            disabled={updateContact.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {updateContact.isPending ? "Saving..." : "Save Contact"}
          </Button>
          <Label className="text-xs text-gray-400">All fields are optional</Label>
        </div>
      </div>
    </div>
  );
}
