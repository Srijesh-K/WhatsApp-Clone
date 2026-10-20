import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquarePlus,
  MoreVertical,
  Search,
  CheckCheck,
  Pin,
  CircleDashed,
  VolumeX,
  Lock,
  Laptop,
  KeyRound,
  Settings,
  LogOut,
  ShieldAlert,
  Terminal,
  Cpu,
  Radio,
} from 'lucide-react';
import { supabaseData } from '../services/supabase';
import type { Conversation, UserProfile } from '../services/supabase';

interface SidebarProps {
  currentUser: UserProfile;
  conversations: Conversation[];
  activeChatId: string | null;
  onSelectChat: (conv: Conversation) => void;
  onOpenNewChat: () => void;
  onOpenStatusStories: () => void;
  onOpenPasskeys: () => void;
  onOpenLinkedDevices: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onLockApp: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  conversations,
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenStatusStories,
  onOpenPasskeys,
  onOpenLinkedDevices,
  onOpenSettings,
  onOpenAdmin,
  onLockApp,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'groups'>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside / other side
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [menuOpen]);

  // Filter conversations
  const filtered = conversations.filter((c) => {
    if (searchQuery.trim()) {
      const matchName = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPhone = c.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMsg = c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchName && !matchPhone && !matchMsg) return false;
    }

    if (filterType === 'unread') return c.unreadCount > 0;
    if (filterType === 'groups') return c.isGroup;
    return !c.isArchived;
  });

  return (
    <div className="w-full md:w-96 lg:w-[410px] h-full bg-[#050b17] border-r border-emerald-500/20 flex flex-col select-none shrink-0 font-sans">
      {/* Top Header Command Bar */}
      <div className="h-16 px-4 bg-[#081022] flex items-center justify-between border-b border-emerald-500/20 shrink-0 relative">
        {/* User profile & telemetry */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-xl object-cover border border-emerald-400/40 p-0.5 bg-[#040813] shadow-[0_0_10px_rgba(0,245,160,0.2)]"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full ring-2 ring-[#081022] radar-online" />
          </div>
          <div className="hidden lg:block min-w-0">
            <div className="text-xs font-bold font-mono text-white truncate max-w-[130px] flex items-center space-x-1">
              <span>{currentUser.fullName}</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400/70 truncate flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>NODE: ACTIVE // E2EE</span>
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1 text-gray-300">
          {/* Status Stories Button */}
          <button
            onClick={onOpenStatusStories}
            className="p-2 rounded-lg bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 transition-all relative"
            title="Encrypted Status Broadcasts"
          >
            <CircleDashed className="w-4 h-4 text-emerald-400" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-lg bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 transition-all"
            title="Initialize New Encrypted Channel"
          >
            <MessageSquarePlus className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-2 rounded-lg bg-[#0d182e] border border-emerald-500/20 hover:border-emerald-400 text-gray-300 hover:text-emerald-400 transition-all"
              title="System Menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                {/* Transparent backdrop overlay so clicking the other side closes the menu */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-12 w-60 bg-[#0a1329] rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] py-2 border border-emerald-500/30 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs font-mono text-gray-200 backdrop-blur-xl"
                  onClick={() => setMenuOpen(false)}
                >
                  <button
                    onClick={onOpenPasskeys}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-emerald-300"
                  >
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    <span>Passkeys & Biometrics</span>
                  </button>
                  <button
                    onClick={onOpenLinkedDevices}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-cyan-300"
                  >
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    <span>Hardware Linked Devices</span>
                  </button>
                  <button
                    onClick={onLockApp}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-amber-300"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Lock Security Enclave</span>
                  </button>
                  <div className="my-1 border-t border-emerald-500/15" />
                  <button
                    onClick={onOpenSettings}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-gray-300"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span>Supabase & MojoAuth Hub</span>
                  </button>
                  <button
                    onClick={onOpenAdmin}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-emerald-400 font-bold"
                  >
                    <ShieldAlert className="w-4 h-4 text-emerald-400" />
                    <span>System Admin Console</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-[#0f1d3d] text-red-400"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Terminate Session</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cyber Search Bar & Filter Pills */}
      <div className="p-3 border-b border-emerald-500/15 space-y-2.5 bg-[#060d1d] shrink-0">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-emerald-400/60">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="QUERY ENCRYPTED NODES... [⌘K]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-[#040813] border border-emerald-500/25 text-emerald-300 rounded-xl text-xs font-mono placeholder-gray-500 focus:outline-hidden focus:border-emerald-400 focus:shadow-[0_0_12px_rgba(0,245,160,0.2)] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs font-mono text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar font-mono">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wider transition-all ${
              filterType === 'all'
                ? 'bg-emerald-500 text-gray-950 shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#09142b] border border-emerald-500/20 text-gray-400 hover:text-white'
            }`}
          >
            [ALL NODES]
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wider transition-all ${
              filterType === 'unread'
                ? 'bg-emerald-500 text-gray-950 shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#09142b] border border-emerald-500/20 text-gray-400 hover:text-white'
            }`}
          >
            [UNREAD]
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wider transition-all ${
              filterType === 'groups'
                ? 'bg-emerald-500 text-gray-950 shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'bg-[#09142b] border border-emerald-500/20 text-gray-400 hover:text-white'
            }`}
          >
            [SECURE GROUPS]
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-emerald-500/10">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs font-mono space-y-3">
            <Radio className="w-8 h-8 text-emerald-400/40 mx-auto animate-pulse" />
            <div>NO ACTIVE ENCRYPTED NODES FOUND</div>
            <button
              onClick={onOpenNewChat}
              className="text-emerald-400 hover:underline font-bold"
            >
              [+ INITIALIZE FIRST CHANNEL]
            </button>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = activeChatId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectChat(conv);
                  supabaseData.markAsRead(conv.id);
                }}
                className={`flex items-center px-3.5 py-3 cursor-pointer transition-all relative group ${
                  isActive
                    ? 'bg-[#0d1a38] border-l-2 border-emerald-400 shadow-inner'
                    : 'hover:bg-[#081226]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative mr-3.5 shrink-0">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.name}
                    className="w-11 h-11 rounded-xl object-cover border border-emerald-400/30 p-0.5 bg-[#030712]"
                  />
                  {conv.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#050b17] radar-online" />
                  )}
                </div>

                {/* Info & Last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white truncate group-hover:text-emerald-300 transition-colors">
                      {conv.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono shrink-0 ${
                        conv.unreadCount > 0 ? 'text-emerald-400 font-bold' : 'text-gray-500'
                      }`}
                    >
                      {conv.lastMessageTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1.5 text-[11px] font-mono text-gray-400 truncate">
                      {/* Typing indicator or tick icon */}
                      {conv.typingStatus ? (
                        <span className="text-emerald-400 font-medium animate-pulse flex items-center space-x-1">
                          <Cpu className="w-3 h-3 text-emerald-400 inline" />
                          <span>typing...</span>
                        </span>
                      ) : (
                        <>
                          <span className="text-cyan-400 shrink-0">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </span>
                          <span className="truncate">{conv.lastMessage || 'Encrypted packet buffer'}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                      {conv.isMuted && <VolumeX className="w-3.5 h-3.5 text-gray-500" />}
                      {conv.isPinned && <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 min-w-4.5 h-4.5 bg-emerald-500 text-gray-950 text-[10px] font-bold font-mono rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(0,245,160,0.5)]">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Node Telemetry Status Bar */}
      <div className="h-7 px-3 bg-[#040813] border-t border-emerald-500/15 flex items-center justify-between text-[9px] font-mono text-gray-500">
        <div className="flex items-center space-x-1.5">
          <Terminal className="w-3 h-3 text-emerald-400/70" />
          <span>CHANNELS: {conversations.length} SECURE</span>
        </div>
        <div className="flex items-center space-x-1 text-emerald-400/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PING: 18ms // LOSS: 0%</span>
        </div>
      </div>
    </div>
  );
};
