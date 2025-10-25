import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { FriendsList } from "../_components/Friend";
import { ContactInput } from "../_components/Contact";
import { SignOutButton } from "../_components/Auth";

export default async function Home() {
  const session = await auth();

  if (!session) redirect("/");

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            CardDav
          </h1>
          <div className="flex w-full flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
            <div className="flex w-full max-w-md flex-col items-center gap-4">
              <ContactInput />
              <SignOutButton />
            </div>
            <div className="w-full max-w-md">
              <FriendsList />
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
