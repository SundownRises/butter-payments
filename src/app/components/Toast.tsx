import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        fixed top-4 right-4 p-6 z-50
        animate-toast-pop
        rounded-3xl
        overflow-hidden
        backdrop-blur-[8px]
        transition-all duration-700 ease-in-out
        group
        hover:backdrop-blur-2xl
        ${type === 'success' ? 'shadow-[0_8px_32px_rgba(59,130,246,0.4)]' : 'shadow-[0_8px_32px_rgba(236,72,153,0.4)]'}
      `}
    >
      {/* Dynamic gradient background */}
      <div className="
        absolute inset-0 
        bg-gradient-to-r from-black/30 via-blue-900/30 to-blue-600/30
        animate-gradient-flow
        transition-opacity duration-700
      " />

      {/* Glass panel effect */}
      <div className="
        absolute inset-0 
        bg-gradient-to-r from-transparent via-white/[0.07] to-white/[0.12]
        transition-opacity duration-700
        opacity-0 group-hover:opacity-100
        rounded-3xl
      " />

      {/* Glass reflection effect */}
      <div className="
        absolute inset-0
        bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),transparent_70%)]
        pointer-events-none
      " />

      {/* Content wrapper */}
      <div className="
        relative 
        flex items-center 
        space-x-4
        transition-transform duration-300
        group-hover:scale-[0.99]
      ">
        {/* Icon container */}
        <div className={`
          rounded-2xl p-3
          backdrop-blur-3xl
          bg-gradient-to-br from-black/20 via-blue-900/20 to-blue-600/20
          border border-white/[0.08]
          transition-colors duration-300
          ${type === 'success' 
            ? 'text-blue-300 group-hover:text-blue-200' 
            : 'text-blue-300 group-hover:text-blue-200'}
        `}>
          {type === 'success' ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        {/* Message */}
        <div className="relative">
          <p className="font-medium text-white/90">
            {message}
          </p>
          <div className="
            absolute inset-0 
            bg-gradient-to-r from-transparent via-white/10 to-transparent 
            translate-x-[-100%] group-hover:translate-x-[100%]
            transition-transform duration-1000
          " />
        </div>
      </div>
    </div>
  );
} 