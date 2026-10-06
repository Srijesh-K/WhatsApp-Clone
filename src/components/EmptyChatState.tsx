import React from 'react';
import { Lock, ShieldCheck, Laptop } from 'lucide-react';

export const EmptyChatState: React.FC = () => {
  return (
    <div className="flex-1 h-full hidden md:flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#222e35] p-8 border-b-6 border-[#00a884] select-none text-center">
      <div className="max-w-md space-y-6 flex flex-col items-center">
        {/* WhatsApp Web Center Graphic */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-teal-50 dark:bg-[#111b21] flex items-center justify-center text-[#00a884] shadow-inner">
            <Laptop className="w-16 h-16 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="absolute bottom-1 right-1 p-2 bg-[#00a884] rounded-full text-white shadow-md">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-light text-gray-800 dark:text-gray-200 tracking-tight">
            WhatsApp Web
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
            Send and receive messages without keeping your phone online.
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
        </div>

        {/* E2EE Lock Banner */}
        <div className="pt-6 flex items-center justify-center space-x-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Lock className="w-3.5 h-3.5" />
          <span>End-to-end encrypted with Web Crypto & Supabase RLS</span>
        </div>
      </div>
    </div>
  );
};
