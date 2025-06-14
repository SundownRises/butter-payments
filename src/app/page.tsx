"use client";

import { useState, useEffect } from "react";
import BlurText from "@/components/BlurText";
import DecryptedText from "@/components/DecryptedText";

const features = [
  {
    icon: "🧈",
    title: "What is Butter Payments?",
    description: "A modern wallet experience designed for smooth, low-cost transactions. No confusing wallet popups. No gas fee anxiety. Just fast, simple payments that feel like magic."
  },
  {
    icon: "🚀",
    title: "No Gas Fees, No Problem",
    description: "Butter keeps your transactions off expensive bank or blockchain rails when possible. That means lightning-fast payments without burning money on every click."
  },
  {
    icon: "🔐",
    title: "Secure Without the Hassle",
    description: "Say goodbye to awkward wallet connect popups. With Butter, your identity and balances are managed seamlessly — no need to confirm every little move."
  },
  {
    icon: "🔁",
    title: "Instant Peer-to-Peer Transfers",
    description: "Send or receive payments instantly — no waiting, no approvals. Whether you're splitting lunch or paying rent, it just works."
  },
  {
    icon: "📲",
    title: "Frictionless Onboarding",
    description: "New to web3? Doesn't matter. Butter feels like a regular wallet app — intuitive, simple, and made for real people."
  },
  {
    icon: "🧠",
    title: "Smart Transactions, Not Just Transfers",
    description: "Butter supports programmable payments, recurring transfers, and logic-based flows. More than money movement — it's financial automation."
  },
  {
    icon: "💼",
    title: "Built for Builders",
    description: "Butter isn't just a wallet — it's a platform. Integrate Butter into your app with simple APIs and make payments invisible to your users."
  },
  {
    icon: "🌍",
    title: "Global & Inclusive",
    description: "No cards? No bank? No problem. Butter is designed to work for anyone with a smartphone and an internet connection."
  }
];

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 8000); // Changed from 5000 to 8000 (8 seconds)

    return () => clearInterval(interval);
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % features.length);
  };

  return (
    <main className="relative min-h-[100vh] w-full">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover"
      >
        <source src="/background-vid.mp4" type="video/mp4" />
      </video>
      
      {/* Content Container */}
      <div className="relative min-h-[100vh] flex flex-col items-center justify-center p-4 pb-10">
        <div className="container max-w-screen-lg mx-auto">
          <div className="flex flex-col items-center gap-4">
            <BlurText
              text="Welcome to"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-2xl text-zinc-300"
            />
            <BlurText
              text="Butter Payments"
              delay={150}
              animateBy="words"
              direction="top"
              className="text-6xl font-bold animate-color-transition"
            />
            <div className="mt-8 max-w-2xl text-center">
              <div className="backdrop-blur-sm bg-zinc-900/50 p-8 rounded-xl">
                <DecryptedText
                  text={"We're reimagining digital payments — smooth, fast, and gas-free.\nThink of it like a Paytm-style wallet, but without the bloated fees and clunky wallet popups. No need to deal with blockchain noise every time you transact.\nJust clean, effortless payments — the way they should be."}
                  animateOn="view"
                  className="text-lg md:text-xl text-zinc-300"
                  parentClassName="block"
                />
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-20">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">How It Works</h2>
            <div className="relative w-full max-w-3xl mx-auto">
              {/* Navigation Arrows */}
              <button
                onClick={handlePrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 p-2 rounded-full bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors backdrop-blur-sm border border-zinc-800"
                aria-label="Previous card"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 p-2 rounded-full bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors backdrop-blur-sm border border-zinc-800"
                aria-label="Next card"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="w-full flex-shrink-0 px-4"
                    >
                      <div className="backdrop-blur-sm bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 transform transition-all duration-500 hover:scale-105">
                        <div className="text-4xl mb-4">{feature.icon}</div>
                        <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                        <p className="text-zinc-300 text-lg">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Navigation Dots */}
              <div className="flex justify-center mt-8 gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentIndex === index 
                        ? 'bg-blue-500 scale-125' 
                        : 'bg-zinc-600 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
