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

  const [nickname, setNickname] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

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

  const handleSave = () => {
    toast.promise(
      updateContact.mutateAsync({ nickname, firstName, lastName, email }),
      {
        success: async () => {
          await utils.contact.get.refetch();
          // update original to current values so the form is no longer "dirty"
          setOriginal({ nickname, firstName, lastName, email });
          return "Contact updated successfully";
        },
        loading: "Saving...",
        error: (e?: Error) => e?.message ?? "An unknown error has occurred.",
      },
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
          <Button
            type="submit"
            onClick={() => handleSave()}
            className={`transition-all duration-150 ${
              isDirty
                ? "shadow-md ring-2 ring-blue-400 ring-offset-2"
                : "opacity-90"
            }`}
          >
            Save
          </Button>
          <Label>Optional fields can be left blank</Label>
        </div>
      </div>
    </div>
  );
}
