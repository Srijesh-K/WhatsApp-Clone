import React, { useState, useEffect } from 'react';
import { X, Laptop, Smartphone, ShieldCheck, LogOut, Globe, Cpu, Radio, Terminal } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d1418] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh] cyber-grid-dark">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0f12] border-b border-cyan-500/20 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-wider text-slate-100 font-mono">
                  HARDWARE_TOPOLOGY // SESSIONS
                </h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {devices.length} NODES_ACTIVE
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400/60 mt-0.5">
                E2EE MULTI-DEVICE PROTOCOL • RATCHET SYNC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 font-sans">
          {/* Tactical Topology HUD Banner */}
          <div className="p-4 bg-[#0a1014] rounded-xl border border-cyan-500/20 relative overflow-hidden">
            <div className="flex items-start space-x-3 relative z-10">
              <div className="relative flex items-center justify-center w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
                <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-slate-900">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Distributed Ephemeral Mesh
                  </h3>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-500/30">
                    DOUBLE-RATCHET
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Each linked node derives independent pairwise session ratchet keys. Messages remain end-to-end encrypted without storing plaintext in relay clusters.
                </p>
              </div>
            </div>
          </div>

          {/* Node List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>LINKED TERMINALS ({devices.length})</span>
              </span>
              {devices.length > 1 && (
                <button
                  onClick={handleRevokeAllOther}
                  className="text-red-400 hover:text-red-300 font-mono text-[10px] uppercase flex items-center space-x-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>TERMINATE ALL OTHER NODES</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {devices.map((device) => {
                const isPhone = device.deviceName.toLowerCase().includes('phone') || device.os.includes('Android') || device.os.includes('iOS');
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3.5 bg-[#0a1014] rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        {isPhone ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-100">
                            {device.deviceName}
                          </span>
                          {device.isCurrent ? (
                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono uppercase rounded">
                              LOCAL TERMINAL
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[9px] font-mono uppercase rounded">
                              REMOTE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span className="flex items-center space-x-1 text-cyan-400/80">
                            <Globe className="w-3 h-3" />
                            <span>{device.ipAddress}</span>
                          </span>
                          <span>•</span>
                          <span>{device.os}</span>
                          <span>•</span>
                          <span className="text-slate-500">{device.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    {!device.isCurrent && (
                      <button
                        onClick={() => handleRevokeDevice(device.id)}
                        className="px-2.5 py-1 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 font-mono text-[10px] uppercase tracking-wider transition-colors flex items-center space-x-1"
                        title="Disconnect node"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>KILL</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0a0f12] border-t border-cyan-500/20 flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>SESSION PROTOCOL: TLS 1.3 / CHACHA20</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg uppercase tracking-wider transition-colors"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

