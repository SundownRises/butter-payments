"use client";

import Link from "next/link";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { client } from "../client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { sepolia } from "thirdweb/chains";
import Image from "next/image";
import UsernamePopup from "../../components/UsernamePopup";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUsernamePopupOpen, setIsUsernamePopupOpen] = useState(false);
  const account = useActiveAccount();

  const isActive = (path: string) => {
    return pathname === path ? "text-blue-500" : "text-zinc-100";
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/fund", label: "Fund Wallet" },
    { href: "/receive", label: "Receive Money" },
    { href: "/send", label: "Send Money" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-zinc-900 border-b border-zinc-800 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="h-16 flex items-center justify-between px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/butter-payments-logo.png"
              alt="Butter Payments Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold text-blue-500">
              Butter Payments
            </span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href} 
                className={`font-medium bg-gradient-to-r from-blue-500 to-purple-400 bg-clip-text text-transparent ${isActive(link.href)}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Wallet and burger menu */}
          <div className="flex items-center gap-4">
            {account?.address && (
              <button
                onClick={() => setIsUsernamePopupOpen(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Profile
              </button>
            )}
            <ConnectButton
              client={client}
              accountAbstraction={{
                chain: sepolia,
                sponsorGas: true,
              }}
            />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-zinc-100 rounded-full" />
                <span className="w-full h-0.5 bg-zinc-100 rounded-full" />
                <span className="w-full h-0.5 bg-zinc-100 rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-zinc-800">
          <div className="px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block py-2 bg-gradient-to-r from-blue-500 to-purple-400 bg-clip-text text-transparent ${isActive(link.href)}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Username Popup */}
      <UsernamePopup
        isOpen={isUsernamePopupOpen}
        onClose={() => setIsUsernamePopupOpen(false)}
      />
    </nav>
  );
} 