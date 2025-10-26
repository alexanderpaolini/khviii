"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/"); // redirect home after successful sign-out
  };

  return (
    <>
      {/* Main Sign Out Button */}
      <div className="flex flex-col items-center justify-center gap-4">
        <button
          onClick={() => setConfirming(true)}
          className="rounded-full bg-purple-500 px-10 py-3 font-semibold text-white transition hover:bg-purple-600"
        >
          Sign Out
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirming && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg w-95 text-center animate-fadeIn">
            <p className="text-lg font-semibold mb-4">
              Are you sure you want to sign out?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
