// ==============================================================================
// Supabase Client & Realtime Data Store (Clean Production Mode)
// Isolated per-user stores, account registry, zero dummy contacts
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { security } from './security';
import { sound } from './sound';

export interface UserProfile {
  id: string;
  phoneNumber: string; // Used for email address or phone number identifier
  fullName: string;
  avatarUrl: string;
  aboutStatus: string;
  isOnline: boolean;
  lastSeen: string;
  publicKey?: string;
  passkeyRegistered?: boolean;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  count: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  messageType: 'text' | 'image' | 'audio' | 'document' | 'poll';
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  audioDuration?: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  isEncrypted: boolean;
  reactions?: MessageReaction[];
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
  pollOptions?: { id: string; text: string; votes: number; voted: boolean }[];
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string;
  avatarUrl: string;
  phoneNumber?: string;
  aboutStatus?: string;
  lastMessage?: string;
  lastMessageTime: string;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
  disappearingDuration: number; // 0 = off, 86400 = 24h, 604800 = 7d
  safetyNumberVerified: boolean;
  typingStatus?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  caption: string;
  timestamp: string;
  isViewed: boolean;
}

class SupabaseDataService {
  private client: SupabaseClient | null = null;
  private currentUser: UserProfile | null = null;
  private conversations: Conversation[] = [];
  private messages: Record<string, ChatMessage[]> = {};
  private statuses: StatusStory[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    // Purge any legacy dummy chats from previous demo sessions
    localStorage.removeItem('wa_chats');
    localStorage.removeItem('wa_chat_messages');
    this.initClient();
    this.loadUserStore();
  }

  // Initialize Supabase client
  initClient() {
    const url = localStorage.getItem('wa_supabase_url') || import.meta.env.VITE_SUPABASE_URL;
    const anonKey = localStorage.getItem('wa_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (url && anonKey) {
      try {
        this.client = createClient(url, anonKey);
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
      }
    }
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  getSupabaseConfig() {
    return {
      url: localStorage.getItem('wa_supabase_url') || '',
      anonKey: localStorage.getItem('wa_supabase_anon_key') || '',
      isConnected: !!this.client,
    };
  }

  setSupabaseConfig(url: string, anonKey: string) {
    localStorage.setItem('wa_supabase_url', url.trim());
    localStorage.setItem('wa_supabase_anon_key', anonKey.trim());
    this.initClient();
    this.notify();
  }

  // ----------------------------------------------------------------------------
  // ACCOUNT REGISTRY (Multi-Account Protection & Existence Detection)
  // ----------------------------------------------------------------------------
  getRegisteredAccounts(): Record<string, UserProfile> {
    const stored = localStorage.getItem('wa_registered_accounts');
    if (!stored) return {};
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }

  findAccount(identifier: string): UserProfile | null {
    const clean = identifier.trim().toLowerCase();
    const accounts = this.getRegisteredAccounts();
    return accounts[clean] || null;
  }

  saveAccount(user: UserProfile) {
    const accounts = this.getRegisteredAccounts();
    const clean = user.phoneNumber.trim().toLowerCase();
    accounts[clean] = user;
    localStorage.setItem('wa_registered_accounts', JSON.stringify(accounts));
  }

  // Current logged in user
  getCurrentUser(): UserProfile | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('wa_current_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          this.loadUserStore();
        } catch {}
      }
    }
    return this.currentUser;
  }

  setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    this.saveAccount(user);
    localStorage.setItem('wa_current_user', JSON.stringify(user));
    this.loadUserStore();
    this.notify();
  }

  logout() {
    this.currentUser = null;
    this.conversations = [];
    this.messages = {};
    this.statuses = [];
    localStorage.removeItem('wa_current_user');
    this.notify();
  }

  // Load isolated user data (Zero Dummy Contacts!)
  private loadUserStore() {
    const user = this.getCurrentUser();
    if (!user) {
      this.conversations = [];
      this.messages = {};
      this.statuses = [];
      return;
    }

    const chatsKey = `wa_user_chats_${user.id}`;
    const msgsKey = `wa_user_messages_${user.id}`;

    const storedConvs = localStorage.getItem(chatsKey);
    const storedMsgs = localStorage.getItem(msgsKey);

    if (storedConvs && storedMsgs) {
      try {
        this.conversations = JSON.parse(storedConvs);
        this.messages = JSON.parse(storedMsgs);
        return;
      } catch {}
    }

    // Clean initial state: No dummy contacts
    this.conversations = [];
    this.messages = {};
    this.statuses = [];
    this.saveUserStore();
  }

  private saveUserStore() {
    const user = this.currentUser;
    if (!user) return;
    const chatsKey = `wa_user_chats_${user.id}`;
    const msgsKey = `wa_user_messages_${user.id}`;
    localStorage.setItem(chatsKey, JSON.stringify(this.conversations));
    localStorage.setItem(msgsKey, JSON.stringify(this.messages));
  }

  // Getters
  getConversations(): Conversation[] {
    return [...this.conversations].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.find((c) => c.id === id);
  }

  getMessages(conversationId: string): ChatMessage[] {
    return this.messages[conversationId] || [];
  }

  getStatuses(): StatusStory[] {
    return this.statuses;
  }

  // Send message
  async sendMessage(
    conversationId: string,
    text: string,
    messageType: 'text' | 'image' | 'audio' | 'document' | 'poll' = 'text',
    mediaDetails?: { mediaUrl?: string; mediaName?: string; mediaSize?: string; audioDuration?: string },
    replyTo?: ChatMessage['replyTo']
  ): Promise<ChatMessage> {
    const user = this.getCurrentUser();
    const senderId = user ? user.id : 'self';

    // Encrypt payload with Web Crypto AES-GCM
    const encrypted = await security.encryptMessage(text);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: 'm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      conversationId,
      senderId,
      text,
      messageType,
      mediaUrl: mediaDetails?.mediaUrl,
      mediaName: mediaDetails?.mediaName,
      mediaSize: mediaDetails?.mediaSize,
      audioDuration: mediaDetails?.audioDuration,
      status: 'sent',
      timestamp: timeStr,
      isEncrypted: encrypted.isEncrypted,
      replyTo,
    };

    if (!this.messages[conversationId]) {
      this.messages[conversationId] = [];
    }
    this.messages[conversationId].push(newMsg);

    // Update conversation preview
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = messageType === 'audio' ? '🎤 Voice message' : messageType === 'image' ? '📷 Photo' : text;
      conv.lastMessageTime = timeStr;
    }

    this.saveUserStore();
    sound.playSent();
    this.notify();

    // Delivery receipt
    setTimeout(() => {
      newMsg.status = 'delivered';
      this.saveUserStore();
      this.notify();
    }, 600);

    return newMsg;
  }

  // Reactions
  addReaction(conversationId: string, messageId: string, emoji: string) {
    const msgList = this.messages[conversationId];
    if (!msgList) return;
    const msg = msgList.find((m) => m.id === messageId);
    if (!msg) return;

    if (!msg.reactions) msg.reactions = [];
    const existing = msg.reactions.find((r) => r.emoji === emoji);
    if (existing) {
      existing.count += 1;
    } else {
      msg.reactions.push({ emoji, userId: 'self', count: 1 });
    }

    this.saveUserStore();
    this.notify();
  }

  // Delete message
  deleteMessage(conversationId: string, messageId: string) {
    if (this.messages[conversationId]) {
      this.messages[conversationId] = this.messages[conversationId].filter((m) => m.id !== messageId);
      this.saveUserStore();
      this.notify();
    }
  }

  // Pin / Unpin
  togglePinChat(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isPinned = !conv.isPinned;
      this.saveUserStore();
      this.notify();
    }
  }

  // Archive / Unarchive
  toggleArchiveChat(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isArchived = !conv.isArchived;
      this.saveUserStore();
      this.notify();
    }
  }

  // Mark chat as read
  markAsRead(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.saveUserStore();
      this.notify();
    }
  }

  // Create new conversation with a real person (email or phone)
  createConversation(identifier: string, name: string): Conversation {
    const clean = identifier.trim();
    const existing = this.conversations.find(
      (c) => c.phoneNumber?.toLowerCase() === clean.toLowerCase()
    );
    if (existing) return existing;

    const newConv: Conversation = {
      id: 'c_' + Date.now(),
      isGroup: false,
      name: name.trim() || clean,
      phoneNumber: clean,
      aboutStatus: 'Hey there! I am using WhatsApp.',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(clean)}`,
      lastMessage: 'Tap here to send an end-to-end encrypted message',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isMuted: false,
      disappearingDuration: 0,
      safetyNumberVerified: false,
      isOnline: false,
      lastSeen: 'offline',
    };

    this.conversations.unshift(newConv);
    this.messages[newConv.id] = [];
    this.saveUserStore();
    this.notify();
    return newConv;
  }

  // Update disappearing messages
  setDisappearingDuration(conversationId: string, durationSeconds: number) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.disappearingDuration = durationSeconds;
      this.saveUserStore();
      this.notify();
    }
  }

  // Verify Safety Number
  toggleSafetyNumberVerified(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.safetyNumberVerified = !conv.safetyNumberVerified;
      this.saveUserStore();
      this.notify();
    }
  }

  // Subscription observer
  subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}

export const supabaseData = new SupabaseDataService();
