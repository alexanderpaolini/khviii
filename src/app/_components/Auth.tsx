"use client";

import { useState } from "react";
import { signOut, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaDiscord } from "react-icons/fa";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Separator } from "@radix-ui/react-separator";

export function SignOutButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setOpen(false);

    await signOut({ redirect: false });

    router.push("/"); // redirect home after successful sign-out
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link">Sign Out</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Are you sure you want to sign out?</DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex justify-center gap-3">
          <Separator className="my-4" />

          <Button onClick={() => handleSignOut()}>Yes</Button>

          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function LoginButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Sign in</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <div className="text-muted-foreground text-sm">
            Choose a provider to continue. You&apos;ll be redirected after
            signing in.
          </div>
        </DialogHeader>

        <div className="grid gap-3">
          <button
            className="flex w-full items-center justify-center gap-3 rounded border border-gray-300 bg-white p-2 font-semibold hover:opacity-90"
            onClick={() => signIn("google", { callbackUrl: "/home" })}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <button
            className="flex w-full items-center justify-center gap-3 rounded bg-gray-800 p-2 font-semibold text-white hover:opacity-90"
            onClick={() => signIn("github", { callbackUrl: "/home" })}
          >
            <FaGithub size={20} />
            Continue with GitHub
          </button>

          <button
            className="flex w-full items-center justify-center gap-3 rounded bg-indigo-600 p-2 font-semibold text-white hover:opacity-90"
            onClick={() => signIn("discord", { callbackUrl: "/home" })}
          >
            <FaDiscord size={20} />
            Continue with Discord
          </button>
        </div>

        <DialogFooter className="flex justify-end">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
