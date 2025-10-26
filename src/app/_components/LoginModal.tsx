"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { FaGithub, FaDiscord } from "react-icons/fa";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null;

  const buttonClasses =
    "flex items-center justify-center gap-3 p-2 rounded w-full font-semibold transition hover:opacity-90";

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative w-100 rounded-lg bg-white p-6">
        <button
          className="absolute top-2 right-2 text-gray-500"
          onClick={onClose}
        ></button>
        <h2 className="mb-4 text-center text-xl font-semibold">Sign in</h2>
        <div className="flex flex-col gap-3">
          <button
            className={`${buttonClasses} border border-gray-300`}
            onClick={() => signIn("google", { callbackUrl: "/home" })}
          >
            <FcGoogle size={20} />
            Continue with Google
          </button>

          <button
            className={`${buttonClasses} bg-gray-800 text-white`}
            onClick={() => signIn("github", { callbackUrl: "/home" })}
          >
            <FaGithub size={20} />
            Continue with GitHub
          </button>

          <button
            className={`${buttonClasses} bg-indigo-600 text-white`}
            onClick={() => signIn("discord", { callbackUrl: "/home" })}
          >
            <FaDiscord size={20} />
            Continue with Discord
          </button>
        </div>
      </div>
    </div>
  );
}
