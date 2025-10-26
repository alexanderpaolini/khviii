import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DAVe Card",
  description: "A CardDav server with friend requests.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <SessionProvider>
          <Toaster position="top-right" />
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </SessionProvider>
        <footer className="w-full pb-8">
          <p className="text-center text-sm font-light text-gray-400">
            A{" "}
            <Link
              href="https://2025.knighthacks.org"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              KnightHacks VIII
            </Link>{" "}
            Project 🥀
          </p>
        </footer>
      </body>
    </html>
  );
}
