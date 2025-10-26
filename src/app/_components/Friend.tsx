"use client";

import type { Contact, Friend } from "@prisma/client";
import { useState, type FormEvent } from "react";
import { Label } from "@radix-ui/react-label";
import { Cross, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { api } from "~/trpc/react";

function Friend({ friend }: { friend: Contact }) {
  const initials = friend.firstName[0] + (friend.lastName?.[0] ?? "");

  const utils = api.useUtils();
  const route = api.friend.remove.useMutation();

  const handleRemove = () => {
    toast.promise(route.mutateAsync({ id: friend.userId }), {
      success: async () => {
        await utils.friend.getAll.refetch();
        return `Removed ${friend.firstName}`;
      },
      loading: "Removing...",
      error: (e?: Error) => e?.message ?? "An unknown error has occurred.",
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-white/3 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-sm font-semibold">
          {initials}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {friend.firstName} {friend.lastName}{" "}
            {friend.nickname ? `(${friend.nickname})` : ""}
          </span>
          <span className="text-xs font-light">{friend.email}</span>
        </div>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            aria-label={`Remove ${friend.firstName}`}
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
          >
            <X size={16} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Remove Friend</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function FriendsList() {
  const { data } = api.friend.getAll.useQuery();

  const friends: Contact[] = data ?? [];

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl bg-white/5 p-6 shadow-md backdrop-blur-sm">
        <h2 className="mb-2 text-lg font-semibold">Friends</h2>

        <div className="flex flex-col gap-3">
          <div className="max-h-[40vh] overflow-auto pr-2">
            <div className="flex flex-col gap-3">
              {friends.map((f) => (
                <Friend key={f.id} friend={f} />
              ))}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <FriendDialogue />
          </div>
        </div>
      </div>
    </div>
  );
}
export function FriendDialogue() {
  const [friendCode, setFriendCode] = useState<undefined | string>(undefined);
  const utils = api.useUtils();
  const route = api.friend.add.useMutation();
  const [open, setOpen] = useState(false);

  function handleSubmit() {
    if (!friendCode) {
      toast.error("Missing friend code");
      return;
    }

    toast.promise(route.mutateAsync({ friendCode }), {
      success: async (d) => {
        await utils.friend.getAll.refetch();
        setOpen(false);
        return `Friended ${d.userB.contact!.firstName}`;
      },
      loading: "Loading...",
      error: (e?: Error) => e?.message ?? "An unknown error has occurred.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Friend</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Friend</DialogTitle>
          <DialogDescription>
            Add a friend by entering their friend code below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-3">
            <Label htmlFor="friend-code">Friend Code</Label>
            <Input
              id="friend-code"
              name="friendCode"
              placeholder="alpha-beta-omega"
              aria-label="Friend Code"
              onChange={(e) => setFriendCode(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <Button type="submit" onClick={() => handleSubmit()}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
