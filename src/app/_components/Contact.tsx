"use client";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { InputGroup } from "~/components/ui/input-group";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

export function ContactInput() {
  const { data } = api.contact.get.useQuery();

  return (
    <form className="w-full max-w-md">
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
              defaultValue={data?.nickname ?? ""}
            />
          </InputGroup>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputGroup>
              <Input
                name="firstName"
                placeholder="First name"
                aria-label="First name"
                defaultValue={data?.firstName ?? ""}
              />
            </InputGroup>
            <InputGroup>
              <Input
                name="lastName"
                placeholder="Last name"
                aria-label="Last name"
                defaultValue={data?.lastName ?? ""}
              />
            </InputGroup>
          </div>

          <InputGroup>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              aria-label="Email"
              defaultValue={data?.email ?? ""}
            />
          </InputGroup>

          <div className="mt-2 flex items-center justify-between gap-2">
            <Button>Save</Button>
            <Label>Optional fields can be left blank</Label>
          </div>
        </div>
      </div>
    </form>
  );
}
