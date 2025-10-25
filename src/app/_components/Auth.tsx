import Link from "next/link";

export function SignOutButton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Link
        href={"/api/auth/signout"}
        className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
      >
        Sign Out
      </Link>
    </div>
  );
}
