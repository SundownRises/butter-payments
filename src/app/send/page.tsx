"use client";

import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { defineChain, getContract, sendTransaction } from "thirdweb";
import { client } from "../client";
import { useActiveAccount } from "thirdweb/react";
import { transfer } from "thirdweb/extensions/erc20";
import { ethers } from "ethers";
import Toast from '../components/Toast';
import Particles from '../../components/Particles';

// Add type declaration for window.ethereum
declare global {
  interface Window {
    ethereum: any;
  }
}

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

// Update USDT and Directory contract addresses
const MONAD_TESTNET_USDT = "0xfbFa87A5ae226dc8f1a54F8964b8f4c666fDD3Ed";
const DIRECTORY_CONTRACT = "0xb1dC654D44cBda91e93050D1ef7211396862b983";

// Define Monad Testnet chain
const monadTestnetChain = defineChain(monadTestnet);

// Directory contract ABI (only the function we need)
const DIRECTORY_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      }
    ],
    "name": "addressesByName",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

interface CameraDevice {
  id: string;
  label: string;
}

export default function SendMoney() {
  const account = useActiveAccount();
  const [formData, setFormData] = useState({
    username: "",
    amount: "",
  });
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<string>("");
  const [showBalanceInfo, setShowBalanceInfo] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const qrRef = useRef<Html5Qrcode | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  });

  const isValidAddress = (address: string): boolean => {
    return ethers.isAddress(address);
  };

  const checkEthBalance = async (address: string) => {
    try {
      const provider = new ethers.JsonRpcProvider(`https://10143.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`);
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error("Error checking ETH balance:", error);
      return "0";
    }
  };

  const resolveUsernameToAddress = async (username: string): Promise<string> => {
    if (!username) {
      throw new Error("Username cannot be empty");
    }

    try {
      const provider = new ethers.JsonRpcProvider(`https://10143.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`);
      const contract = new ethers.Contract(DIRECTORY_CONTRACT, DIRECTORY_ABI, provider);
      
      console.log("Resolving username:", username);
      const address = await contract.addressesByName(username);
      console.log("Raw resolved address:", address);

      // Validate the returned address
      if (!address || address === ethers.ZeroAddress || !ethers.isAddress(address)) {
        console.error("Invalid address returned:", address);
        throw new Error("Username not found");
      }

      console.log("Successfully resolved address:", address);
      return address;
    } catch (error: any) {
      console.error("Error in resolveUsernameToAddress:", error);
      // Check if it's a contract call error
      if (error.code === 'CALL_EXCEPTION') {
        throw new Error("Username not found");
      }
      throw new Error(error.message || "Failed to resolve username");
    }
  };

  const handleUsernameChange = async (value: string) => {
    setFormData(prev => ({ ...prev, username: value }));
    setError("");
    setResolvedAddress("");
    setEthBalance("");
    setShowBalanceInfo(false);

    if (!value) return;

    try {
      setIsProcessing(true);
      
      if (isValidAddress(value)) {
        console.log("Valid address entered directly:", value);
        setResolvedAddress(value);
        const balance = await checkEthBalance(value);
        setEthBalance(balance);
      } else {
        console.log("Attempting to resolve username:", value);
        const address = await resolveUsernameToAddress(value);
        
        if (address) {
          console.log("Username successfully resolved:", value, "->", address);
          setResolvedAddress(address);
          setError("");
          const balance = await checkEthBalance(address);
          setEthBalance(balance);
        }
      }
    } catch (err: any) {
      console.error("Error in handleUsernameChange:", err);
      setError(err.message || "Failed to resolve username");
      setResolvedAddress("");
      setEthBalance("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Initialize available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);
        setCameras(devices);
        
        // For mobile devices, prefer the back camera
        if (devices.length > 0) {
          const backCamera = devices.find(camera => 
            camera.label.toLowerCase().includes('back') || 
            camera.label.toLowerCase().includes('rear') ||
            camera.label.toLowerCase().includes('environment')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        }
      } catch (error) {
        console.error("Error getting cameras:", error);
        setError("Failed to get camera list");
      }
    };
    getCameras();
  }, []);

  // Initialize scanner after DOM element is available
  useEffect(() => {
    if (isScanning && selectedCamera) {
      const initializeScanner = async () => {
        try {
          if (qrRef.current) {
            await qrRef.current.stop();
            qrRef.current = null;
          }

          const element = document.getElementById("qr-reader");
          if (!element) {
            console.error("QR reader element not found");
            setError("Scanner initialization failed");
            setIsScanning(false);
            return;
          }

          console.log("Initializing scanner with camera:", selectedCamera);
          const html5QrCode = new Html5Qrcode("qr-reader", /* verbose= */ true);
          qrRef.current = html5QrCode;

          const config = {
            fps: 10,
            qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: isMobile ? "environment" : "user",
              width: { ideal: isMobile ? 640 : 1280 },
              height: { ideal: isMobile ? 480 : 720 },
            }
          };

          await html5QrCode.start(
            selectedCamera,
            config,
            async (decodedText) => {
              console.log("QR Code decoded successfully:", decodedText);
              try {
                const data = JSON.parse(decodedText);
                console.log("Parsed QR data:", data);
                setFormData({
                  username: data.username || "",
                  amount: data.amount || "",
                });
                if (data.username) {
                  await handleUsernameChange(data.username);
                }
                await stopScanner();
              } catch (error) {
                console.error("Failed to parse QR code data:", error);
                setError("Invalid QR code format");
              }
            },
            (errorMessage) => {
              // Only log scanning errors, don't show to user as they occur frequently
              console.debug("QR Code scanning error:", errorMessage);
            }
          );

          console.log("Scanner started successfully");
          setError("");
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Scanner initialization failed:", error);
          setError(`Failed to start scanner: ${errorMessage}`);
          setIsScanning(false);
        }
      };

      // Small delay to ensure DOM is ready
      setTimeout(initializeScanner, 100);
    }
  }, [isScanning, selectedCamera, isMobile]);

  const startScanner = async () => {
    try {
      if (!selectedCamera) {
        throw new Error("No camera selected");
      }
      setShowScanner(true);
      setIsScanning(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Failed to start scanner:", error);
      setError(`Failed to start scanner: ${errorMessage}`);
    }
  };

  const stopScanner = async () => {
    console.log("Stopping scanner...");
    setIsScanning(false);
    setShowScanner(false);
    if (qrRef.current) {
      try {
        await qrRef.current.stop();
        console.log("Scanner stopped successfully");
        qrRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrRef.current) {
        qrRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account?.address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!resolvedAddress) {
      setError("Please enter a valid username or address");
      return;
    }

    try {
      setIsProcessing(true);
      setError("");

      const contract = getContract({
        client,
        chain: monadTestnetChain,
        address: MONAD_TESTNET_USDT,
      });

      // Prepare the transfer transaction
      const transaction = transfer({
        contract,
        to: resolvedAddress, // Use the resolved address
        amount: formData.amount, // Amount as a string
      });

      // Send the transaction
      await sendTransaction({ transaction, account: account });

      setToast({
        message: `Transaction complete! Sent ${formData.amount} USDT to ${formData.username}`,
        type: "success",
      });
      
      // Clear toast after 5 seconds
      setTimeout(() => setToast(null), 5000);
      
      // Clear form after successful transaction
      setFormData({
        username: "",
        amount: "",
      });
      setResolvedAddress("");

    } catch (err: any) {
      console.error("Error sending transaction:", err);
      setError(err.message || "Failed to send transaction");
      setToast({
        message: err.message || "Failed to send transaction",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Particles Background */}
      <Particles
        particleColors={['#3b82f6', '#60a5fa']}
        particleCount={2000}
        particleSpread={10}
        speed={0.3}
        particleBaseSize={100}
        moveParticlesOnHover={true}
        alphaParticles={true}
        disableRotation={false}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full max-w-md bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 backdrop-blur-sm relative z-10">
        <h1 className="text-2xl font-bold text-white mb-8">Send Money</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Username or Address
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="Enter username or wallet address"
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {resolvedAddress && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-400">
                  Resolved Address: {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowBalanceInfo(!showBalanceInfo)}
                  className={`ml-2 p-2 rounded-full transition-colors relative ${
                    parseFloat(ethBalance) === 0 
                      ? 'animate-[pulse_2s_ease-in-out_infinite] bg-gradient-to-r from-red-500 to-blue-500 bg-[length:200%_200%]' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <svg 
                    className="w-4 h-4 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                </button>
                {showBalanceInfo && (
                  <div className="absolute mt-2 p-2 bg-zinc-800 rounded-lg shadow-lg text-sm text-white right-0 transform translate-y-full">
                    MON Balance: {parseFloat(ethBalance).toFixed(6)} MON
                    {parseFloat(ethBalance) === 0 && (
                      <p className="text-red-400 mt-1">Warning: No MON for gas!</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Amount (USDT)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Enter amount"
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Send USDT"
              )}
            </button>

            {error && (
              <p className="mt-2 text-red-400 text-sm">{error}</p>
            )}
          </div>

          {/* QR Scanner Section */}
          <div className="pt-4">
            {!isMobile && cameras.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Select Camera
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cameras.map((camera) => (
                    <option key={camera.id} value={camera.id}>
                      {camera.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={isScanning ? stopScanner : startScanner}
              disabled={!selectedCamera}
              className="w-full py-2 px-4 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isScanning ? "Stop Scanning" : "Scan QR Code"}
            </button>

            {showScanner && (
              <div className="mt-4 relative">
                <div 
                  id="qr-reader" 
                  className="w-full max-w-[300px] mx-auto bg-white rounded-lg overflow-hidden"
                  style={{ 
                    minHeight: isMobile ? '250px' : '300px',
                    maxWidth: isMobile ? '250px' : '300px'
                  }}
                />
                <div className="mt-2 text-sm text-zinc-400 text-center">
                  Position the QR code within the frame
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </main>
  );
} 