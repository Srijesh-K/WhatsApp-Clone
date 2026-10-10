// ==============================================================================
// Admin Management Service: System Access Key Gatekeeper & Database Inspector
// ==============================================================================

import { supabaseData, type UserProfile, type Conversation, type ChatMessage } from './supabase';

export interface SystemMetrics {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalLinkedDevices: number;
  storageUsageKb: number;
  supabaseConnected: boolean;
  accessKeySet: boolean;
}

export interface EnrichedMessage extends ChatMessage {
  ownerUserId: string;
  ownerUserName: string;
  conversationName: string;
}

export interface EnrichedConversation extends Conversation {
  ownerUserId: string;
  ownerUserName: string;
  messageCount: number;
}

const DEFAULT_ACCESS_KEY = 'admin@123';
const ACCESS_KEY_STORAGE = 'wa_master_admin_access_key';
const ADMIN_SESSION_STORAGE = 'wa_admin_session_auth_token';

class AdminService {
  // ----------------------------------------------------------------------------
  // 1. ACCESS KEY & AUTHENTICATION
  // ----------------------------------------------------------------------------

  getAccessKey(): string {
    const stored = localStorage.getItem(ACCESS_KEY_STORAGE);
    if (!stored || stored === 'ADMIN@WHATSAPP2026') {
      return DEFAULT_ACCESS_KEY;
    }
    return stored;
  }

  setAccessKey(newKey: string): void {
    if (!newKey || newKey.trim().length < 4) {
      throw new Error('Access key must be at least 4 characters long.');
    }
    localStorage.setItem(ACCESS_KEY_STORAGE, newKey.trim());
  }

  isDefaultKey(): boolean {
    return !localStorage.getItem(ACCESS_KEY_STORAGE);
  }

  verifyAccessKey(inputKey: string): boolean {
    const currentKey = this.getAccessKey();
    return inputKey.trim() === currentKey.trim();
  }

  login(inputKey: string): boolean {
    if (this.verifyAccessKey(inputKey)) {
      const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
      sessionStorage.setItem(ADMIN_SESSION_STORAGE, token);
      localStorage.setItem('wa_admin_last_login', new Date().toISOString());
      return true;
    }
    return false;
  }

  isAuthenticated(): boolean {
    const token = sessionStorage.getItem(ADMIN_SESSION_STORAGE);
    return !!token && token.startsWith('admin_session_');
  }

  logout(): void {
    sessionStorage.removeItem(ADMIN_SESSION_STORAGE);
  }

  getLastLogin(): string | null {
    return localStorage.getItem('wa_admin_last_login');
  }

  // ----------------------------------------------------------------------------
  // 2. USER MANAGEMENT ("See Whole Users")
  // ----------------------------------------------------------------------------

  getAllUsers(): UserProfile[] {
    const accounts = supabaseData.getRegisteredAccounts();
    const userList: UserProfile[] = Object.values(accounts);

    // Also scan localStorage for any orphan user stores (e.g. created in tests)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('wa_user_chats_')) {
        const userId = key.replace('wa_user_chats_', '');
        const exists = userList.some((u) => u.id === userId);
        if (!exists) {
          // Register mock placeholder profile so admin can inspect
          userList.push({
            id: userId,
            phoneNumber: `User_${userId.substring(0, 8)}`,
            fullName: `User ${userId.substring(0, 6)}`,
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            aboutStatus: 'Registered user store',
            isOnline: false,
            lastSeen: 'offline',
          });
        }
      }
    }

    // Sort by full name or creation
    return userList.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  getUserById(userId: string): UserProfile | null {
    const users = this.getAllUsers();
    return users.find((u) => u.id === userId) || null;
  }

  getUserStats(userId: string): { conversationCount: number; messageCount: number } {
    const chatsKey = `wa_user_chats_${userId}`;
    const msgsKey = `wa_user_messages_${userId}`;

    let conversationCount = 0;
    let messageCount = 0;

    try {
      const chatsRaw = localStorage.getItem(chatsKey);
      if (chatsRaw) {
        const chats: Conversation[] = JSON.parse(chatsRaw);
        conversationCount = chats.length;
      }
    } catch {}

    try {
      const msgsRaw = localStorage.getItem(msgsKey);
      if (msgsRaw) {
        const msgsRecord: Record<string, ChatMessage[]> = JSON.parse(msgsRaw);
        Object.values(msgsRecord).forEach((list) => {
          messageCount += list.length;
        });
      }
    } catch {}

    return { conversationCount, messageCount };
  }

  createUser(data: {
    fullName: string;
    phoneNumber: string;
    aboutStatus?: string;
    avatarUrl?: string;
  }): UserProfile {
    const cleanId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const cleanPhone = data.phoneNumber.trim();
    const cleanName = data.fullName.trim() || 'WhatsApp User';

    const newUser: UserProfile = {
      id: cleanId,
      phoneNumber: cleanPhone,
      fullName: cleanName,
      avatarUrl:
        data.avatarUrl ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanPhone || cleanName)}`,
      aboutStatus: data.aboutStatus || 'Hey there! I am using WhatsApp.',
      isOnline: true,
      lastSeen: 'online',
      passkeyRegistered: false,
    };

    supabaseData.saveAccount(newUser);

    // Initialize empty store
    localStorage.setItem(`wa_user_chats_${newUser.id}`, JSON.stringify([]));
    localStorage.setItem(`wa_user_messages_${newUser.id}`, JSON.stringify({}));

    return newUser;
  }

  updateUser(userId: string, updates: Partial<UserProfile>): boolean {
    const accounts = supabaseData.getRegisteredAccounts();
    let targetKey: string | null = null;
    let targetUser: UserProfile | null = null;

    for (const [key, user] of Object.entries(accounts)) {
      if (user.id === userId) {
        targetKey = key;
        targetUser = user;
        break;
      }
    }

    if (!targetUser) return false;

    const updatedUser: UserProfile = {
      ...targetUser,
      ...updates,
      id: targetUser.id, // Preserve ID
    };

    // If phone number changed, remove old key
    if (targetKey && updates.phoneNumber && updates.phoneNumber.toLowerCase() !== targetKey) {
      delete accounts[targetKey];
      accounts[updates.phoneNumber.toLowerCase()] = updatedUser;
    } else if (targetKey) {
      accounts[targetKey] = updatedUser;
    }

    localStorage.setItem('wa_registered_accounts', JSON.stringify(accounts));

    // If current logged-in user is this one, update session
    const current = supabaseData.getCurrentUser();
    if (current && current.id === userId) {
      supabaseData.setCurrentUser(updatedUser);
    }

    return true;
  }

  deleteUser(userId: string): boolean {
    const accounts = supabaseData.getRegisteredAccounts();
    let deleted = false;

    for (const [key, user] of Object.entries(accounts)) {
      if (user.id === userId) {
        delete accounts[key];
        deleted = true;
        break;
      }
    }

    if (deleted) {
      localStorage.setItem('wa_registered_accounts', JSON.stringify(accounts));
    }

    // Clean up stores
    localStorage.removeItem(`wa_user_chats_${userId}`);
    localStorage.removeItem(`wa_user_messages_${userId}`);

    // If active user is being deleted, logout
    const current = supabaseData.getCurrentUser();
    if (current && current.id === userId) {
      supabaseData.logout();
    }

    return true;
  }

  resetUserSecurity(phoneNumber: string): void {
    // Clear two step PIN and passkeys for testing
    localStorage.removeItem('wa_two_step_pin');
    localStorage.setItem('wa_two_step_enabled', 'false');
    localStorage.removeItem('wa_registered_passkeys');
    localStorage.setItem('wa_passkey_required', 'false');

    // Also update profile flag
    const user = supabaseData.findAccount(phoneNumber);
    if (user) {
      this.updateUser(user.id, { passkeyRegistered: false });
    }
  }

  // ----------------------------------------------------------------------------
  // 3. CONVERSATION MANAGEMENT
  // ----------------------------------------------------------------------------

  getAllConversations(): EnrichedConversation[] {
    const users = this.getAllUsers();
    const result: EnrichedConversation[] = [];

    users.forEach((user) => {
      const chatsKey = `wa_user_chats_${user.id}`;
      const msgsKey = `wa_user_messages_${user.id}`;
      try {
        const chatsRaw = localStorage.getItem(chatsKey);
        const msgsRaw = localStorage.getItem(msgsKey);
        const msgsRecord: Record<string, ChatMessage[]> = msgsRaw ? JSON.parse(msgsRaw) : {};

        if (chatsRaw) {
          const chats: Conversation[] = JSON.parse(chatsRaw);
          chats.forEach((chat) => {
            const count = msgsRecord[chat.id]?.length || 0;
            result.push({
              ...chat,
              ownerUserId: user.id,
              ownerUserName: user.fullName,
              messageCount: count,
            });
          });
        }
      } catch {}
    });

    return result;
  }

  deleteConversation(ownerUserId: string, conversationId: string): boolean {
    const chatsKey = `wa_user_chats_${ownerUserId}`;
    const msgsKey = `wa_user_messages_${ownerUserId}`;

    try {
      const chatsRaw = localStorage.getItem(chatsKey);
      if (chatsRaw) {
        let chats: Conversation[] = JSON.parse(chatsRaw);
        chats = chats.filter((c) => c.id !== conversationId);
        localStorage.setItem(chatsKey, JSON.stringify(chats));
      }

      const msgsRaw = localStorage.getItem(msgsKey);
      if (msgsRaw) {
        const msgsRecord: Record<string, ChatMessage[]> = JSON.parse(msgsRaw);
        delete msgsRecord[conversationId];
        localStorage.setItem(msgsKey, JSON.stringify(msgsRecord));
      }

      // If active user owns this, update memory
      const current = supabaseData.getCurrentUser();
      if (current && current.id === ownerUserId) {
        supabaseData.deleteConversation(conversationId);
      }

      return true;
    } catch {
      return false;
    }
  }

  // ----------------------------------------------------------------------------
  // 4. MESSAGES MANAGEMENT ("All the Things")
  // ----------------------------------------------------------------------------

  getAllMessages(): EnrichedMessage[] {
    const users = this.getAllUsers();
    const result: EnrichedMessage[] = [];

    users.forEach((user) => {
      const chatsKey = `wa_user_chats_${user.id}`;
      const msgsKey = `wa_user_messages_${user.id}`;
      try {
        const chatsRaw = localStorage.getItem(chatsKey);
        const convs: Conversation[] = chatsRaw ? JSON.parse(chatsRaw) : [];
        const convNameMap = new Map<string, string>();
        convs.forEach((c) => convNameMap.set(c.id, c.name));

        const msgsRaw = localStorage.getItem(msgsKey);
        if (msgsRaw) {
          const msgsRecord: Record<string, ChatMessage[]> = JSON.parse(msgsRaw);
          Object.entries(msgsRecord).forEach(([convId, messages]) => {
            messages.forEach((msg) => {
              result.push({
                ...msg,
                ownerUserId: user.id,
                ownerUserName: user.fullName,
                conversationName: convNameMap.get(convId) || `Chat ${convId}`,
              });
            });
          });
        }
      } catch {}
    });

    // Sort newest first
    return result.sort((a, b) => {
      const idA = a.id;
      const idB = b.id;
      return idB.localeCompare(idA);
    });
  }

  deleteMessage(ownerUserId: string, conversationId: string, messageId: string): boolean {
    const msgsKey = `wa_user_messages_${ownerUserId}`;
    try {
      const msgsRaw = localStorage.getItem(msgsKey);
      if (msgsRaw) {
        const msgsRecord: Record<string, ChatMessage[]> = JSON.parse(msgsRaw);
        if (msgsRecord[conversationId]) {
          msgsRecord[conversationId] = msgsRecord[conversationId].filter((m) => m.id !== messageId);
          localStorage.setItem(msgsKey, JSON.stringify(msgsRecord));

          const current = supabaseData.getCurrentUser();
          if (current && current.id === ownerUserId) {
            supabaseData.deleteMessage(conversationId, messageId);
          }
          return true;
        }
      }
    } catch {}
    return false;
  }

  // ----------------------------------------------------------------------------
  // 5. SYSTEM METRICS & TELEMETRY
  // ----------------------------------------------------------------------------

  getMetrics(): SystemMetrics {
    const users = this.getAllUsers();
    const convs = this.getAllConversations();
    const msgs = this.getAllMessages();

    let storageBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key);
        storageBytes += (key.length + (val ? val.length : 0)) * 2; // Approx UTF-16
      }
    }

    let linkedDevicesCount = 0;
    try {
      const raw = localStorage.getItem('wa_linked_devices');
      if (raw) {
        linkedDevicesCount = JSON.parse(raw).length;
      }
    } catch {}

    const cfg = supabaseData.getSupabaseConfig();

    return {
      totalUsers: users.length,
      totalConversations: convs.length,
      totalMessages: msgs.length,
      totalLinkedDevices: linkedDevicesCount,
      storageUsageKb: Math.round(storageBytes / 1024),
      supabaseConnected: cfg.isConnected,
      accessKeySet: !this.isDefaultKey(),
    };
  }

  // ----------------------------------------------------------------------------
  // 6. BACKUP, RESTORE & EXPORT
  // ----------------------------------------------------------------------------

  exportDatabase(): string {
    const backup: Record<string, any> = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      registeredAccounts: supabaseData.getRegisteredAccounts(),
      userStores: {} as Record<string, { chats: Conversation[]; messages: Record<string, ChatMessage[]> }>,
      securitySettings: {
        appLockEnabled: localStorage.getItem('wa_app_lock_enabled'),
        twoStepEnabled: localStorage.getItem('wa_two_step_enabled'),
        linkedDevices: localStorage.getItem('wa_linked_devices'),
        theme: localStorage.getItem('wa_theme'),
      },
    };

    const users = this.getAllUsers();
    users.forEach((u) => {
      const chatsRaw = localStorage.getItem(`wa_user_chats_${u.id}`);
      const msgsRaw = localStorage.getItem(`wa_user_messages_${u.id}`);
      backup.userStores[u.id] = {
        chats: chatsRaw ? JSON.parse(chatsRaw) : [],
        messages: msgsRaw ? JSON.parse(msgsRaw) : {},
      };
    });

    return JSON.stringify(backup, null, 2);
  }

  importDatabase(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.registeredAccounts || !data.userStores) {
        return { success: false, message: 'Invalid backup structure. Missing accounts or user stores.' };
      }

      localStorage.setItem('wa_registered_accounts', JSON.stringify(data.registeredAccounts));

      Object.entries(data.userStores).forEach(([userId, store]: [string, any]) => {
        if (store.chats) {
          localStorage.setItem(`wa_user_chats_${userId}`, JSON.stringify(store.chats));
        }
        if (store.messages) {
          localStorage.setItem(`wa_user_messages_${userId}`, JSON.stringify(store.messages));
        }
      });

      return { success: true, message: 'Database imported and restored successfully.' };
    } catch (err: any) {
      return { success: false, message: 'JSON Parse Error: ' + (err.message || 'Malformed file') };
    }
  }

  resetAllData(): void {
    const adminKey = this.getAccessKey();
    localStorage.clear();
    sessionStorage.clear();
    // Preserve admin access key
    localStorage.setItem(ACCESS_KEY_STORAGE, adminKey);
  }

  // ----------------------------------------------------------------------------
  // 7. SUPABASE CLOUD QUERY
  // ----------------------------------------------------------------------------

  async fetchSupabaseTable(tableName: string): Promise<{ data: any[] | null; error: string | null }> {
    const client = supabaseData.getClient();
    if (!client) {
      return { data: null, error: 'Supabase client is not connected. Add URL & Anon Key in Settings.' };
    }

    try {
      const { data, error } = await client.from(tableName).select('*').limit(50);
      if (error) {
        return { data: null, error: error.message };
      }
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message || 'Query failed' };
    }
  }
}

export const adminService = new AdminService();
