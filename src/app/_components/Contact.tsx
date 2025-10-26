"use client";

import { Button } from "~/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

export function ContactInput() {
  const { data } = api.contact.get.useQuery();
  // Basic info
  const [nickname, setNickname] = useState<string>(data?.nickname ?? "");
  const [firstName, setFirstName] = useState<string>(data?.firstName ?? "");
  const [lastName, setLastName] = useState<string>(data?.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState<string>(
    data?.phoneNumber ?? "",
  );
  const [email, setEmail] = useState<string>(data?.email ?? "");

  // Social media
  const [instagram, setInstagram] = useState<string>(data?.instagram ?? "");
  const [discord, setDiscord] = useState<string>(data?.discord ?? "");
  const [linkedin, setLinkedin] = useState<string>(data?.linkedin ?? "");

  // Additional info
  const [pronouns, setPronouns] = useState<string>(data?.pronouns ?? "");
  const [company, setCompany] = useState<string>(data?.company ?? "");
  const [address, setAddress] = useState<string>(data?.address ?? "");
  const [birthday, setBirthday] = useState<string>(
    data?.birthday ? new Date(data.birthday).toISOString().slice(0, 10) : "",
  );

  // keep an original snapshot to detect changes (dirty state)
  const [original, setOriginal] = useState({
    nickname: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    instagram: "",
    discord: "",
    linkedin: "",
    pronouns: "",
    company: "",
    address: "",
    birthday: "",
  });

  // sync incoming data into state + original snapshot
  useEffect(() => {
    const init = {
      nickname: data?.nickname ?? "",
      firstName: data?.firstName ?? "",
      lastName: data?.lastName ?? "",
      phoneNumber: data?.phoneNumber ?? "",
      email: data?.email ?? "",
      instagram: data?.instagram ?? "",
      discord: data?.discord ?? "",
      linkedin: data?.linkedin ?? "",
      pronouns: data?.pronouns ?? "",
      company: data?.company ?? "",
      address: data?.address ?? "",
      birthday: data?.birthday
        ? new Date(data.birthday).toISOString().slice(0, 10)
        : "",
    };

    // Initialize form fields from data
    setNickname(init.nickname);
    setFirstName(init.firstName);
    setLastName(init.lastName);
    setPhoneNumber(init.phoneNumber);
    setEmail(init.email);
    setInstagram(init.instagram);
    setDiscord(init.discord);
    setLinkedin(init.linkedin);
    setPronouns(init.pronouns);
    setCompany(init.company);
    setAddress(init.address);
    setBirthday(init.birthday);

    // store the original snapshot for dirty checking
    setOriginal(init);
  }, [data]);

  const utils = api.useUtils();
  const updateContact = api.contact.update.useMutation();

  const isFirstNameValid = firstName.trim().length > 0;
  const canSave = isFirstNameValid;

  // dirty check: true if any current field differs from the original snapshot
  const isDirty =
    nickname !== original.nickname ||
    firstName !== original.firstName ||
    lastName !== original.lastName ||
    phoneNumber !== original.phoneNumber ||
    email !== original.email ||
    instagram !== original.instagram ||
    discord !== original.discord ||
    linkedin !== original.linkedin ||
    pronouns !== original.pronouns ||
    company !== original.company ||
    address !== original.address ||
    birthday !== original.birthday;

  const handleSave = () => {
    if (!canSave) {
      toast.error("First name is required");
      return;
    }

    toast.promise(
      updateContact.mutateAsync({
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
        birthday: birthday ? new Date(birthday) : undefined,
      }),
      {
        success: async (d) => {
          await utils.contact.get.refetch();
          return "Contact updated!";
        },
        loading: "Saving...",
        error: (e?: Error) => e?.message ?? "An unknown error has occurred.",
      },
    );
  };

  let saveButtonClass = "opacity-90";
  if (canSave && isDirty) {
    saveButtonClass =
      "shadow-md relative before:content-[''] before:absolute before:-inset-1 before:rounded-lg before:ring-2 before:ring-purple-300 before:ring-offset-2 before:animate-pulse";
  }

  return (
    <div className="rounded-xl bg-white/5 p-6 shadow-md backdrop-blur-sm">
      <h2 className="mb-2 text-lg font-semibold">Your Contact</h2>
      <p className="mb-4 text-sm font-light">
        Fill out your contact information to share with friends.
      </p>

      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="col-span-1 sm:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs font-light">
                  <span className="w-full pl-3">First Name</span>
                  <span className="w-full pl-3">Last Name</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InputGroup>
                    <InputGroupInput
                      id="firstName"
                      name="firstName"
                      placeholder="First name (required)"
                      aria-label="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={
                        !isFirstNameValid && firstName.length > 0
                          ? "border-red-500"
                          : ""
                      }
                      required
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton
                          variant="ghost"
                          aria-label="Help"
                          className="ml-auto rounded-full"
                          size="icon-xs"
                        >
                          <InfoIcon />
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>First name is required to save your contact</p>
                      </TooltipContent>
                    </Tooltip>
                  </InputGroup>

                  <InputGroup>
                    <InputGroupInput
                      id="lastName"
                      name="lastName"
                      placeholder="Last name"
                      aria-label="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </InputGroup>
                </div>
              </div>
            </div>
          </div>

          <InputGroup>
            <InputGroupInput
              id="nickname"
              name="nickname"
              placeholder="Nickname"
              aria-label="Nickname"
              value={nickname}
              className="text-right"
              onChange={(e) => setNickname(e.target.value)}
            />
            <InputGroupAddon className="mr-2 flex items-center justify-end">
              <Label htmlFor="nickname">Nickname</Label>
            </InputGroupAddon>
          </InputGroup>

          <InputGroup>
            <InputGroupInput
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="Phone number"
              aria-label="Phone number"
              className="text-right"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <InputGroupAddon className="mr-2 flex items-center justify-end">
              <Label htmlFor="phoneNumber">Phone</Label>
            </InputGroupAddon>
          </InputGroup>

          <InputGroup>
            <InputGroupInput
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              aria-label="Email"
              className="text-right"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputGroupAddon className="mr-2 flex items-center justify-end">
              <Label htmlFor="email">Email</Label>
            </InputGroupAddon>
          </InputGroup>
        </div>

        {/* Social Media */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="col-span-1 sm:col-span-3">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs font-light">
                <span className="w-full pl-3">Instagram</span>
                <span className="w-full pl-3">Discord</span>
                <span className="w-full pl-3">LinkedIn</span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InputGroup>
                  <InputGroupInput
                    id="instagram"
                    name="instagram"
                    placeholder="Instagram"
                    aria-label="Instagram"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </InputGroup>
                <InputGroup>
                  <InputGroupInput
                    id="discord"
                    name="discord"
                    placeholder="Discord"
                    aria-label="Discord"
                    value={discord}
                    onChange={(e) => setDiscord(e.target.value)}
                  />
                </InputGroup>
                <InputGroup>
                  <InputGroupInput
                    id="linkedin"
                    name="linkedin"
                    placeholder="LinkedIn"
                    aria-label="LinkedIn"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                  />
                </InputGroup>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputGroup>
              <InputGroupInput
                id="pronouns"
                name="pronouns"
                placeholder="Pronouns (e.g., they/them)"
                aria-label="Pronouns"
                value={pronouns}
                className="text-right"
                onChange={(e) => setPronouns(e.target.value)}
              />
              <InputGroupAddon className="mr-2 flex items-center justify-end">
                <Label htmlFor="pronouns">Pronouns</Label>
              </InputGroupAddon>
            </InputGroup>

            <InputGroup>
              <InputGroupInput
                id="company"
                name="company"
                placeholder="Company"
                aria-label="Company"
                value={company}
                className="text-right"
                onChange={(e) => setCompany(e.target.value)}
              />
              <InputGroupAddon className="mr-2 flex items-center justify-end">
                <Label htmlFor="company">Company</Label>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <InputGroup>
            <InputGroupInput
              id="address"
              name="address"
              placeholder="Address"
              aria-label="Address"
              value={address}
              className="text-right"
              onChange={(e) => setAddress(e.target.value)}
            />
            <InputGroupAddon className="mr-2 flex items-center justify-end">
              <Label htmlFor="address">Address</Label>
            </InputGroupAddon>
          </InputGroup>

          <InputGroup>
            <InputGroupInput
              id="birthday"
              name="birthday"
              type="date"
              placeholder="Birthday"
              aria-label="Birthday"
              className="text-right"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
            <InputGroupAddon>
              <Label htmlFor="birthday">Birthday</Label>
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="mt-2 flex items-end justify-end gap-2">
          <Button
            type="submit"
            onClick={() => handleSave()}
            disabled={!canSave}
            className={saveButtonClass}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
