// "use client";

// import { useState, useEffect } from "react";
// import { getContract } from "thirdweb"
// import { useActiveWallet } from "thirdweb/react";
// import { client } from "../client";
// import bridgeAbi from "../../abi/bridgeabi.json";

// const BRIDGE_CONTRACT_ADDRESS = "0xa439BE80C32321201e474c8Aec4c6d9CdBB6295E";
// const USDT_CONTRACT_ADDRESS = "0xb1dC654D44cBda91e93050D1ef7211396862b983";

// const CHAINS = [
//   {
//     id: "sepolia",
//     name: "Sepolia",
//     info: "Sepolia Testnet - Ethereum's official test network for smart contract testing",
//     enabled: true,
//     chainId: 11155111, // Sepolia chain ID
//   },
//   {
//     id: "ethereum", 
//     name: "Ethereum",
//     info: "Ethereum Mainnet - The original smart contract platform",
//     enabled: false,
//     chainId: 1,
//   },
//   { 
//     id: "polygon",
//     name: "Polygon",
//     info: "Polygon (Matic) - Layer 2 scaling solution for Ethereum",
//     enabled: false,
//     chainId: 137,
//   },
//   {
//     id: "arbitrum",
//     name: "Arbitrum",
//     info: "Arbitrum One - Optimistic rollup scaling solution",
//     enabled: false,
//     chainId: 42161,
//   },
//   {
//     id: "optimism",
//     name: "Optimism",
//     info: "Optimism - Low-cost, lightning-fast Ethereum L2 blockchain",
//     enabled: false,
//     chainId: 10,
//   },
//   {
//     id: "base",
//     name: "Base",
//     info: "Base - Coinbase's secure, low-cost, developer-friendly L2",
//     enabled: false,
//     chainId: 8453,
//   },
// ];

// export default function FundWallet() {
//   const wallet = useActiveWallet();
//   const [formData, setFormData] = useState({
//     fromChain: "",
//     address: "",
//     amount: "",
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [txHash, setTxHash] = useState<string | null>(null);
//   const [depositEvent, setDepositEvent] = useState<any>(null);

//   useEffect(() => {
//     if (txHash && wallet) {
//       // Listen for the Deposit event
//       const contract = getContract({
//         address: BRIDGE_CONTRACT_ADDRESS,
//         abi: bridgeAbi,
//       });

//       const unwatch = contract.events.listenToAllEvents((event) => {
//         if (event.eventName === "Deposit") {
//           setDepositEvent(event);
//         }
//       });

//       return () => {
//         unwatch();
//       };
//     }
//   }, [txHash, wallet]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setIsLoading(true);
//     setTxHash(null);
//     setDepositEvent(null);

//     try {
//       // 1. Basic validation
//       if (!wallet) {
//         throw new Error("Please connect your wallet first");
//       }

//       if (!formData.amount || isNaN(Number(formData.amount))) {
//         throw new Error("Please enter a valid amount");
//       }

//       // 2. Get selected chain
//       const selectedChain = CHAINS.find(chain => chain.id === formData.fromChain);
//       if (!selectedChain) {
//         throw new Error("Invalid chain selected");
//       }

//       // 3. Convert amount to USDT decimals (6 decimals)
//       const amountInUsdt = Number(formData.amount);
//       const amountInDecimals = BigInt(Math.floor(amountInUsdt * 1e6));
//       console.log("Amount in USDT:", amountInUsdt);
//       console.log("Amount in decimals:", amountInDecimals.toString());

//       // // 4. Switch chain if needed
//       // try {
//       //   await wallet.switchChain(selectedChain.chainId);
//       // } catch (err) {
//       //   console.error("Chain switch error:", err);
//       //   throw new Error("Failed to switch chain. Please try again.");
//       // }

//       // 5. Get contract instances
//       const bridgeContract = getContract({
//         address: BRIDGE_CONTRACT_ADDRESS,
//         abi: bridgeAbi,
//         client: client,
//       }); 
 
//       const usdtContract = getContract({
//         address: USDT_CONTRACT_ADDRESS,
//         abi: [
//           {
//             type: "function",
//             name: "approve",
//             stateMutability: "nonpayable",
//             inputs: [
//               { name: "_spender", type: "address" },
//               { name: "_value", type: "uint256" }
//             ],
//             outputs: [{ name: "", type: "bool" }]
//           }
//         ],
//         client: client,
//       });

//       // 6. Approve USDT spending
//       console.log("Approving USDT spending...");
//       const approveTx = await usdtContract.write.approve([
//         BRIDGE_CONTRACT_ADDRESS,
//         amountInDecimals
//       ]);
//       console.log("Approval tx:", approveTx);
//       await approveTx.wait();

//       // 7. Call deposit function
//       console.log("Calling deposit function...");
//       const tx = await bridgeContract.write.deposit([
//         USDT_CONTRACT_ADDRESS,
//         amountInDecimals,
//         formData.address
//       ]);
//       console.log("Deposit tx:", tx);

//       setTxHash(tx.transactionHash);
//       await tx.wait();

//     } catch (err) {
//       console.error("Transaction error:", err);
//       setError(err instanceof Error ? err.message : "An error occurred");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
//       <div className="w-full max-w-md mx-auto">
//         <h1 className="text-3xl font-bold text-zinc-100 mb-2 text-center">Bridge Tokens</h1>
//         <p className="text-zinc-400 text-center mb-8">
//           Transfer your tokens between different blockchains
//         </p>

//         {error && (
//           <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
//             {error}
//           </div>
//         )}

//         {txHash && (
//           <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-200">
//             <p>Transaction submitted!</p>
//             <a
//               href={`https://sepolia.etherscan.io/tx/${txHash}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-green-300 hover:text-green-200 underline"
//             >
//               View on Etherscan
//             </a>
//           </div>
//         )}

//         {depositEvent && (
//           <div className="mb-6 p-4 bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200">
//             <p>Deposit event received!</p>
//             <p className="text-sm mt-2">
//               Amount: {Number(depositEvent.args.amount) / 1e6} USDT
//             </p>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <div className="flex items-center justify-between mb-2">
//               <label htmlFor="fromChain" className="block text-sm font-medium text-zinc-300">
//                 From Chain *
//               </label>
//               <div className="group relative">
//                 <button
//                   type="button"
//                   className="text-zinc-400 hover:text-zinc-300 transition-colors"
//                   aria-label="Chain information"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                   </svg>
//                 </button>
//                 <div className="absolute right-0 w-64 p-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
//                   <p className="text-sm text-zinc-300">
//                     Select the blockchain network you want to send tokens from
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <select
//               id="fromChain"
//               required
//               value={formData.fromChain}
//               onChange={(e) => setFormData({ ...formData, fromChain: e.target.value })}
//               className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             >
//               <option value="">Select a chain</option>
//               {CHAINS.map((chain) => (
//                 <option 
//                   key={chain.id} 
//                   value={chain.id}
//                   disabled={!chain.enabled}
//                   className={!chain.enabled ? "text-zinc-500" : ""}
//                 >
//                   {chain.name} {!chain.enabled && "(Coming Soon)"}
//                 </option>
//               ))}
//             </select>
//             {formData.fromChain && (
//               <p className="mt-2 text-sm text-zinc-400">
//                 {CHAINS.find((chain) => chain.id === formData.fromChain)?.info}
//               </p>
//             )}
//           </div>

//           <div>
//             <label htmlFor="address" className="block text-sm font-medium text-zinc-300 mb-2">
//               Receiver Address/Username *
//             </label>
//             <input
//               type="text"
//               id="address"
//               required
//               value={formData.address}
//               onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//               className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="Enter receiver's address or username"
//             />
//           </div>

//           <div>
//             <label htmlFor="amount" className="block text-sm font-medium text-zinc-300 mb-2">
//               Amount (USDT) *
//             </label>
//             <input
//               type="number"
//               id="amount"
//               required
//               value={formData.amount}
//               onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
//               className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               placeholder="Enter amount in USDT"
//               step="0.000001"
//               min="0"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading}
//             className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isLoading ? "Processing..." : "Bridge Tokens"}
//           </button>
//         </form>
//       </div>
//     </main>
//   );
// } 