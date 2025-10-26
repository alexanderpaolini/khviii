import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import { LoginButton } from "./_components/Auth";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center bg-gradient-to-b from-white/5 to-white/3">
        <div className="container px-6 py-20">
          {/* HERO */}
          <section className="mx-auto max-w-4xl text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
              DAVe Card
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              A lightweight contacts server and social contacts manager — add friends once and stay connected forever.
            </p>

            <div className="my-8 flex items-center justify-center gap-4">
              <LoginButton />
            </div>

            <div aria-hidden className="mx-auto mt-26 max-w-3xl">
              <div className="relative mx-auto h-56 sm:h-72">
                {/* stacked screenshots */}
                <div className="relative z-10 mx-auto flex h-full items-center justify-center px-4">
                  {/* left card */}
                  <div className="relative -mr-12 w-64 -rotate-6 transform overflow-hidden rounded-xl border border-white/10 bg-black/5 shadow-lg transition-transform duration-300 hover:scale-[1.03] hover:rotate-0 sm:-mr-16 sm:w-96">
                    <Image
                      src="/ss1.png"
                      alt="App screenshot 1"
                      width={1600}
                      height={1200}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* right card (on top) */}
                  <div className="relative -ml-8 w-48 rotate-3 transform overflow-hidden rounded-xl border border-white/10 bg-black/5 shadow-2xl transition-transform duration-300 hover:scale-[1.03] hover:rotate-0 sm:w-64">
                    <Image
                      src="/ss2.png"
                      alt="App screenshot 2"
                      width={900}
                      height={1400}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>

                <div className="absolute top-0 left-0 h-full w-full overflow-hidden rounded-xl">
                  <div className="pointer-events-none absolute -top-10 -left-24 h-48 w-96 -rotate-6 bg-[#f0ead6]/6 opacity-30 blur-xl" />
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="mt-16">
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-[#f0ead6]/5 p-6 text-center">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-[#f0ead6]/8" />
                <h3 className="mb-2 text-lg font-semibold">Sync Contacts</h3>
                <p className="text-sm text-gray-500">
                  Use any CardDAV client to sync your contact across devices —
                  get live updates when someone changes their card.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#f0ead6]/5 p-6 text-center">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-[#f0ead6]/8" />
                <h3 className="mb-2 text-lg font-semibold">Share Safely</h3>
                <p className="text-sm text-gray-500">
                  Exchange friend codes, send friend requests, and control who
                  has your contact.
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#f0ead6]/5 p-6 text-center">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-[#f0ead6]/8" />
                <h3 className="mb-2 text-lg font-semibold">OAuth & Privacy</h3>
                <p className="text-sm text-gray-500">
                  Sign in with Google, GitHub, or Discord. Authentication and
                  CardDAV access are tied to your account.
                </p>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section className="mx-auto mt-14 max-w-4xl">
            <h2 className="mb-4 text-xl font-semibold">How it works</h2>
            <ol className="space-y-4 pl-5 text-sm text-gray-600">
              <li>
                <strong>Sign in</strong> with your preferred provider and create
                your personal contact card.
              </li>
              <li>
                <strong>Configure a CardDAV client</strong> (like your phone contacts app!) using the server URL
                and credentials shown in the app's setup guide.
              </li>
              <li>
                <strong>Share & connect</strong> by sending friend requests.
                Friends get your contact synced to their devices.
              </li>
            </ol>

            <div className="mt-16 grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
              <div className="relative flex items-center justify-center sm:justify-end">
                <div className="group relative h-56 w-full max-w-xs -translate-y-2 -rotate-2 transform overflow-hidden rounded-xl border border-white/10 bg-[#f0ead6]/5 shadow-2xl transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:scale-[1.02] hover:rotate-0 sm:h-72 sm:max-w-sm sm:-translate-y-4">
                  <Image
                    src="/ss3.png"
                    alt="CardDAV setup screenshot"
                    fill
                    className="object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent mix-blend-overlay" />
                  <div className="pointer-events-none absolute -right-12 -bottom-8 h-32 w-48 rounded-full bg-[#f0ead6]/3 opacity-30 blur-3xl" />
                </div>
              </div>

              <div className="relative flex items-center justify-center sm:justify-start">
                <div className="group relative h-56 w-full max-w-xs translate-y-2 rotate-2 transform overflow-hidden rounded-xl border border-white/10 bg-[#f0ead6]/5 shadow-2xl transition-transform duration-300 ease-in-out hover:translate-y-1 hover:scale-[1.02] hover:rotate-0 sm:h-72 sm:max-w-sm sm:translate-y-4">
                  <Image
                    src="/ss4.png"
                    alt="Sharing UI screenshot"
                    fill
                    className="object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent mix-blend-overlay" />
                  <div className="pointer-events-none absolute -top-8 -left-12 h-32 w-48 rounded-full bg-[#f0ead6]/3 opacity-30 blur-3xl" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mb-8 flex items-center justify-center gap-4">
          <LoginButton />
        </div>
      </main>
    </HydrateClient>
  );
}
