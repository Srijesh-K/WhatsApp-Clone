import React, { useState, useEffect } from 'react';
import { X, Laptop, Smartphone, ShieldCheck, LogOut, Globe } from 'lucide-react';
import { security } from '../services/security';
import type { DeviceSession } from '../services/security';

interface LinkedDevicesModalProps {
  onClose: () => void;
}

export const LinkedDevicesModal: React.FC<LinkedDevicesModalProps> = ({ onClose }) => {
  const [devices, setDevices] = useState<DeviceSession[]>([]);

  useEffect(() => {
    setDevices(security.getLinkedDevices());
  }, []);

  const handleRevokeDevice = (id: string) => {
    const updated = security.revokeDevice(id);
    setDevices(updated);
  };

  const handleRevokeAllOther = () => {
    const updated = security.revokeAllOtherDevices();
    setDevices(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#008069] text-white">
          <div className="flex items-center space-x-2.5">
            <Laptop className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Linked Devices & Active Sessions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-800 dark:text-gray-200">
          {/* WhatsApp Graphic Illustration */}
          <div className="flex flex-col items-center text-center p-6 bg-gray-50 dark:bg-[#111b21] rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
            <div className="relative flex items-center justify-center w-24 h-24 bg-teal-50 dark:bg-[#008069]/20 rounded-full text-[#00a884]">
              <Laptop className="w-12 h-12" />
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#00a884] rounded-full text-white shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-base text-gray-900 dark:text-white">
                Multi-Device Session Protection
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">
                Your personal chats are end-to-end encrypted across all linked devices. You can inspect or terminate any session remotely.
              </p>
            </div>
          </div>

          {/* Device list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>DEVICE STATUS ({devices.length})</span>
              {devices.length > 1 && (
                <button
                  onClick={handleRevokeAllOther}
                  className="text-red-500 hover:text-red-600 dark:hover:text-red-400 font-medium lowercase tracking-normal flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out all other devices</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111b21] rounded-xl border border-gray-200 dark:border-gray-800 transition-all hover:border-gray-300 dark:hover:border-gray-700"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
                      {device.deviceName.toLowerCase().includes('phone') || device.os.includes('Android') || device.os.includes('iOS') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {device.deviceName}
                        </span>
                        {device.isCurrent && (
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-[#00a884] text-[10px] font-semibold rounded-full uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center space-x-1">
                          <Globe className="w-3 h-3" />
                          <span>{device.ipAddress}</span>
                        </span>
                        <span>•</span>
                        <span>{device.lastActive}</span>
                      </div>
                    </div>
                  </div>

                  {!device.isCurrent && (
                    <button
                      onClick={() => handleRevokeDevice(device.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                      title="Log out device"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#111b21] border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#00a884] text-white rounded-xl text-sm font-medium hover:bg-[#008f70] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
