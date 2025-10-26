"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { InputGroup } from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";

export function ContactInput() {
  const { data } = api.contact.get.useQuery();

  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!data) return;
    setNickname(data.nickname ?? "");
    setFirstName(data.firstName ?? "");
    setLastName(data.lastName ?? "");
    setEmail(data.email ?? "");
  }, [data]);

  const utils = api.useUtils();
  const updateContact = api.contact.update.useMutation();

  const handleSave = () => {
    updateContact.mutate(
      { nickname, firstName, lastName, email },
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
        Fill out your contact to automatically sync with friends.
      </p>

      <div className="flex flex-col gap-3">
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

        <div className="mt-2 flex items-center justify-between gap-2">
          <Button type="submit" onClick={() => handleSave()}>
            Save
          </Button>
          <Label>Optional fields can be left blank</Label>
        </div>
      </div>
    </div>
  );
}
