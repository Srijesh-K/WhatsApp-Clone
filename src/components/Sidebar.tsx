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
    <div className="w-full md:w-96 lg:w-[410px] h-full bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-gray-800 flex flex-col select-none shrink-0">
      {/* Top Header Bar */}
      <div className="h-15 px-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between border-b border-gray-200 dark:border-gray-800 shrink-0">
        {/* User avatar & status */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="relative">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.fullName}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#202c33]" />
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
              {currentUser.fullName}
            </div>
            <div className="text-[11px] text-gray-500 truncate max-w-[120px]">
              {currentUser.phoneNumber}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600 dark:text-gray-300">
          {/* Status Stories Button */}
          <button
            onClick={onOpenStatusStories}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
            title="Status Stories"
          >
            <CircleDashed className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-[#00a884] dark:hover:text-[#00a884]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#00a884] rounded-full" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                {/* Transparent backdrop overlay so clicking the other side closes the menu */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-11 w-56 bg-white dark:bg-[#233138] rounded-xl shadow-xl py-2 border border-gray-200 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-100 text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <button
                    onClick={onOpenPasskeys}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <KeyRound className="w-4 h-4 text-[#00a884]" />
                    <span>Passkeys & Security</span>
                  </button>
                  <button
                    onClick={onOpenLinkedDevices}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <Laptop className="w-4 h-4 text-sky-500" />
                    <span>Linked Devices</span>
                  </button>
                  <button
                    onClick={onLockApp}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Lock WhatsApp Now</span>
                  </button>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                  <button
                    onClick={onOpenSettings}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229]"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Supabase & MojoAuth Settings</span>
                  </button>
                  <button
                    onClick={onOpenAdmin}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#00a884]" />
                    <span>System Admin Console</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] text-red-500"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Pills */}
      <div className="p-2.5 border-b border-gray-200 dark:border-gray-800 space-y-2 bg-white dark:bg-[#111b21] shrink-0">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-gray-500 dark:text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-[#f0f2f5] dark:bg-[#202c33] text-gray-900 dark:text-white rounded-lg text-xs placeholder-gray-500 dark:placeholder-gray-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 pt-0.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-[#00a884] text-white'
                : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterType === 'unread'
                ? 'bg-[#00a884] text-white'
                : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterType === 'groups'
                ? 'bg-[#00a884] text-white'
                : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/40">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs space-y-2">
            <div>No chats found.</div>
            <button
              onClick={onOpenNewChat}
              className="text-[#00a884] hover:underline font-medium"
            >
              Start a new chat
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
                className={`flex items-center px-3.5 py-3 cursor-pointer transition-colors relative group ${
                  isActive
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-gray-50 dark:hover:bg-[#202c33]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative mr-3.5 shrink-0">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-700"
                  />
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#111b21]" />
                  )}
                </div>

                {/* Info & Last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {conv.name}
                    </span>
                    <span
                      className={`text-[11px] shrink-0 font-medium ${
                        conv.unreadCount > 0 ? 'text-[#00a884]' : 'text-gray-400'
                      }`}
                    >
                      {conv.lastMessageTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      {/* Typing indicator or tick icon */}
                      {conv.typingStatus ? (
                        <span className="text-[#00a884] font-medium animate-pulse">
                          typing...
                        </span>
                      ) : (
                        <>
                          <span className="text-[#53bdeb] shrink-0">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </span>
                          <span className="truncate">{conv.lastMessage || 'Encrypted message'}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                      {conv.isMuted && <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
                      {conv.isPinned && <Pin className="w-3.5 h-3.5 text-gray-400 fill-gray-400" />}
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 min-w-5 h-5 bg-[#25d366] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
    </div>
  );
};
