import { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck, Volume2, Activity, Radio, Cpu, Terminal } from 'lucide-react';
import type { Conversation } from '../services/supabase';
import { sound } from '../services/sound';

interface CallModalProps {
  conversation: Conversation;
  isVideo: boolean;
  onEndCall: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  conversation,
  isVideo,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connected'>('ringing');
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    sound.startRinging();

    // Connect call automatically after 2.5s
    const connectTimer = setTimeout(() => {
      sound.stopRinging();
      setCallStatus('connected');
    }, 2800);

    return () => {
      sound.stopRinging();
      clearTimeout(connectTimer);
    };
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md h-[580px] bg-[#0d1418] border border-cyan-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-950/60 flex flex-col justify-between p-6 text-white relative cyber-grid-dark">
        {/* Terminal Header & Telemetry */}
        <div className="flex flex-col items-center space-y-2 text-center pt-2">
          <div className="flex items-center space-x-2 px-3 py-1 bg-cyan-950/60 border border-cyan-500/30 rounded-full text-[10px] font-mono text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>DTLS-SRTP // 256-BIT ENCRYPTED</span>
          </div>

          <h2 className="text-xl font-bold font-mono text-slate-100 tracking-wider uppercase mt-2">
            {conversation.name}
          </h2>

          <div className="flex items-center space-x-2 text-[11px] font-mono">
            {callStatus === 'ringing' ? (
              <span className="text-amber-400 animate-pulse flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>ESTABLISHING_SESSION...</span>
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>CONNECTED // {formatDuration(duration)}</span>
              </span>
            )}
          </div>

          {/* WebRTC Telemetry Pill */}
          <div className="grid grid-cols-3 gap-2 w-full mt-2 pt-2 border-t border-cyan-500/20 font-mono text-[9px] text-slate-400">
            <div className="bg-[#0a0f12] p-1.5 rounded-lg border border-cyan-500/10 text-center">
              <span className="block text-slate-500">CODEC</span>
              <span className="text-cyan-300 font-bold">OPUS-48k</span>
            </div>
            <div className="bg-[#0a0f12] p-1.5 rounded-lg border border-cyan-500/10 text-center">
              <span className="block text-slate-500">RTT / JITTER</span>
              <span className="text-emerald-400 font-bold">18ms / 0.8ms</span>
            </div>
            <div className="bg-[#0a0f12] p-1.5 rounded-lg border border-cyan-500/10 text-center">
              <span className="block text-slate-500">PACKET LOSS</span>
              <span className="text-cyan-300 font-bold">0.00%</span>
            </div>
          </div>
        </div>

        {/* Center Graphic & Radar Visualizer */}
        <div className="flex flex-col items-center justify-center relative my-auto">
          <div className="relative">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-28 h-28 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-2xl shadow-cyan-900/50"
            />
            {callStatus === 'ringing' ? (
              <div className="absolute -inset-3 rounded-2xl border-2 border-cyan-400 animate-ping opacity-60 pointer-events-none" />
            ) : (
              <div className="absolute -inset-1 rounded-2xl border border-emerald-400/40 pointer-events-none" />
            )}
          </div>

          {/* Live Audio Spectrum Bar Simulator */}
          <div className="mt-5 flex items-center space-x-1 h-6">
            <Activity className="w-3.5 h-3.5 text-cyan-400 mr-1.5" />
            {[40, 75, 55, 90, 30, 85, 60, 100, 45, 70, 35, 80, 50, 95].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-cyan-400 rounded-full transition-all duration-300"
                style={{
                  height: callStatus === 'connected' ? `${h}%` : '20%',
                  opacity: callStatus === 'connected' ? 0.85 : 0.3,
                  animation: callStatus === 'connected' ? `pulse 1s ease-in-out infinite ${i * 70}ms` : 'none',
                }}
              />
            ))}
          </div>

          <div className="mt-2 text-[10px] font-mono text-cyan-400/70">
            {isVideo ? 'WEBRTC VP9 TACTICAL VIDEO CHANNEL' : 'WEBRTC OPUS LOW-LATENCY AUDIO CHANNEL'}
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="flex flex-col items-center space-y-4 pt-2">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-xl border transition-all ${
                isMuted
                  ? 'bg-red-950/40 border-red-500/50 text-red-400 shadow-md shadow-red-950/40'
                  : 'bg-[#111a20] hover:bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {isVideo && (
              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`p-3.5 rounded-xl border transition-all ${
                  !isVideoEnabled
                    ? 'bg-red-950/40 border-red-500/50 text-red-400 shadow-md shadow-red-950/40'
                    : 'bg-[#111a20] hover:bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                }`}
                title={isVideoEnabled ? 'Disable video stream' : 'Enable video stream'}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>
            )}

            <button
              className="p-3.5 rounded-xl bg-[#111a20] hover:bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 transition-colors"
              title="Speaker output toggle"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            {/* End Call Button */}
            <button
              onClick={() => {
                sound.stopRinging();
                onEndCall();
              }}
              className="p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg shadow-red-950/50 transition-all border border-red-400/50 active:scale-95"
              title="Terminate Stream"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-1.5 font-mono text-[9px] text-slate-500">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>SESSION_CIPHER: SRTP_AEAD_AES_256_GCM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

