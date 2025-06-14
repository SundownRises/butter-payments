"use client";

import { defineChain, getContract, prepareContractCall, prepareEvent, watchContractEvents } from "thirdweb"
import { client } from "../client";
import bridgeAbi from "../../abi/bridgeabi.json";
import ERC20ABI from "../../abi/usdtabi.json";
import { sepolia } from "thirdweb/chains";
import { TransactionButton, useActiveAccount, useSendBatchTransaction } from "thirdweb/react";
import { useState, useEffect } from "react";
import { approve } from "thirdweb/extensions/erc20";
import { ethers } from "ethers";
import Toast from '../components/Toast';
import Particles from '../../components/Particles';

const BRIDGE_CONTRACT_ADDRESS = "0xa439BE80C32321201e474c8Aec4c6d9CdBB6295E";
const USDT_CONTRACT_ADDRESS = "0xb1dC654D44cBda91e93050D1ef7211396862b983";
const MONAD_TESTNET_USDT = "0xfbFa87A5ae226dc8f1a54F8964b8f4c666fDD3Ed";
const USDT_DECIMALS = 18; // For bridging, use 18 decimals

// Define Monad Testnet configuration
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

const CHAINS = [
  {
    id: "sepolia",
    name: "Sepolia",
    info: "Sepolia Testnet - Ethereum's official test network for smart contract testing",
    enabled: true,
    chainId: 11155111,
  },
  {
    id: "monad",
    name: "Monad Testnet",
    info: "Monad Testnet - High-performance EVM-compatible blockchain",
    enabled: true,
    chainId: 10143,
  }
];

export default function FundWallet() {
  const account = useActiveAccount();
  const { mutate: sendBatchTransaction } = useSendBatchTransaction();
  const [formData, setFormData] = useState({
    fromChain: "sepolia",
    address: "",
    amount: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>("");
  const [allowance, setAllowance] = useState<string>("0");
  const [balance, setBalance] = useState<string>("0");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Prefill address when wallet is connected
  useEffect(() => {
    if (account?.address && !formData.address) {
      setFormData(prev => ({
        ...prev,
        address: account.address
      }));
    }
  }, [account?.address]);

  // Function to check allowance and balance
  const checkAllowanceAndBalance = async () => {
    if (!account?.address) return;

    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, ERC20ABI, provider);
      
      console.log("Checking balance and allowance for:", account.address);

      const [allowanceAmount, balanceAmount] = await Promise.all([
        contract.allowance(account.address, BRIDGE_CONTRACT_ADDRESS),
        contract.balanceOf(account.address)
      ]);

      console.log("Raw allowance:", allowanceAmount.toString());
      console.log("Raw balance:", balanceAmount.toString());
      
      const formattedAllowance = ethers.formatUnits(allowanceAmount, USDT_DECIMALS);
      const formattedBalance = ethers.formatUnits(balanceAmount, USDT_DECIMALS);
      
      console.log("Formatted allowance:", formattedAllowance);
      console.log("Formatted balance:", formattedBalance);
      
      setAllowance(formattedAllowance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error checking allowance and balance:", error);
    }
  };

  // Check allowance and balance on mount and when account changes
  useEffect(() => {
    checkAllowanceAndBalance();
  }, [account?.address]);

  // Listen for Deposit events
  useEffect(() => {
    if (!formData.address) return;

    const setupEventListener = async () => {
      try {
        // @ts-ignore - TODO: Fix typing issues with thirdweb contract ABI
        const bridgeContract = getContract({
          client: client,
          chain: defineChain(sepolia),
          address: BRIDGE_CONTRACT_ADDRESS,
          abi: bridgeAbi,
        });

        // Prepare the Deposit event
        const depositEvent = prepareEvent({
          signature: "event Deposit(address indexed user, address indexed token, uint256 amount, string payload)",
        });

        // Start watching for the event
        // @ts-ignore - TODO: Fix typing issues with thirdweb contract events
        const unwatch = watchContractEvents({
          contract: bridgeContract,
          events: [depositEvent],
          onEvents: async (events) => {
            for (const event of events) {
              console.log("=== DEPOSIT EVENT RECEIVED ===");
              console.log("Event data:", event.args);
              // @ts-ignore - TODO: Fix typing issues with thirdweb event args
              const args = event.args as { user: string; amount: bigint; payload: string };
              console.log("payload is:", args.payload);
              console.log("formData.address is:", formData.address);
              
              // Check if the payload matches our receiver address
              if (args.payload === formData.address) {
                setToast({ 
                  message: `Deposit successful! Amount: ${ethers.formatUnits(args.amount, 18)} USDT`, 
                  type: 'success' 
                });
                setTimeout(() => setToast(null), 5000);
                checkAllowanceAndBalance();
                setIsProcessing(false);

                // Mint tokens on Monad Testnet
                try {
                  console.log("\n=== STARTING MONAD TRANSACTION ===");
                  console.log("Target Contract Address:", MONAD_TESTNET_USDT);
                  console.log("Amount to mint:", args.amount.toString());
                  console.log("Recipient address:", args.payload);

                  // Create a provider for Monad Testnet
                  const provider = new ethers.JsonRpcProvider(`https://10143.rpc.thirdweb.com/${process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}`);
                  
                  // Create a wallet instance with the admin private key
                  const adminKey = process.env.NEXT_PUBLIC_ADMIN_PRIVATE_KEY;
                  console.log("\n=== ADMIN KEY INFO ===");
                  console.log("Admin key exists:", !!adminKey);
                  console.log("Admin key length:", adminKey?.length);
                  console.log("Admin key first 6 chars:", adminKey?.substring(0, 6));
                  
                  if (!adminKey) {
                    throw new Error("Admin private key not found in environment variables");
                  }

                  const wallet = new ethers.Wallet(adminKey, provider);
                  console.log("\n=== WALLET INFO ===");
                  console.log("Wallet address:", wallet.address);
                  const balance = await provider.getBalance(wallet.address);
                  console.log("Wallet balance:", ethers.formatEther(balance));
                  
                  // Create contract instance
                  const contract = new ethers.Contract(MONAD_TESTNET_USDT, ERC20ABI, wallet);
                  console.log("\n=== CONTRACT INFO ===");
                  console.log("Contract address:", contract.target);
                  console.log("Contract name:", await contract.name());
                  console.log("Contract symbol:", await contract.symbol());
                  
                  // Get gas price
                  const gasPrice = await provider.getFeeData();
                  console.log("\n=== GAS INFO ===");
                  console.log("Gas price:", {
                    maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
                    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
                    gasPrice: gasPrice.gasPrice?.toString()
                  });

                  // Estimate gas
                  const gasEstimate = await contract.mint.estimateGas(args.payload, args.amount);
                  console.log("Gas estimate:", gasEstimate.toString());

                  // Mint tokens with explicit gas settings
                  console.log("\n=== SENDING TRANSACTION ===");
                  const tx = await contract.mint(args.payload, args.amount, {
                    gasLimit: gasEstimate * BigInt(120) / BigInt(100), // Add 20% buffer
                    maxFeePerGas: gasPrice.maxFeePerGas,
                    maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
                  });
                  console.log("Transaction hash:", tx.hash);
                  
                  // Wait for transaction
                  console.log("\n=== WAITING FOR CONFIRMATION ===");
                  const receipt = await tx.wait();
                  console.log("Transaction confirmed:", receipt.hash);
                  console.log("Transaction status:", receipt.status === 1 ? "success" : "failed");

                  setToast({ 
                    message: `Successfully minted ${ethers.formatUnits(args.amount, 18)} USDT on Monad Testnet`, 
                    type: 'success' 
                  });
                  setTimeout(() => setToast(null), 5000);
                  
                  console.log("\n=== TRANSACTION COMPLETE ===");

                  // Clear the form after successful transaction
                  setFormData({
                    fromChain: "",
                    address: "",
                    amount: "",
                  });
                  setIsProcessing(false);
                } catch (err: any) {
                  console.error("\n=== ERROR OCCURRED ===");
                  console.error("Error type:", err.constructor.name);
                  console.error("Error message:", err.message);
                  console.error("Error code:", err.code);
                  console.error("Error data:", err.data);
                  console.error("Full error:", err);
                  
                  setToast({ 
                    message: `Failed to mint tokens on Monad: ${err.message}`, 
                    type: 'error' 
                  });
                  setTimeout(() => setToast(null), 5000);
                  setIsProcessing(false);
                }
              }
            }
          },
        });

        return () => {
          unwatch();
        };
      } catch (error) {
        console.error("Error setting up event listener:", error);
      }
    };

    setupEventListener();
  }, [formData.address]);

  // Validate amount before approval
  const validateAmount = () => {
    if (!formData.amount) {
      setError("Please enter an amount");
      return false;
    }

    const amount = parseFloat(formData.amount);
    const balanceNum = parseFloat(balance);

    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return false;
    }

    if (amount > balanceNum) {
      setError(`Amount exceeds your balance of ${balance} USDT`);
      return false;
    }

    setError("");
    return true;
  };

  const handleBatchTransaction = async () => {
    if (!validateAmount()) return;
    
    setIsProcessing(true);
    setError("");
    
    try {
      const usdtContract = getContract({
        client: client,
        chain: defineChain(sepolia),
        address: USDT_CONTRACT_ADDRESS,
      });

      const bridgeContract = getContract({
        address: BRIDGE_CONTRACT_ADDRESS,
        abi: bridgeAbi,
        client: client,
        chain: defineChain(sepolia),
      });

      const amount18 = ethers.parseUnits(formData.amount, 18);
      
      const transactions = [
        approve({
          contract: usdtContract,
          spender: BRIDGE_CONTRACT_ADDRESS,
          amount: Number(formData.amount),
        }),
        prepareContractCall({
          contract: bridgeContract,
          method: "function deposit(address _token, uint256 _amount, string echo)",
          params: [USDT_CONTRACT_ADDRESS, amount18, formData.address],
        })
      ];

      await sendBatchTransaction(transactions, {
        onTransactionSubmitted: () => {
          setToast({ message: "Transaction submitted! Please confirm in your wallet.", type: 'success' });
          setIsProcessing(false);
          // Clear form data after transaction is submitted
          setFormData({
            fromChain: "",
            address: "",
            amount: "",
          });
        },
        onTransactionConfirmed: () => {
          checkAllowanceAndBalance();
        },
        onError: (error) => {
          setError(error.message || "Transaction failed");
          setIsProcessing(false);
        }
      });
    } catch (err: any) {
      setError(err.message || "Transaction failed");
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
        {/* Wallet Info Card */}
        <div className="mb-8 p-4 bg-zinc-800/80 border border-zinc-700 rounded-lg shadow-lg backdrop-blur-sm">
          <div className="text-sm text-zinc-300">
            <p className="font-medium mb-2 text-white">Wallet Info</p>
            {account?.address ? (
              <>
                <p className="break-all">
                  <span className="text-zinc-400">Address:</span><br />
                  {account.address}
                </p>
                <p className="mt-2">
                  <span className="text-zinc-400">Balance:</span><br />
                  {balance} USDT
                </p>
                <p className="mt-2">
                  <span className="text-zinc-400">Approved Amount:</span><br />
                  {allowance} USDT
                </p>
              </>
            ) : (
              <p className="text-yellow-400">No wallet connected</p>
            )}
          </div>
        </div>

        {/* Form section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              From Chain
            </label>
            <select
              value={formData.fromChain}
              onChange={(e) => setFormData({ ...formData, fromChain: e.target.value })}
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Chain</option>
              <option value="sepolia">Sepolia</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">
              Receiver Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter receiver address"
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              onClick={handleBatchTransaction}
              disabled={isProcessing}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Transaction...
                </>
              ) : (
                "Approve & Bridge USDT"
              )}
            </button>

            {error && (
              <p className="mt-2 text-red-400 text-sm">{error}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}