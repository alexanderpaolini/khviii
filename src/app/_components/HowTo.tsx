"use client";

import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { Button } from "~/components/ui/button";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";

export function HowToDialogue() {
  const { data: session } = useSession();

  const [open, setOpen] = useState(false);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link">Setup Guide</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Login Instructions</DialogTitle>
          <DialogDescription>
            Quick steps to configure a CardDAV client using your account.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <p>Server URL:</p>
          <div className="mt-1 flex justify-between space-x-2">
            <span className="font-mono">davecard.paolini.dev</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy("davecard.paolini.dev")}
            >
              Copy URL
            </Button>
          </div>
          <p>Username:</p>
          <div className="mt-1 flex justify-between space-x-2">
            <span className="font-mono">
              {session?.user?.id ?? "sign in to view username"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(session?.user?.id ?? "")}
              disabled={!session?.user?.id}
            >
              Copy username
            </Button>
          </div>
          <p>Password:</p>
          <div className="mt-1 flex justify-between space-x-2">
            <span className="font-mono items-center">
              {session?.user?.id ? "(same as username)" : "sign in to view"}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copy(session?.user?.id ?? "")}
              disabled={!session?.user?.id}
            >
              Copy password
            </Button>
          </div>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Open your contacts app and add a new CardDAV/account.</li>
            <li>Paste the Server URL shown above into the server/URL field.</li>
            <li>
              Enter the Username and Password shown above into their fields.
            </li>
            <li>
              Save the account and trigger a sync (grant permissions if
              prompted).
            </li>
          </ol>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
