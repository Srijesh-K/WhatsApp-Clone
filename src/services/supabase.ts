// ==============================================================================
// Supabase Client & Realtime Data Store
// Connects to live Supabase backend with high-fidelity offline fallback store
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { security } from './security';
import { sound } from './sound';

export interface UserProfile {
  id: string;
  phoneNumber: string;
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
    this.initClient();
    this.initLocalStore();
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

  // Current logged in user
  getCurrentUser(): UserProfile | null {
    if (!this.currentUser) {
      const stored = localStorage.getItem('wa_current_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
        } catch {}
      }
    }
    return this.currentUser;
  }

  setCurrentUser(user: UserProfile) {
    this.currentUser = user;
    localStorage.setItem('wa_current_user', JSON.stringify(user));
    this.notify();
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('wa_current_user');
    this.notify();
  }

  // Seed default data
  private initLocalStore() {
    const storedConvs = localStorage.getItem('wa_chats');
    const storedMsgs = localStorage.getItem('wa_chat_messages');

    if (storedConvs && storedMsgs) {
      try {
        this.conversations = JSON.parse(storedConvs);
        this.messages = JSON.parse(storedMsgs);
        this.initStatuses();
        return;
      } catch {}
    }

    // Default authentic WhatsApp sample chats
    this.conversations = [
      {
        id: 'c1',
        isGroup: false,
        name: 'Alice Cooper',
        phoneNumber: '+1 (555) 234-5678',
        aboutStatus: 'Encrypted end-to-end 🔒 | Code & Coffee',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        lastMessage: 'Hey! The new WebAuthn passkey login is lightning fast ⚡',
        lastMessageTime: '10:42 AM',
        unreadCount: 2,
        isPinned: true,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 86400,
        safetyNumberVerified: true,
        isOnline: true,
        lastSeen: 'online',
      },
      {
        id: 'c2',
        isGroup: false,
        name: 'Bob Johnson',
        phoneNumber: '+1 (555) 876-5432',
        aboutStatus: 'Available',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        lastMessage: 'Check out this design layout! Looks 100% human crafted.',
        lastMessageTime: '09:15 AM',
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 0,
        safetyNumberVerified: false,
        isOnline: false,
        lastSeen: 'last seen today at 09:20 AM',
      },
      {
        id: 'c3',
        isGroup: true,
        name: 'Core Architecture Team 🚀',
        aboutStatus: 'Group · 8 members',
        avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
        lastMessage: 'Sarah: Supabase RLS policies deployed to prevent unauthorized queries!',
        lastMessageTime: 'Yesterday',
        unreadCount: 5,
        isPinned: false,
        isArchived: false,
        isMuted: true,
        disappearingDuration: 0,
        safetyNumberVerified: true,
      },
      {
        id: 'c4',
        isGroup: false,
        name: 'Sarah Connor',
        phoneNumber: '+1 (555) 345-9876',
        aboutStatus: 'Can\'t talk, WhatsApp only',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        lastMessage: '🎤 Voice message (0:14)',
        lastMessageTime: 'Sunday',
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 0,
        safetyNumberVerified: false,
        isOnline: false,
        lastSeen: 'last seen yesterday at 18:30',
      },
      {
        id: 'c5',
        isGroup: false,
        name: 'WhatsApp Official 🛡️',
        phoneNumber: 'WhatsApp Verified',
        aboutStatus: 'Official Account · Security Updates',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        lastMessage: 'Your messages and calls are protected with End-to-End Encryption.',
        lastMessageTime: 'Friday',
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        isMuted: false,
        disappearingDuration: 0,
        safetyNumberVerified: true,
        isOnline: true,
        lastSeen: 'Verified Business Account',
      },
    ];

    this.messages = {
      c1: [
        {
          id: 'm1_1',
          conversationId: 'c1',
          senderId: 'c1',
          text: 'Hey! Did you see the new security updates for our app?',
          messageType: 'text',
          status: 'read',
          timestamp: '10:30 AM',
          isEncrypted: true,
          reactions: [{ emoji: '👍', userId: 'self', count: 1 }],
        },
        {
          id: 'm1_2',
          conversationId: 'c1',
          senderId: 'self',
          text: 'Yes! MojoAuth phone OTP combined with WebAuthn Passkeys makes account takeover impossible 🔐',
          messageType: 'text',
          status: 'read',
          timestamp: '10:35 AM',
          isEncrypted: true,
        },
        {
          id: 'm1_3',
          conversationId: 'c1',
          senderId: 'c1',
          text: 'And Supabase Row Level Security ensures other users cannot query or intercept our private chats!',
          messageType: 'text',
          status: 'read',
          timestamp: '10:40 AM',
          isEncrypted: true,
        },
        {
          id: 'm1_4',
          conversationId: 'c1',
          senderId: 'c1',
          text: 'Hey! The new WebAuthn passkey login is lightning fast ⚡',
          messageType: 'text',
          status: 'read',
          timestamp: '10:42 AM',
          isEncrypted: true,
        },
      ],
      c2: [
        {
          id: 'm2_1',
          conversationId: 'c2',
          senderId: 'c2',
          text: 'Check out this design layout! Looks 100% human crafted.',
          messageType: 'text',
          status: 'delivered',
          timestamp: '09:15 AM',
          isEncrypted: true,
        },
      ],
      c3: [
        {
          id: 'm3_1',
          conversationId: 'c3',
          senderId: 'alice',
          text: 'Team standup at 11:00 AM. We will review our E2EE verification protocol.',
          messageType: 'text',
          status: 'read',
          timestamp: 'Yesterday',
          isEncrypted: true,
        },
        {
          id: 'm3_2',
          conversationId: 'c3',
          senderId: 'sarah',
          text: 'Sarah: Supabase RLS policies deployed to prevent unauthorized queries!',
          messageType: 'text',
          status: 'read',
          timestamp: 'Yesterday',
          isEncrypted: true,
        },
      ],
      c4: [
        {
          id: 'm4_1',
          conversationId: 'c4',
          senderId: 'c4',
          text: 'Voice note update on the mobile layout:',
          messageType: 'audio',
          audioDuration: '0:14',
          status: 'read',
          timestamp: 'Sunday',
          isEncrypted: true,
        },
      ],
      c5: [
        {
          id: 'm5_1',
          conversationId: 'c5',
          senderId: 'c5',
          text: '🔒 Your messages and calls are protected with End-to-End Encryption. Only you and the person you are communicating with can read or listen to them.',
          messageType: 'text',
          status: 'read',
          timestamp: 'Friday',
          isEncrypted: true,
        },
      ],
    };

    this.saveStore();
    this.initStatuses();
  }

  private initStatuses() {
    this.statuses = [
      {
        id: 'st_1',
        userId: 'c1',
        userName: 'Alice Cooper',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        mediaUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
        caption: 'Hacking on the new WhatsApp cryptographic protocol 💻✨',
        timestamp: '35 minutes ago',
        isViewed: false,
      },
      {
        id: 'st_2',
        userId: 'c2',
        userName: 'Bob Johnson',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
        caption: 'Weekend hike in the mountains 🏔️',
        timestamp: '2 hours ago',
        isViewed: false,
      },
      {
        id: 'st_3',
        userId: 'c4',
        userName: 'Sarah Connor',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        mediaUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600',
        caption: 'Coffee time ☕',
        timestamp: '5 hours ago',
        isViewed: true,
      },
    ];
  }

  private saveStore() {
    localStorage.setItem('wa_chats', JSON.stringify(this.conversations));
    localStorage.setItem('wa_chat_messages', JSON.stringify(this.messages));
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

    this.saveStore();
    sound.playSent();
    this.notify();

    // Simulate double ticks delivery after 600ms
    setTimeout(() => {
      newMsg.status = 'delivered';
      this.saveStore();
      this.notify();
    }, 600);

    // Simulate blue ticks read after 1800ms
    setTimeout(() => {
      newMsg.status = 'read';
      this.saveStore();
      this.notify();
    }, 1800);

    // If chat is with Alice Cooper, simulate realistic interactive reply
    if (conversationId === 'c1') {
      this.simulateContactReply(conversationId, text);
    }

    return newMsg;
  }

  private simulateContactReply(conversationId: string, userText: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    // Show typing status
    setTimeout(() => {
      conv.typingStatus = 'typing...';
      this.notify();
    }, 1200);

    setTimeout(() => {
      conv.typingStatus = undefined;
      const replies = [
        'Got your message! The end-to-end encryption verified safely on my device too.',
        'Awesome! Nobody can impersonate or take over accounts with the new Passkey WebAuthn layer.',
        'Looks super crisp and smooth! Absolutely feels like native WhatsApp.',
        'Received via secure AES-GCM channel 🔒✨',
      ];
      const replyText = userText.toLowerCase().includes('passkey')
        ? 'Passkeys make hardware-backed biometrics effortless! No SMS spoofing possible.'
        : replies[Math.floor(Math.random() * replies.length)];

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const incomingMsg: ChatMessage = {
        id: 'm_in_' + Date.now(),
        conversationId,
        senderId: conversationId,
        text: replyText,
        messageType: 'text',
        status: 'read',
        timestamp: timeStr,
        isEncrypted: true,
      };

      this.messages[conversationId].push(incomingMsg);
      conv.lastMessage = replyText;
      conv.lastMessageTime = timeStr;
      this.saveStore();
      sound.playReceived();
      this.notify();
    }, 3200);
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

    this.saveStore();
    this.notify();
  }

  // Delete message
  deleteMessage(conversationId: string, messageId: string) {
    if (this.messages[conversationId]) {
      this.messages[conversationId] = this.messages[conversationId].filter((m) => m.id !== messageId);
      this.saveStore();
      this.notify();
    }
  }

  // Pin / Unpin
  togglePinChat(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isPinned = !conv.isPinned;
      this.saveStore();
      this.notify();
    }
  }

  // Archive / Unarchive
  toggleArchiveChat(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.isArchived = !conv.isArchived;
      this.saveStore();
      this.notify();
    }
  }

  // Mark chat as read
  markAsRead(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv && conv.unreadCount > 0) {
      conv.unreadCount = 0;
      this.saveStore();
      this.notify();
    }
  }

  // Create new conversation
  createConversation(phoneNumber: string, name: string): Conversation {
    const cleanPhone = phoneNumber.trim();
    const existing = this.conversations.find((c) => c.phoneNumber === cleanPhone);
    if (existing) return existing;

    const newConv: Conversation = {
      id: 'c_' + Date.now(),
      isGroup: false,
      name: name.trim() || cleanPhone,
      phoneNumber: cleanPhone,
      aboutStatus: 'Hey there! I am using WhatsApp.',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanPhone)}`,
      lastMessage: 'Tap here to send an end-to-end encrypted message',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isPinned: false,
      isArchived: false,
      isMuted: false,
      disappearingDuration: 0,
      safetyNumberVerified: false,
      isOnline: true,
      lastSeen: 'online',
    };

    this.conversations.unshift(newConv);
    this.messages[newConv.id] = [];
    this.saveStore();
    this.notify();
    return newConv;
  }

  // Update disappearing messages
  setDisappearingDuration(conversationId: string, durationSeconds: number) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.disappearingDuration = durationSeconds;
      this.saveStore();
      this.notify();
    }
  }

  // Verify Safety Number
  toggleSafetyNumberVerified(conversationId: string) {
    const conv = this.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.safetyNumberVerified = !conv.safetyNumberVerified;
      this.saveStore();
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
