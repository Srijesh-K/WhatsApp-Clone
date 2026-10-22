import { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Lock, Volume2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm h-[520px] bg-[#111b21] rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between p-6 text-white relative border border-gray-800 select-none">
        {/* Top Header */}
        <div className="flex flex-col items-center space-y-1.5 text-center pt-2">
          <div className="flex items-center space-x-1.5 text-xs text-gray-400">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
            <span>End-to-end encrypted</span>
          </div>

          <h2 className="text-xl font-medium tracking-tight text-white mt-1">
            {conversation.name}
          </h2>

          <p className="text-xs text-gray-400">
            {callStatus === 'ringing' ? 'Ringing...' : formatDuration(duration)}
          </p>
        </div>

        {/* Center Graphic */}
        <div className="flex flex-col items-center justify-center relative my-auto">
          <div className="relative">
            <img
              src={conversation.avatarUrl}
              alt={conversation.name}
              className="w-28 h-28 rounded-full object-cover shadow-xl border-2 border-white/10"
            />
            {callStatus === 'ringing' && (
              <div className="absolute inset-0 rounded-full border-2 border-[#00a884] animate-ping opacity-50 pointer-events-none" />
            )}
          </div>

          <div className="mt-4 text-xs text-gray-400">
            {isVideo ? 'WhatsApp Video Call' : 'WhatsApp Voice Call'}
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="flex items-center justify-center space-x-5 pb-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full transition-colors cursor-pointer ${
              isMuted ? 'bg-red-500/30 text-red-400' : 'bg-white/15 hover:bg-white/25 text-white'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {isVideo && (
            <button
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                !isVideoEnabled ? 'bg-red-500/30 text-red-400' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>
          )}

          <button
            className="p-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            title="Speaker"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={() => {
              sound.stopRinging();
              onEndCall();
            }}
            className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
