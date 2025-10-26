import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import LoginButton from "~/app/_components/LoginButton";

export default async function Home() {
  const session = await auth();

  if (session) redirect("/home");

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            CardDav
          </h1>
          <div className="flex flex-col items-center gap-2">
            <LoginButton />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
