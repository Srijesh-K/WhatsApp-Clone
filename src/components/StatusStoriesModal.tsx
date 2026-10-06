import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Send, ShieldCheck } from 'lucide-react';
import type { StatusStory } from '../services/supabase';

interface StatusStoriesModalProps {
  statuses: StatusStory[];
  onClose: () => void;
  onSendReply: (contactName: string, replyText: string) => void;
}

export const StatusStoriesModal: React.FC<StatusStoriesModalProps> = ({
  statuses,
  onClose,
  onSendReply,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');

  const current = statuses[currentIndex];

  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < statuses.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, statuses.length, onClose]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !current) return;
    onSendReply(current.userName, `Replied to your status: "${replyText}"`);
    setReplyText('');
    onClose();
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md h-[90vh] bg-black rounded-3xl overflow-hidden relative flex flex-col justify-between shadow-2xl border border-gray-800">
        {/* Story Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-20 flex space-x-1.5">
          {statuses.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header */}
        <div className="absolute top-6 inset-x-3 z-20 flex items-center justify-between text-white p-2">
          <div className="flex items-center space-x-3">
            <img
              src={current.userAvatar}
              alt={current.userName}
              className="w-10 h-10 rounded-full border border-white/50 object-cover"
            />
            <div>
              <div className="font-semibold text-sm leading-tight">{current.userName}</div>
              <div className="text-[11px] text-gray-300">{current.timestamp}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Story Image / Content */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <img
            src={current.mediaUrl}
            alt="Status story"
            className="w-full h-full object-cover"
          />

          {/* Left / Right Tap zones */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10 opacity-0 hover:opacity-100 flex items-center justify-start pl-2 text-white/50"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10 opacity-0 hover:opacity-100 flex items-center justify-end pr-2 text-white/50"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Caption */}
          {current.caption && (
            <div className="absolute bottom-16 inset-x-4 z-20 bg-black/60 backdrop-blur-sm p-3.5 rounded-2xl text-center text-white text-sm">
              {current.caption}
            </div>
          )}
        </div>

        {/* Bottom Reply Bar */}
        <div className="z-20 p-3 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center justify-center space-x-1 text-[11px] text-emerald-400 mb-2">
            <ShieldCheck className="w-3 h-3" />
            <span>End-to-end encrypted status</span>
          </div>
          <form onSubmit={handleSend} className="flex items-center space-x-2">
            <input
              type="text"
              placeholder={`Reply to ${current.userName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 py-2.5 px-4 bg-white/20 text-white placeholder-gray-300 rounded-full text-xs focus:outline-hidden focus:bg-white/30 backdrop-blur-md"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2.5 bg-[#00a884] text-white rounded-full hover:bg-[#008f70] disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
