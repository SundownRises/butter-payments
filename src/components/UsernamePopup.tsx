"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import { defineChain, getContract, sendTransaction, prepareContractCall, resolveMethod } from "thirdweb";
import { client } from "../app/client";
import Toast from "../app/components/Toast";
import directoryAbi from "../abi/directory.json";

// Monad testnet configuration
const monadTestnet = {
  id: 10143,
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [`https://10143.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`],
    },
    public: {
      http: [`https://10143.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://monad-testnet.socialscan.io/",
    },
  },
  testnet: true,
};

const MONAD_TESTNET_USDT = "0xfbFa87A5ae226dc8f1a54F8964b8f4c666fDD3Ed";
const DIRECTORY_CONTRACT = "0xb1dC654D44cBda91e93050D1ef7211396862b983";

// Define Monad Testnet chain
const monadTestnetChain = defineChain(monadTestnet);

// USDT contract ABI (only the function we need)
const USDT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

interface UsernamePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUsernameChange?: (username: string) => void;
}

export default function UsernamePopup({ isOpen, onClose, onUsernameChange }: UsernamePopupProps) {
  const account = useActiveAccount();
  const [username, setUsername] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [isChecking, setIsChecking] = useState(false);
  const [isSetting, setIsSetting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Check current username and USDT balance
  useEffect(() => {
    const checkUsernameAndBalance = async () => {
      if (!account?.address) return;

      try {
        const provider = new ethers.JsonRpcProvider(`https://10143.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`);
        const directoryContract = new ethers.Contract(DIRECTORY_CONTRACT, directoryAbi, provider);
        const usdtContract = new ethers.Contract(MONAD_TESTNET_USDT, USDT_ABI, provider);

        // Check current username
        const username = await directoryContract.reverseLookup(account.address);
        setCurrentUsername(username);
        onUsernameChange?.(username);

        // Check USDT balance
        const balance = await usdtContract.balanceOf(account.address);
        setUsdtBalance(ethers.formatUnits(balance, 18));
      } catch (error) {
        console.error("Error checking username and balance:", error);
      }
    };

    if (isOpen) {
      checkUsernameAndBalance();
    }
  }, [account?.address, isOpen, onUsernameChange]);

  const checkUsername = async (name: string) => {
    if (!name) return;

    try {
      setIsChecking(true);
      setError("");

      const provider = new ethers.JsonRpcProvider(`https://10143.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`);
      const contract = new ethers.Contract(DIRECTORY_CONTRACT, directoryAbi, provider);
      
      const address = await contract.addressesByName(name);
      
      if (address !== ethers.ZeroAddress) {
        setError("Username already taken");
      } else {
        setError("");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      setError("Error checking username availability");
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setError("");
    if (value) {
      checkUsername(value);
    }
  };

  const handleSetUsername = async () => {
    if (!account?.address || !username) return;

    try {
      setIsSetting(true);
      setError("");

      const contract = getContract({
        client,
        chain: monadTestnetChain,
        address: DIRECTORY_CONTRACT,
        abi: directoryAbi,
      });

      // @ts-ignore - The ABI is correct but TypeScript doesn't recognize it
      const transaction = prepareContractCall({
        contract,
        method: "setAddressByName",
        params: [username],
      });

      // Send the transaction
      await sendTransaction({ transaction, account });

      setToast({
        message: "Username set successfully!",
        type: "success",
      });

      // Update current username
      setCurrentUsername(username);
      onUsernameChange?.(username);
      setUsername("");

      // Clear toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
    } catch (err: any) {
      console.error("Error setting username:", err);
      setError(err.message || "Failed to set username");
      setToast({
        message: err.message || "Failed to set username",
        type: "error",
      });
    } finally {
      setIsSetting(false);
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {currentUsername || (account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Not connected")}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <p className="text-sm text-zinc-400 mb-1">Connected Address</p>
            <p className="text-white font-mono">
              {account?.address ? (
                <>
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </>
              ) : (
                "Not connected"
              )}
            </p>
          </div>

          <div className="bg-zinc-800/50 p-4 rounded-lg">
            <p className="text-sm text-zinc-400 mb-1">USDT Balance on Monad</p>
            <p className="text-white">{usdtBalance} USDT</p>
          </div>

          {!currentUsername && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Set Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Enter username"
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <button
                onClick={handleSetUsername}
                disabled={isSetting || !username || !!error}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSetting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Setting...
                  </>
                ) : (
                  "Set Username"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 