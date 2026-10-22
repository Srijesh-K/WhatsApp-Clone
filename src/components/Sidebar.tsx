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

  // Close menu when clicking outside
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
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phoneNumber?.toLowerCase().includes(q);
      const matchMsg = c.lastMessage?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMsg) return false;
    }

    if (filterType === 'unread') return c.unreadCount > 0;
    if (filterType === 'groups') return c.isGroup;
    return !c.isArchived;
  });

  return (
    <div className="w-full md:w-96 lg:w-[410px] h-full bg-white dark:bg-[#111b21] border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 font-sans select-none">
      {/* Top Header */}
      <div className="h-15 px-4 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between shrink-0">
        {/* User Profile */}
        <div className="flex items-center space-x-3 cursor-pointer">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.fullName}
            className="w-10 h-10 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
          />
          <div className="hidden lg:block min-w-0">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
              {currentUser.fullName}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
          {/* Status Stories Button */}
          <button
            onClick={onOpenStatusStories}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
            title="Status"
          >
            <CircleDashed className="w-5 h-5" />
          </button>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* 3-Dots Menu Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop overlay so clicking anywhere closes menu */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 top-11 w-56 bg-white dark:bg-[#233138] rounded-lg shadow-xl py-2 border border-gray-100 dark:border-gray-700/50 z-50 animate-in fade-in zoom-in-95 duration-100 text-sm text-gray-800 dark:text-gray-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <button
                    onClick={onOpenNewChat}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors cursor-pointer"
                  >
                    <span>New chat</span>
                  </button>
                  <button
                    onClick={onOpenLinkedDevices}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors cursor-pointer"
                  >
                    <Laptop className="w-4 h-4 text-gray-500" />
                    <span>Linked devices</span>
                  </button>
                  <button
                    onClick={onOpenPasskeys}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-gray-500" />
                    <span>Passkeys & security</span>
                  </button>
                  <button
                    onClick={onLockApp}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span>Lock WhatsApp</span>
                  </button>
                  <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                  <button
                    onClick={onOpenSettings}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={onOpenAdmin}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] text-[#00a884] font-medium transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Admin console</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="w-full px-4 py-2.5 text-left flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-[#182229] text-red-500 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out (Back to login)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-800 space-y-2 bg-white dark:bg-[#111b21] shrink-0">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-gray-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-[#f0f2f5] dark:bg-[#202c33] text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center space-x-2 px-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#00a884] text-white'
                : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filterType === 'unread'
                ? 'bg-[#00a884] text-white'
                : 'bg-gray-100 dark:bg-[#202c33] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterType('groups')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
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
          <div className="p-8 text-center text-gray-400 text-sm space-y-2">
            <div>No chats found</div>
            <button
              onClick={onOpenNewChat}
              className="text-[#00a884] hover:underline font-medium text-xs cursor-pointer"
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
                className={`flex items-center px-3.5 py-3 cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
                    : 'hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative mr-3.5 shrink-0">
                  <img
                    src={conv.avatarUrl}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
                  />
                  {conv.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#111b21]" />
                  )}
                </div>

                {/* Info & Last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-normal text-gray-900 dark:text-gray-100 truncate">
                      {conv.name}
                    </span>
                    <span
                      className={`text-xs shrink-0 ${
                        conv.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-gray-400'
                      }`}
                    >
                      {conv.lastMessageTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                      {conv.typingStatus ? (
                        <span className="text-[#00a884] font-medium">typing...</span>
                      ) : (
                        <>
                          <CheckCheck className="w-4 h-4 text-[#53bdeb] shrink-0" />
                          <span className="truncate">{conv.lastMessage || 'Tap to chat'}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 ml-2 shrink-0">
                      {conv.isMuted && <VolumeX className="w-4 h-4 text-gray-400" />}
                      {conv.isPinned && <Pin className="w-3.5 h-3.5 text-gray-400 fill-gray-400" />}
                      {conv.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 min-w-5 h-5 bg-[#25d366] text-white text-xs font-semibold rounded-full flex items-center justify-center">
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
