"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { InputGroup } from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

  // keep original values to detect changes (dirty state)
  const [original, setOriginal] = useState({
    nickname: data?.nickname,
    firstName: data?.firstName,
    lastName: data?.lastName,
    email: data?.email,
  });

  useEffect(() => {
    if (!data) return;
    const o = {
      nickname: data.nickname ?? "",
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      email: data.email ?? "",
    };
    setOriginal(o);
    setNickname(o.nickname);
    setFirstName(o.firstName);
    setLastName(o.lastName);
    setEmail(o.email);
  }, [data]);

  const utils = api.useUtils();
  const updateContact = api.contact.update.useMutation();

  const isDirty =
    nickname !== original.nickname ||
    firstName !== original.firstName ||
    lastName !== original.lastName ||
    email !== original.email;

  const isFirstNameValid = firstName.trim().length > 0;
  const canSave = isFirstNameValid;

  const handleSave = () => {
    if (!canSave) {
      toast.error("First name is required");
      return;
    }

    console.log("Contact updated successfully");
    updateContact.mutate(
      { 
        nickname, 
        firstName, 
        lastName, 
        email,
        phoneNumber,
        instagram,
        discord,
        linkedin,
        pronouns,
        company,
        address,
        birthday: birthday ? new Date(birthday) : undefined
      },
      {
        onSuccess: async () => {
          await utils.contact.get.refetch();
          setOriginal({ nickname, firstName, lastName, email });
        },
        onError: (error) => {
          console.error("Error updating contact:", error.message);
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
                placeholder="First name (required)"
                aria-label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={!isFirstNameValid && firstName.length > 0 ? "border-red-500" : ""}
                required
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

        <div className="mt-2 flex items-center justify-between gap-2">
          <Button
            type="submit"
            onClick={() => handleSave()}
            disabled={!canSave}
            className={`transition-all duration-150 ${
              canSave && isDirty
                ? "shadow-md ring-2 ring-blue-400 ring-offset-2"
                : "opacity-90"
            }`}
          >
            Save
          </Button>
          <Label className="text-xs text-gray-400">First name is required *</Label>
        </div>
      </div>
    </div>
  );
}
