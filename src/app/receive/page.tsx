"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useActiveAccount } from "thirdweb/react";
import Toast from '../components/Toast';
import Particles from '../../components/Particles';

export default function ReceiveMoney() {
  const account = useActiveAccount();
  const [formData, setFormData] = useState({
    username: "",
    amount: "",
  });
  const [qrData, setQrData] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Prefill address when wallet is connected
  useEffect(() => {
    if (account?.address && !formData.username) {
      setFormData(prev => ({
        ...prev,
        username: account.address
      }));
    }
  }, [account?.address]);

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({ ...prev, username: value }));
    // Show warning if the entered address is different from connected wallet
    if (account?.address && value !== account.address) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const jsonData = {
      username: formData.username,
      amount: formData.amount || undefined,
    };
    setQrData(JSON.stringify(jsonData));
    setToast({
      message: 'QR code generated successfully!',
      type: 'success'
    });
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
        <h1 className="text-2xl font-bold text-white mb-8">Receive Money</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
              Address/Username *
            </label>
            <input
              type="text"
              id="username"
              required
              value={formData.username}
              onChange={(e) => handleAddressChange(e.target.value)}
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter address or username"
            />
            {showWarning && (
              <p className="text-yellow-500 text-sm mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Generating QR code for some other wallet
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-zinc-300">
              Amount (Optional)
            </label>
            <input
              type="number"
              id="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Generate QR Code
            </button>
          </div>
        </form>

        {qrData && (
          <div className="mt-8 p-6 bg-zinc-800 rounded-lg border border-zinc-700">
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG
                value={qrData}
                size={256}
                level="H"
                includeMargin={true}
                className="bg-white p-4 rounded-lg"
              />
              <div className="text-sm text-zinc-400 break-all text-center">
                {qrData}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 