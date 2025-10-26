"use client";

import type { Contact, Friend } from "@prisma/client";
import { useState } from "react";
import { Label } from "@radix-ui/react-label";
import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
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
import { useSession } from "next-auth/react";

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
            {friend.nickname ? (
              <>
                {friend.nickname} ({friend.firstName}
                {friend.lastName ? ` ${friend.lastName}` : ""})
              </>
            ) : (
              <>
                {friend.firstName}
                {friend.lastName ? ` ${friend.lastName}` : ""}
              </>
            )}
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
  const { data: session } = useSession();

  const { data: fc } = api.contact.friendCode.useQuery();
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

          <div className="mt-2 flex items-center justify-between px-2">
            <span className="text-sm font-medium">
              Friend Code:
              <span className="ml-2 font-mono text-sm">
                {fc?.friendCode ?? "Loading..."}
              </span>
            </span>
            <FriendDialogue />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FriendDialogue() {
  const [friendCode, setFriendCode] = useState<undefined | string>(undefined);
  const [message, setMessage] = useState<undefined | string>(undefined);
  const utils = api.useUtils();
  const route = api.friend.sendFriendRequest.useMutation();
  const [open, setOpen] = useState(false);

  function handleSubmit() {
    if (!friendCode) {
      console.error("Missing friend code");
      return;
    }

    toast.promise(
      route.mutateAsync({
        friendCode,
        message: message?.trim() ?? undefined,
      }),
      {
        success: async (d) => {
          await utils.friend.getPendingRequests.refetch();
          setOpen(false);
          setFriendCode(undefined);
          setMessage(undefined);
          return `Friend request sent to ${d.receiver.contact!.firstName}`;
        },
        loading: "Sending...",
        error: (e?: Error) => e?.message ?? "An unknown error has occurred.",
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Send Friend Request</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Friend Request</DialogTitle>
          <DialogDescription>
            Send a friend request by entering their friend code below. You can
            optionally include a message.
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
              value={friendCode ?? ""}
              onChange={(e) => setFriendCode(e.target.value)}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="message">Message (Optional)</Label>
            <Input
              id="message"
              name="message"
              placeholder="Hey! Let's be friends!"
              aria-label="Friend Request Message"
              value={message ?? ""}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={() => handleSubmit()}
            disabled={route.isPending}
          >
            {route.isPending ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
