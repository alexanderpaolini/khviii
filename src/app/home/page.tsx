import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { FriendsList } from "../_components/Friend";
import { ContactInput } from "../_components/Contact";
import { BusinessCard } from "../_components/BusinessCard";
import { SignOutButton } from "../_components/Auth";
import { FriendRequestButton } from "../_components/FriendRequestButton";
import { api } from "~/trpc/server";
import { HowToDialogue } from "../_components/HowTo";
import { Separator } from "~/components/ui/separator";
import { SessionProvider } from "next-auth/react";

export default async function Home() {
  const session = await auth();

  if (!session) redirect("/");

  await api.contact.get.prefetch();
  await api.friend.getAll.prefetch();
  await api.friend.getPendingRequests.prefetch();

  return (
    <HydrateClient>
      <SessionProvider>
        <main className="flex min-h-screen flex-col items-center">
          <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
              CardDav
            </h1>
            <div className="flex w-full flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
              <div className="flex w-full max-w-md flex-col items-center gap-4">
                <ContactInput />
              </div>

              <div className="w-full max-w-md">
                <FriendsList />
              </div>
            </div>

            {/* Business Card Section */}
            {/*<div className="w-full max-w-4xl">
              <BusinessCard />
            </div>*/}
          </div>

          <Separator className="mb-4 max-w-[80%]" />

          <div className="flex h-5 items-center text-sm mb-8">
            <HowToDialogue />
            <Separator orientation="vertical" />
            <SignOutButton />
          </div>

          <FriendRequestButton />
        </main>
      </SessionProvider>
    </HydrateClient>
  );
}
