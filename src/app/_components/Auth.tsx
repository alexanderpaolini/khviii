import Link from "next/link";
export function SignOutButton() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Link
        href={"/api/auth/signout"}
        className="rounded-full bg-purple-500 px-10 py-3 font-semibold text-white no-underline transition hover:bg-pink-500"
      >
        Sign Out
      </Link>
    </div>
  );
}
