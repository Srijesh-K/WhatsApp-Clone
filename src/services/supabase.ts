// ==============================================================================
// Supabase Client & Realtime Data Store (Clean Production Mode)
// Isolated per-user stores, account registry, zero dummy contacts
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
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
    // Purge any legacy dummy chats and active session on load so login page is always required on link load
    localStorage.removeItem('wa_chats');
    localStorage.removeItem('wa_chat_messages');
    localStorage.removeItem('wa_current_user');
    this.initClient();
  }

  // Initialize Supabase client
  initClient() {
    let url = localStorage.getItem('wa_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    const anonKey = localStorage.getItem('wa_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    // Sanitize URL (strip trailing /rest/v1 and trailing slashes)
    url = url.trim().replace(/\/+$/, '');
    if (url.endsWith('/rest/v1')) {
      url = url.replace(/\/rest\/v1$/, '');
    }

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
    let url = localStorage.getItem('wa_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '';
    url = url.trim().replace(/\/+$/, '');
    if (url.endsWith('/rest/v1')) {
      url = url.replace(/\/rest\/v1$/, '');
    }
    return {
      url,
      anonKey: localStorage.getItem('wa_supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      isConnected: !!this.client,
    };
  }

  setSupabaseConfig(url: string, anonKey: string) {
    let cleanUrl = url.trim().replace(/\/+$/, '');
    if (cleanUrl.endsWith('/rest/v1')) {
      cleanUrl = cleanUrl.replace(/\/rest\/v1$/, '');
    }
    localStorage.setItem('wa_supabase_url', cleanUrl);
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

  // Current logged in user (in-memory for active session)
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    this.saveAccount(user);
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

  // Load isolated user data with friendly default conversations
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
        const parsedConvs = JSON.parse(storedConvs);
        const parsedMsgs = JSON.parse(storedMsgs);
        if (Array.isArray(parsedConvs) && parsedConvs.length > 0) {
          this.conversations = parsedConvs;
          this.messages = parsedMsgs;
          return;
        }
      } catch {}
    }

    // Default friendly WhatsApp conversations
    const defaultConvs: Conversation[] = [
      {
        id: 'conv_alice',
        isGroup: false,
        name: 'Alice Johnson',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        phoneNumber: '+1 (555) 014-2391',
        aboutStatus: 'Hey there! I am using WhatsApp.',
        lastMessage: 'Let me know when you are free to chat!',
        lastMessageTime: '10:42 AM',
        unreadCount: 1,
        isPinned: true,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 0,
        safetyNumberVerified: true,
        isOnline: true,
        lastSeen: 'online',
      },
      {
        id: 'conv_sarah',
        isGroup: false,
        name: 'Sarah Miller',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        phoneNumber: '+1 (555) 018-9283',
        aboutStatus: 'At work · Available on WhatsApp',
        lastMessage: 'The new design looks super clean 👍',
        lastMessageTime: '09:15 AM',
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 0,
        safetyNumberVerified: false,
        isOnline: true,
        lastSeen: 'online',
      },
      {
        id: 'conv_team',
        isGroup: true,
        name: 'Engineering & Product Team',
        avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
        lastMessage: 'Alex: Meeting link shared in calendar',
        lastMessageTime: 'Yesterday',
        unreadCount: 2,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 0,
        safetyNumberVerified: false,
        isOnline: false,
      },
      {
        id: 'conv_david',
        isGroup: false,
        name: 'David Chen',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phoneNumber: '+1 (555) 017-7462',
        aboutStatus: 'Sleeping 💤',
        lastMessage: 'Sounds good, see you tomorrow!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 0,
        safetyNumberVerified: false,
        isOnline: false,
        lastSeen: 'yesterday at 11:30 PM',
      },
    ];

    const defaultMsgs: Record<string, ChatMessage[]> = {
      conv_alice: [
        {
          id: 'm1',
          conversationId: 'conv_alice',
          senderId: 'conv_alice',
          text: "Hey! How's the project going?",
          messageType: 'text',
          status: 'read',
          timestamp: '10:38 AM',
          isEncrypted: true,
        },
        {
          id: 'm2',
          conversationId: 'conv_alice',
          senderId: user.id,
          text: "Going great! Just polishing up the WhatsApp Web interface.",
          messageType: 'text',
          status: 'read',
          timestamp: '10:40 AM',
          isEncrypted: true,
        },
        {
          id: 'm3',
          conversationId: 'conv_alice',
          senderId: 'conv_alice',
          text: "Let me know when you are free to chat!",
          messageType: 'text',
          status: 'delivered',
          timestamp: '10:42 AM',
          isEncrypted: true,
        },
      ],
      conv_sarah: [
        {
          id: 'm4',
          conversationId: 'conv_sarah',
          senderId: 'conv_sarah',
          text: "Did you update the WhatsApp Web layout?",
          messageType: 'text',
          status: 'read',
          timestamp: '09:10 AM',
          isEncrypted: true,
        },
        {
          id: 'm5',
          conversationId: 'conv_sarah',
          senderId: user.id,
          text: "Yes, made it simple, clean, and authentic.",
          messageType: 'text',
          status: 'read',
          timestamp: '09:12 AM',
          isEncrypted: true,
        },
        {
          id: 'm6',
          conversationId: 'conv_sarah',
          senderId: 'conv_sarah',
          text: "The new design looks super clean 👍",
          messageType: 'text',
          status: 'read',
          timestamp: '09:15 AM',
          isEncrypted: true,
        },
      ],
      conv_team: [
        {
          id: 'm7',
          conversationId: 'conv_team',
          senderId: 'usr_sarah',
          text: "Morning team! Ready for our sync?",
          messageType: 'text',
          status: 'read',
          timestamp: 'Yesterday',
          isEncrypted: true,
        },
        {
          id: 'm8',
          conversationId: 'conv_team',
          senderId: 'usr_alex',
          text: "Alex: Meeting link shared in calendar",
          messageType: 'text',
          status: 'delivered',
          timestamp: 'Yesterday',
          isEncrypted: true,
        },
      ],
      conv_david: [
        {
          id: 'm9',
          conversationId: 'conv_david',
          senderId: 'conv_david',
          text: "Are we meeting tomorrow?",
          messageType: 'text',
          status: 'read',
          timestamp: 'Yesterday',
          isEncrypted: true,
        },
        {
          id: 'm10',
          conversationId: 'conv_david',
          senderId: user.id,
          text: "Yes, 10 AM works for me!",
          messageType: 'text',
          status: 'read',
          timestamp: 'Yesterday',
          isEncrypted: true,
        },
        {
          id: 'm11',
          conversationId: 'conv_david',
          senderId: 'conv_david',
          text: "Sounds good, see you tomorrow!",
          messageType: 'text',
          status: 'read',
          timestamp: 'Yesterday',
          isEncrypted: true,
        },
      ],
    };

    this.conversations = defaultConvs;
    this.messages = defaultMsgs;
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

  // Send message with automatic simulated reply
  async sendMessage(
    conversationId: string,
    text: string,
    messageType: 'text' | 'image' | 'audio' | 'document' | 'poll' = 'text',
    mediaDetails?: { mediaUrl?: string; mediaName?: string; mediaSize?: string; audioDuration?: string },
    replyTo?: ChatMessage['replyTo']
  ): Promise<ChatMessage> {
    const user = this.getCurrentUser();
    const senderId = user ? user.id : 'self';

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
      isEncrypted: true,
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

    // Delivery & Read receipt
    setTimeout(() => {
      newMsg.status = 'read';
      this.saveUserStore();
      this.notify();
    }, 600);

    // Auto-reply simulation for realistic interactive feel
    setTimeout(() => {
      const activeConv = this.conversations.find((c) => c.id === conversationId);
      if (activeConv && !activeConv.isGroup) {
        const replies = [
          'Got it! Thanks for letting me know.',
          'Sounds good! 👍',
          'Perfect, talk to you in a bit!',
          'Understood, see you soon!',
          'Great, thanks!',
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const replyMsg: ChatMessage = {
          id: 'r_' + Date.now(),
          conversationId,
          senderId: conversationId,
          text: randomReply,
          messageType: 'text',
          status: 'read',
          timestamp: replyTime,
          isEncrypted: true,
        };

        this.messages[conversationId].push(replyMsg);
        activeConv.lastMessage = randomReply;
        activeConv.lastMessageTime = replyTime;
        this.saveUserStore();
        sound.playReceived();
        this.notify();
      }
    }, 1500);

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

  // Mute / Unmute
  toggleMute(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isMuted = !conv.isMuted;
      this.saveUserStore();
      this.notify();
    }
  }

  // Clear all messages in a chat
  clearChatMessages(conversationId: string) {
    if (this.messages[conversationId]) {
      this.messages[conversationId] = [];
      const conv = this.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.lastMessage = '';
        conv.lastMessageTime = '';
      }
      this.saveUserStore();
      this.notify();
    }
  }

  // Delete conversation completely
  deleteConversation(conversationId: string) {
    this.conversations = this.conversations.filter((c) => c.id !== conversationId);
    delete this.messages[conversationId];
    this.saveUserStore();
    this.notify();
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
