import React, { useState, useEffect } from 'react';
import { X, Laptop, Smartphone, ShieldCheck, LogOut, Laptop2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#202c33] border-b border-[#222e35] text-[#e9edef]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <Laptop2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e9edef]">Linked devices</h2>
              <p className="text-xs text-[#8696a0]">{devices.length} active session{devices.length === 1 ? '' : 's'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#e9edef]">
          {/* Info Card */}
          <div className="p-4 bg-[#202c33] rounded-xl border border-[#2a3942] flex items-start space-x-3.5">
            <div className="p-2.5 bg-[#00a884]/15 text-[#00a884] rounded-full shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#e9edef]">
                Use WhatsApp on other devices
              </h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Your personal messages are end-to-end encrypted on all your devices. Link up to 4 devices to your account.
              </p>
            </div>
          </div>

          {/* Device List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8696a0]">
              <span>DEVICE STATUS</span>
              {devices.length > 1 && (
                <button
                  onClick={handleRevokeAllOther}
                  className="text-red-400 hover:text-red-300 text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out all other devices</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {devices.map((device) => {
                const isPhone = device.deviceName.toLowerCase().includes('phone') || device.os.includes('Android') || device.os.includes('iOS');
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3.5 bg-[#202c33] rounded-xl border border-[#2a3942] hover:border-[#374248] transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#111b21] flex items-center justify-center text-[#8696a0]">
                        {isPhone ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-[#e9edef]">
                            {device.deviceName}
                          </span>
                          {device.isCurrent && (
                            <span className="px-2 py-0.5 bg-[#00a884]/20 text-[#00a884] text-[10px] font-medium rounded-full">
                              This device
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-[#8696a0] mt-0.5">
                          <span>{device.os}</span>
                          <span>•</span>
                          <span>{device.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    {!device.isCurrent && (
                      <button
                        onClick={() => handleRevokeDevice(device.id)}
                        className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Log out
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#202c33] border-t border-[#222e35] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
