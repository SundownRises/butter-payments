"use client";

import { useState } from "react";
import Link from "next/link";
import { useActiveAccount } from "thirdweb/react";
import UsernamePopup from "./UsernamePopup";

export default function Navbar() {
  const account = useActiveAccount();
  const [showUsernamePopup, setShowUsernamePopup] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-white font-bold text-xl">
                BetterPayments
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/send"
                className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Send
              </Link>
              <Link
                href="/fund"
                className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Fund
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {account ? (
              <button
                onClick={() => setShowUsernamePopup(true)}
                className="text-zinc-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {currentUsername || (account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Not connected")}
              </button>
            ) : (
              <span className="text-zinc-500 px-3 py-2 rounded-md text-sm font-medium">
                Not connected
              </span>
            )}
          </div>
        </div>
      </div>

      <UsernamePopup
        isOpen={showUsernamePopup}
        onClose={() => setShowUsernamePopup(false)}
        onUsernameChange={setCurrentUsername}
      />
    </nav>
  );
} 