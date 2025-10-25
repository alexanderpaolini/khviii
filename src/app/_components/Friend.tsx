"use client";

import { Label } from "@radix-ui/react-label";
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

export function FriendsList() {
  type FriendType = {
    id: string;
    name: string;
    nickname?: string;
    email: string;
  };

  const friends: FriendType[] = [
    {
      id: "1",
      name: "Ava Thompson",
      nickname: "Ava",
      email: "ava@example.com",
    },
    {
      id: "2",
      name: "Liam Johnson",
      nickname: "LJ",
      email: "liam@example.com",
    },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
    { id: "3", name: "Maya Patel", email: "maya@example.com" },
  ];

  function Friend({ friend }: { friend: FriendType }) {
    const initials = friend.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const handleRemove = (id: string) => {
      console.log("Remove friend", id);
    };

    return (
      <div className="flex items-center justify-between gap-4 rounded-md bg-white/3 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-sm font-semibold">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {friend.name} {friend.nickname ? `(${friend.nickname})` : ""}
            </span>
            <span className="text-xs text-white/60">{friend.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleRemove(friend.id)}
          title="Remove friend"
          aria-label={`Remove ${friend.name}`}
          className="ml-2 rounded-full bg-white/6 px-2 py-1 text-sm font-semibold transition hover:bg-white/10"
        >
          ✕
        </button>
      </div>
    );
  }

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
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <Button variant="outline">Add Friend</Button>
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
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
