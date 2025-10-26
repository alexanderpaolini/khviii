import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { FriendsList } from "../_components/Friend";
import { ContactInput } from "../_components/Contact";
import { SignOutButton } from "../_components/Auth";
import { FriendRequestButton } from "../_components/FriendRequestButton";
import { api } from "~/trpc/server";
import { HowToDialogue } from "../_components/HowTo";
import { Separator } from "~/components/ui/separator";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (!session) redirect("/");

  await api.contact.get.prefetch();
  await api.friend.getAll.prefetch();
  await api.friend.getPendingRequests.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            DAVe Card
          </h1>
          <div className="flex w-full flex-col items-center gap-8 sm:flex-row sm:items-start sm:justify-center">
            <div className="flex w-full max-w-md flex-col items-center gap-4">
              <ContactInput />
            </div>

            <div className="w-full max-w-md">
              <FriendsList />
            </div>
          </div>
        </div>

        <Separator className="mb-4 max-w-[80%]" />

        <div className="mb-8 flex h-5 items-center text-sm">
          <Link href="/">
            <Button variant="link">Back</Button>
          </Link>
          <Separator orientation="vertical" />
          <HowToDialogue />
          <Separator orientation="vertical" />
          <SignOutButton />
        </div>

        <FriendRequestButton />
      </main>
    </HydrateClient>
  );
}
