import React from 'react';
import { Lock, Laptop } from 'lucide-react';

export const EmptyChatState: React.FC = () => {
  return (
    <div className="flex-1 h-full hidden md:flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#222e35] p-8 text-center select-none border-b-6 border-[#25d366]">
      <div className="max-w-md space-y-5 flex flex-col items-center">
        {/* WhatsApp Laptop Graphic */}
        <div className="w-64 h-40 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700/50 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Laptop className="w-12 h-12" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-3xl font-light text-gray-700 dark:text-gray-200">
            WhatsApp Web
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
            Send and receive messages without keeping your phone online.
            <br />
            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
          </p>
        </div>

        {/* End-to-end encrypted note */}
        <div className="pt-8 flex items-center justify-center space-x-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Lock className="w-3.5 h-3.5" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
};
