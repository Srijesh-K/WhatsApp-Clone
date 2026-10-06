import { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck, Volume2 } from 'lucide-react';
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
      <div className="w-full max-w-md h-[560px] bg-[#111b21] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between p-8 text-white relative border border-gray-800">
        {/* Top Header */}
        <div className="flex flex-col items-center space-y-2 text-center pt-4">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-white/10 rounded-full text-[11px] text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-end encrypted</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight mt-2">{conversation.name}</h2>
          <p className="text-xs text-gray-400 font-mono">
            {callStatus === 'ringing' ? 'Ringing...' : formatDuration(duration)}
          </p>
        </div>

        {/* Center Graphic */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="relative">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-[#00a884] shadow-2xl"
            />
            {callStatus === 'ringing' && (
              <div className="absolute inset-0 rounded-full border-4 border-[#00a884] animate-ping opacity-75 pointer-events-none" />
            )}
          </div>
          <div className="mt-4 text-xs text-gray-400">
            {isVideo ? 'WhatsApp Video Call' : 'WhatsApp Voice Call'}
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="flex items-center justify-center space-x-6 pb-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full transition-colors ${
              isMuted ? 'bg-red-500/30 text-red-400' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {isVideo && (
            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`p-4 rounded-full transition-colors ${
                !isVideoEnabled ? 'bg-red-500/30 text-red-400' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>
          )}

          <button
            className="p-4 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
            title="Speaker"
          >
            <Volume2 className="w-6 h-6" />
          </button>

          {/* End Call Button */}
          <button
            onClick={() => {
              sound.stopRinging();
              onEndCall();
            }}
            className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
