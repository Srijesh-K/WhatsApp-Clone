import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Users,
  MessageSquare,
  Database,
  Trash2,
  Edit,
  Plus,
  Search,
  Download,
  Upload,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  Check,
  X,
  Server,
  HardDrive,
  AlertCircle,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import {
  adminService,
  type SystemMetrics,
  type EnrichedConversation,
  type EnrichedMessage,
} from '../services/admin';
import { supabaseData, type UserProfile } from '../services/supabase';

interface AdminPanelProps {
  isOpen?: boolean;
  isStandalonePage?: boolean;
  onClose: () => void;
  onSwitchUser?: (user: UserProfile) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen = true,
  isStandalonePage = false,
  onClose,
  onSwitchUser,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => adminService.isAuthenticated());
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'conversations' | 'messages' | 'supabase' | 'settings'>('overview');

  // Metrics
  const [metrics, setMetrics] = useState<SystemMetrics>(() => adminService.getMetrics());

  // Data
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<UserProfile | null>(null);

  // User Create / Edit Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    id: '',
    fullName: '',
    phoneNumber: '',
    aboutStatus: '',
    avatarUrl: '',
  });

  // Access Key Change State
  const [currentKeyVerify, setCurrentKeyVerify] = useState('');
  const [newKeyInput, setNewKeyInput] = useState('');
  const [confirmKeyInput, setConfirmKeyInput] = useState('');
  const [keyChangeSuccess, setKeyChangeSuccess] = useState(false);
  const [keyChangeError, setKeyChangeError] = useState<string | null>(null);

  // Supabase Explorer State
  const [selectedTable, setSelectedTable] = useState('profiles');
  const [tableData, setTableData] = useState<any[] | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [isQueryingTable, setIsQueryingTable] = useState(false);

  // Notification Banner
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showBanner = (text: string, type: 'success' | 'error' = 'success') => {
    setBannerMsg({ text, type });
    setTimeout(() => setBannerMsg(null), 3000);
  };

  // Lockout countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isLockedOut && lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimer]);

  // Load data when authenticated
  const refreshData = () => {
    setMetrics(adminService.getMetrics());
    setUsers(adminService.getAllUsers());
    setConversations(adminService.getAllConversations());
    setMessages(adminService.getAllMessages());
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setMetrics(adminService.getMetrics());
      setUsers(adminService.getAllUsers());
      setConversations(adminService.getAllConversations());
      setMessages(adminService.getAllMessages());
    }
  }, [isOpen, isAuthenticated]);

  // Filtered views (unconditionally declared at top level)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.phoneNumber.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.ownerUserName.toLowerCase().includes(q) ||
        (c.phoneNumber && c.phoneNumber.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(
      (m) =>
        m.text.toLowerCase().includes(q) ||
        m.ownerUserName.toLowerCase().includes(q) ||
        m.conversationName.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  // Handle Login with Access Key
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    if (adminService.login(accessKeyInput)) {
      setIsAuthenticated(true);
      setAuthError(null);
      setAccessKeyInput('');
      setFailedAttempts(0);
      refreshData();
      showBanner('Master System Access Granted');
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      if (attempts >= 5) {
        setIsLockedOut(true);
        setLockoutTimer(30);
        setAuthError('Too many failed attempts. Security lockout active for 30s.');
      } else {
        setAuthError(`Invalid Access Key. (${5 - attempts} attempts remaining)`);
      }
    }
  };

  // Handle Logout / Lock Admin
  const handleLockAdmin = () => {
    adminService.logout();
    setIsAuthenticated(false);
    setAccessKeyInput('');
    setSelectedUserForDetail(null);
  };

  // Switch / Impersonate User
  const handleSwitchUser = (user: UserProfile) => {
    supabaseData.setCurrentUser(user);
    if (onSwitchUser) {
      onSwitchUser(user);
    }
    showBanner(`Switched active session to: ${user.fullName}`);
    onClose();
  };

  // Delete User
  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${name}" and all their chats/messages?`)) {
      adminService.deleteUser(userId);
      refreshData();
      if (selectedUserForDetail?.id === userId) {
        setSelectedUserForDetail(null);
      }
      showBanner(`User ${name} deleted successfully`);
    }
  };

  // Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.fullName.trim() || !userFormData.phoneNumber.trim()) {
      showBanner('Full name and Phone/Email are required', 'error');
      return;
    }

    const created = adminService.createUser({
      fullName: userFormData.fullName,
      phoneNumber: userFormData.phoneNumber,
      aboutStatus: userFormData.aboutStatus,
      avatarUrl: userFormData.avatarUrl || undefined,
    });

    setShowCreateUserModal(false);
    setUserFormData({ id: '', fullName: '', phoneNumber: '', aboutStatus: '', avatarUrl: '' });
    refreshData();
    showBanner(`User created: ${created.fullName}`);
  };

  // Update User
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.id) return;

    adminService.updateUser(userFormData.id, {
      fullName: userFormData.fullName,
      phoneNumber: userFormData.phoneNumber,
      aboutStatus: userFormData.aboutStatus,
      avatarUrl: userFormData.avatarUrl || undefined,
    });

    setShowEditUserModal(false);
    refreshData();
    if (selectedUserForDetail && selectedUserForDetail.id === userFormData.id) {
      setSelectedUserForDetail(adminService.getUserById(userFormData.id));
    }
    showBanner('User profile updated successfully');
  };

  // Reset User PIN/Security
  const handleResetSecurity = (phone: string, name: string) => {
    if (window.confirm(`Reset 2-Step PIN and passkeys for "${name}"?`)) {
      adminService.resetUserSecurity(phone);
      refreshData();
      showBanner(`Security credentials reset for ${name}`);
    }
  };

  // Delete Conversation
  const handleDeleteConversation = (ownerUserId: string, conversationId: string, name: string) => {
    if (window.confirm(`Delete conversation "${name}"? All its messages will be wiped.`)) {
      adminService.deleteConversation(ownerUserId, conversationId);
      refreshData();
      showBanner('Conversation removed');
    }
  };

  // Delete Message
  const handleDeleteMessage = (ownerUserId: string, conversationId: string, messageId: string) => {
    if (window.confirm('Delete this message permanently?')) {
      adminService.deleteMessage(ownerUserId, conversationId, messageId);
      refreshData();
      showBanner('Message deleted');
    }
  };

  // Change Access Key
  const handleChangeAccessKey = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyChangeError(null);
    setKeyChangeSuccess(false);

    if (!adminService.verifyAccessKey(currentKeyVerify)) {
      setKeyChangeError('Current access key is incorrect.');
      return;
    }

    if (newKeyInput.length < 4) {
      setKeyChangeError('New access key must be at least 4 characters.');
      return;
    }

    if (newKeyInput !== confirmKeyInput) {
      setKeyChangeError('New access keys do not match.');
      return;
    }

    try {
      adminService.setAccessKey(newKeyInput);
      setKeyChangeSuccess(true);
      setCurrentKeyVerify('');
      setNewKeyInput('');
      setConfirmKeyInput('');
      setMetrics(adminService.getMetrics());
      showBanner('Master System Access Key updated successfully');
    } catch (err: any) {
      setKeyChangeError(err.message || 'Failed to update access key.');
    }
  };

  // Export Database
  const handleExportDatabase = () => {
    const jsonStr = adminService.exportDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showBanner('Full system backup exported');
  };

  // Import Database
  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = adminService.importDatabase(content);
      if (res.success) {
        refreshData();
        showBanner(res.message);
      } else {
        showBanner(res.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Wipe System
  const handleWipeSystem = () => {
    const confirmText = prompt('WARNING: This will wipe all users, messages, and chats! Type "WIPE ALL DATA" to proceed:');
    if (confirmText === 'WIPE ALL DATA') {
      adminService.resetAllData();
      refreshData();
      showBanner('System reset completed');
    }
  };

  // Query Supabase Table
  const handleQueryTable = async (table: string) => {
    setSelectedTable(table);
    setIsQueryingTable(true);
    setTableError(null);
    setTableData(null);

    const res = await adminService.fetchSupabaseTable(table);
    setIsQueryingTable(false);
    if (res.error) {
      setTableError(res.error);
    } else {
      setTableData(res.data);
    }
  };

  if (!isOpen) return null;

  // ============================================================================
  // RENDER 1: ACCESS KEY GATEKEEPER SCREEN (IF NOT AUTHENTICATED)
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div
        className={
          isStandalonePage
            ? 'w-screen h-screen min-h-screen flex items-center justify-center bg-[#0b141a] p-4 select-none animate-in fade-in duration-200'
            : 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200'
        }
      >
        <div className="w-full max-w-md bg-[#111b21] border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
          {/* Top Shield Header */}
          <div className="bg-gradient-to-r from-[#008069] to-[#00a884] p-6 text-center relative flex flex-col items-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Return to WhatsApp"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center mb-3 ring-4 ring-white/10 shadow-inner">
              <ShieldAlert className="w-9 h-9 text-emerald-200" />
            </div>
            <h2 className="text-xl font-bold tracking-wide">Master Admin Console</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Restricted Access • System Key Required
            </p>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter your <span className="text-emerald-400 font-semibold">Master System Access Key</span> to unlock the complete user registry, conversations, messages, and database metrics.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <div className="flex-1">{authError}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  System Access Key
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 text-emerald-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showAccessKey ? 'text' : 'password'}
                    placeholder="Enter Master Access Key..."
                    value={accessKeyInput}
                    onChange={(e) => setAccessKeyInput(e.target.value)}
                    disabled={isLockedOut}
                    className="w-full pl-9 pr-10 py-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-sm font-mono text-white placeholder-gray-500 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessKey(!showAccessKey)}
                    className="absolute right-3 text-gray-400 hover:text-white"
                  >
                    {showAccessKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Go to WhatsApp</span>
                </button>
                <button
                  type="submit"
                  disabled={!accessKeyInput.trim() || isLockedOut}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#008069] to-[#00a884] hover:from-[#00705a] hover:to-[#009272] disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isLockedOut ? `Locked (${lockoutTimer}s)` : 'Verify & Enter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER 2: AUTHENTICATED SYSTEM MASTER ADMIN CONSOLE
  // ============================================================================
  return (
    <div
      className={
        isStandalonePage
          ? 'w-screen h-screen min-h-screen flex flex-col bg-[#0b141a] text-gray-200 overflow-hidden select-none animate-in fade-in duration-200'
          : 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in duration-200'
      }
    >
      <div
        className={
          isStandalonePage
            ? 'w-full h-full flex flex-col overflow-hidden text-gray-200'
            : 'w-full max-w-6xl h-[94vh] bg-[#111b21] border border-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-200'
        }
      >
        {/* Banner Alert */}
        {bannerMsg && (
          <div
            className={`px-4 py-2 text-xs font-semibold flex items-center justify-between transition-all ${
              bannerMsg.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4" />
              <span>{bannerMsg.text}</span>
            </div>
            <button onClick={() => setBannerMsg(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="h-16 px-4 sm:px-6 bg-[#202c33] border-b border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#008069] to-[#00a884] flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base sm:text-lg text-white tracking-tight">
                  System Admin Console
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-semibold">
                  ROOT KEY ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block">
                Complete User Registry, Conversations, Encrypted Storage & Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Refresh */}
            <button
              onClick={refreshData}
              className="p-2 rounded-xl bg-[#111b21] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/60 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Lock Admin */}
            <button
              onClick={handleLockAdmin}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Lock Admin Session"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Console</span>
            </button>

            {/* Return to WhatsApp */}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-[#111b21] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/60 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Return to WhatsApp"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go to WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="px-4 sm:px-6 bg-[#182229] border-b border-gray-800 flex items-center justify-between overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-2 py-2">
            {[
              { id: 'overview', label: 'Overview', icon: HardDrive, count: null },
              { id: 'users', label: 'Whole Users', icon: Users, count: users.length },
              { id: 'conversations', label: 'All Chats', icon: MessageSquare, count: conversations.length },
              { id: 'messages', label: 'All Messages', icon: FileText, count: messages.length },
              { id: 'supabase', label: 'Supabase Cloud', icon: Server, count: null },
              { id: 'settings', label: 'Key & Backups', icon: KeyRound, count: null },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSelectedUserForDetail(null);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#00a884] text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-[#202c33]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search for applicable tabs */}
          {['users', 'conversations', 'messages'].includes(activeTab) && (
            <div className="relative hidden md:flex items-center w-64 ml-4">
              <Search className="w-3.5 h-3.5 absolute left-3 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-[#202c33] border border-gray-700/60 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-[#00a884]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b141a]">
          {/* ============================================================ */}
          {/* TAB 1: OVERVIEW METRICS */}
          {/* ============================================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#111b21] border border-gray-800 rounded-2xl flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-medium">Registered Users</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{metrics.totalUsers}</div>
                  <div className="text-[11px] text-gray-500">Accounts in registry</div>
                </div>

                <div className="p-4 bg-[#111b21] border border-gray-800 rounded-2xl flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-medium">Active Chats</span>
                    <MessageSquare className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{metrics.totalConversations}</div>
                  <div className="text-[11px] text-gray-500">Across all user stores</div>
                </div>

                <div className="p-4 bg-[#111b21] border border-gray-800 rounded-2xl flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-medium">Total Messages</span>
                    <FileText className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{metrics.totalMessages}</div>
                  <div className="text-[11px] text-gray-500">E2EE encrypted payloads</div>
                </div>

                <div className="p-4 bg-[#111b21] border border-gray-800 rounded-2xl flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-medium">Storage Usage</span>
                    <HardDrive className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{metrics.storageUsageKb} KB</div>
                  <div className="text-[11px] text-gray-500">Local database footprint</div>
                </div>
              </div>

              {/* Status and Health Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Security Engine Card */}
                <div className="p-5 bg-[#111b21] border border-gray-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Security & Cryptography Engine</span>
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-semibold">
                      OPERATIONAL
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                      <span className="text-gray-400">Master Access Key</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {metrics.accessKeySet ? 'Custom Key Set' : 'Active System Key'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                      <span className="text-gray-400">Encryption Standard</span>
                      <span className="text-gray-200 font-medium">AES-GCM 256-bit + ECDH P-256</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                      <span className="text-gray-400">WebAuthn Passkeys</span>
                      <span className="text-gray-200 font-medium">FIDO2 / Platform Authenticator</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-gray-400">Linked Devices Protection</span>
                      <span className="text-gray-200 font-medium">{metrics.totalLinkedDevices} sessions tracked</span>
                    </div>
                  </div>
                </div>

                {/* Cloud Backend Card */}
                <div className="p-5 bg-[#111b21] border border-gray-800 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <Server className="w-4 h-4 text-sky-400" />
                      <span>Supabase Cloud Integration</span>
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        metrics.supabaseConnected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {metrics.supabaseConnected ? 'CONNECTED' : 'LOCAL STANDALONE'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                      <span className="text-gray-400">Database Sync</span>
                      <span className="text-gray-200">
                        {metrics.supabaseConnected ? 'Live Supabase Realtime' : 'Local Browser Engine (Active)'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                      <span className="text-gray-400">Tables Defined</span>
                      <span className="text-gray-200">profiles, conversations, messages, passkeys</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-b border-gray-800/80">
                      <span className="text-gray-400">Admin Privileges</span>
                      <span className="text-emerald-400 font-semibold">Full Inspection & Impersonation</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-gray-400">Last Admin Login</span>
                      <span className="text-gray-400 font-mono">
                        {adminService.getLastLogin()
                          ? new Date(adminService.getLastLogin()!).toLocaleTimeString()
                          : 'This session'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="p-5 bg-[#111b21] border border-gray-800 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-white">Admin Quick Actions</h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => {
                      setUserFormData({ id: '', fullName: '', phoneNumber: '', aboutStatus: '', avatarUrl: '' });
                      setShowCreateUserModal(true);
                    }}
                    className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create User Directly</span>
                  </button>
                  <button
                    onClick={handleExportDatabase}
                    className="px-4 py-2 bg-[#202c33] hover:bg-gray-800 text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-gray-700/60 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Export Full System Backup</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-4 py-2 bg-[#202c33] hover:bg-gray-800 text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-gray-700/60 transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Change Access Key</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2 bg-[#202c33] hover:bg-gray-800 text-gray-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-gray-700/60 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Inspect Whole Users ({users.length})</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: WHOLE USERS DIRECTORY ("See Whole Users") */}
          {/* ============================================================ */}
          {activeTab === 'users' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              {/* Header with actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Users className="w-4 h-4 text-[#00a884]" />
                    <span>Registered User Accounts ({filteredUsers.length})</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Inspect all accounts, view stats, impersonate user session, or edit profile
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setUserFormData({ id: '', fullName: '', phoneNumber: '', aboutStatus: '', avatarUrl: '' });
                      setShowCreateUserModal(true);
                    }}
                    className="px-3.5 py-2 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New User</span>
                  </button>
                </div>
              </div>

              {/* Users Grid / List */}
              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center bg-[#111b21] rounded-2xl border border-gray-800 space-y-3">
                  <Users className="w-10 h-10 text-gray-600 mx-auto" />
                  <div className="text-sm font-semibold text-gray-300">No users found</div>
                  <p className="text-xs text-gray-500">
                    {searchQuery ? 'Try clearing your search query.' : 'Create your first user or register via the app login page.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((user) => {
                    const stats = adminService.getUserStats(user.id);
                    const isCurrentActive = supabaseData.getCurrentUser()?.id === user.id;

                    return (
                      <div
                        key={user.id}
                        className={`p-4 bg-[#111b21] border rounded-2xl transition-all flex flex-col justify-between space-y-4 relative ${
                          isCurrentActive
                            ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/20'
                            : 'border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        {isCurrentActive && (
                          <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-semibold">
                            ACTIVE APP SESSION
                          </div>
                        )}

                        {/* User Identity */}
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <img
                              src={user.avatarUrl}
                              alt={user.fullName}
                              className="w-12 h-12 rounded-full object-cover border border-gray-700 bg-gray-800"
                            />
                            <div
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-[#111b21] ${
                                user.isOnline ? 'bg-emerald-500' : 'bg-gray-500'
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0 pr-12">
                            <h4 className="text-sm font-bold text-white truncate">{user.fullName}</h4>
                            <div className="text-xs font-mono text-emerald-400 truncate">
                              {user.phoneNumber}
                            </div>
                            <div className="text-[11px] text-gray-400 truncate mt-0.5">
                              {user.aboutStatus || 'Hey there! I am using WhatsApp.'}
                            </div>
                          </div>
                        </div>

                        {/* Stats & Badges */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#202c33]/50 rounded-xl text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 block">Conversations</span>
                            <span className="font-semibold text-white">{stats.conversationCount}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block">Messages</span>
                            <span className="font-semibold text-white">{stats.messageCount}</span>
                          </div>
                        </div>

                        {/* Security Metadata Badges */}
                        <div className="flex flex-wrap gap-1.5 text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono ${
                              user.passkeyRegistered
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-gray-800 text-gray-400'
                            }`}
                          >
                            Passkey: {user.passkeyRegistered ? 'Yes' : 'No'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md font-mono bg-gray-800 text-gray-400">
                            ID: {user.id.substring(0, 8)}...
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-1">
                          {/* Impersonate / Switch */}
                          <button
                            onClick={() => handleSwitchUser(user)}
                            className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors border border-emerald-500/30"
                            title="Log in to WhatsApp as this user"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Switch</span>
                          </button>

                          <div className="flex items-center space-x-1">
                            {/* Edit */}
                            <button
                              onClick={() => {
                                setUserFormData({
                                  id: user.id,
                                  fullName: user.fullName,
                                  phoneNumber: user.phoneNumber,
                                  aboutStatus: user.aboutStatus,
                                  avatarUrl: user.avatarUrl,
                                });
                                setShowEditUserModal(true);
                              }}
                              className="p-1.5 bg-[#202c33] hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                              title="Edit user profile"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset Security */}
                            <button
                              onClick={() => handleResetSecurity(user.phoneNumber, user.fullName)}
                              className="p-1.5 bg-[#202c33] hover:bg-amber-950/40 text-amber-400 rounded-lg transition-colors"
                              title="Reset 2-step PIN / Passkeys"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.fullName)}
                              className="p-1.5 bg-[#202c33] hover:bg-red-950/40 text-red-400 rounded-lg transition-colors"
                              title="Delete user account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: ALL CONVERSATIONS */}
          {/* ============================================================ */}
          {activeTab === 'conversations' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  <span>All System Conversations ({filteredConversations.length})</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Inspect conversations across all accounts, view message counts, and disappearing timers
                </p>
              </div>

              {filteredConversations.length === 0 ? (
                <div className="p-12 text-center bg-[#111b21] rounded-2xl border border-gray-800 space-y-2">
                  <MessageSquare className="w-10 h-10 text-gray-600 mx-auto" />
                  <div className="text-sm font-semibold text-gray-300">No conversations recorded yet</div>
                  <p className="text-xs text-gray-500">Conversations will populate when users start chatting.</p>
                </div>
              ) : (
                <div className="bg-[#111b21] border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-[#202c33] text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-gray-800">
                        <tr>
                          <th className="py-3 px-4">Chat / Contact</th>
                          <th className="py-3 px-4">Owner Account</th>
                          <th className="py-3 px-4">Identifier</th>
                          <th className="py-3 px-4 text-center">Messages</th>
                          <th className="py-3 px-4">Disappearing Mode</th>
                          <th className="py-3 px-4">Last Activity</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80">
                        {filteredConversations.map((conv) => (
                          <tr key={`${conv.ownerUserId}_${conv.id}`} className="hover:bg-[#182229] transition-colors">
                            <td className="py-3 px-4 flex items-center space-x-2.5">
                              <img
                                src={conv.avatarUrl}
                                alt={conv.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-700 bg-gray-800"
                              />
                              <div>
                                <div className="font-semibold text-white">{conv.name}</div>
                                <div className="text-[10px] text-gray-500 font-mono">ID: {conv.id}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-medium text-emerald-400">{conv.ownerUserName}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-400">
                              {conv.phoneNumber || 'Direct Group'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold text-[11px]">
                                {conv.messageCount}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              {conv.disappearingDuration > 0
                                ? `${conv.disappearingDuration / 3600} hours`
                                : 'Disabled'}
                            </td>
                            <td className="py-3 px-4 text-gray-400">
                              {conv.lastMessageTime || 'Recently'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteConversation(conv.ownerUserId, conv.id, conv.name)}
                                className="p-1.5 hover:bg-red-950/40 text-red-400 rounded-lg transition-colors"
                                title="Delete Conversation"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: ALL MESSAGES ("All The Things") */}
          {/* ============================================================ */}
          {activeTab === 'messages' && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Global Message Inspector ({filteredMessages.length})</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Inspect all message records, decrypted payloads, delivery receipts, and timestamps
                </p>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="p-12 text-center bg-[#111b21] rounded-2xl border border-gray-800 space-y-2">
                  <FileText className="w-10 h-10 text-gray-600 mx-auto" />
                  <div className="text-sm font-semibold text-gray-300">No messages recorded yet</div>
                  <p className="text-xs text-gray-500">Sent messages will appear here in realtime.</p>
                </div>
              ) : (
                <div className="bg-[#111b21] border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-[#202c33] text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-gray-800">
                        <tr>
                          <th className="py-3 px-4">Message Text / Content</th>
                          <th className="py-3 px-4">Account Owner</th>
                          <th className="py-3 px-4">Conversation</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4 text-right">Delete</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/80">
                        {filteredMessages.map((msg) => (
                          <tr key={msg.id} className="hover:bg-[#182229] transition-colors">
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-medium text-white truncate">{msg.text}</div>
                              <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-2">
                                <span>ID: {msg.id.substring(0, 10)}...</span>
                                {msg.isEncrypted && (
                                  <span className="text-emerald-400 font-semibold">🔒 E2EE Verified</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-emerald-400 font-medium">
                              {msg.ownerUserName}
                            </td>
                            <td className="py-3 px-4 text-gray-300">
                              {msg.conversationName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-mono text-[10px] uppercase">
                                {msg.messageType}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  msg.status === 'read'
                                    ? 'bg-sky-500/20 text-sky-400'
                                    : msg.status === 'delivered'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-gray-700 text-gray-300'
                                }`}
                              >
                                {msg.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400 font-mono">
                              {msg.timestamp}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteMessage(msg.ownerUserId, msg.conversationId, msg.id)}
                                className="p-1.5 hover:bg-red-950/40 text-red-400 rounded-lg transition-colors"
                                title="Delete Message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: SUPABASE CLOUD LIVE EXPLORER */}
          {/* ============================================================ */}
          {activeTab === 'supabase' && (
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Server className="w-4 h-4 text-sky-400" />
                    <span>Supabase Live Database Explorer</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Direct live table query tool for remote PostgreSQL tables
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      metrics.supabaseConnected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {metrics.supabaseConnected ? 'Supabase Connected' : 'No Remote Credentials'}
                  </span>
                </div>
              </div>

              {/* Table selector buttons */}
              <div className="flex flex-wrap gap-2">
                {['profiles', 'conversations', 'participants', 'messages', 'passkeys', 'devices', 'statuses'].map(
                  (tableName) => (
                    <button
                      key={tableName}
                      onClick={() => handleQueryTable(tableName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all ${
                        selectedTable === tableName
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-[#111b21] text-gray-300 hover:bg-[#202c33] border border-gray-800'
                      }`}
                    >
                      {tableName}
                    </button>
                  )
                )}
              </div>

              {/* Query Result Box */}
              <div className="bg-[#111b21] border border-gray-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-2">
                  <span className="font-mono">SELECT * FROM public.{selectedTable} LIMIT 50;</span>
                  {isQueryingTable && <span className="text-sky-400">Querying database...</span>}
                </div>

                {tableError && (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-xs text-amber-300">
                    <div className="font-semibold">Query Notice:</div>
                    <div>{tableError}</div>
                  </div>
                )}

                {tableData && (
                  <div className="space-y-2">
                    <div className="text-xs text-emerald-400 font-semibold">
                      Returned {tableData.length} records:
                    </div>
                    <pre className="p-3 bg-[#0c1317] rounded-xl text-[11px] font-mono text-gray-300 overflow-x-auto max-h-96">
                      {JSON.stringify(tableData, null, 2)}
                    </pre>
                  </div>
                )}

                {!tableData && !tableError && !isQueryingTable && (
                  <div className="p-8 text-center text-xs text-gray-500">
                    Click a table above to execute query.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: ACCESS KEY & SYSTEM SETTINGS */}
          {/* ============================================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              {/* Change Master Access Key */}
              <div className="p-5 bg-[#111b21] border border-gray-800 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Change Master System Access Key</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Update the secret access key required to open this Admin Console
                  </p>
                </div>

                {keyChangeSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Master Access Key updated successfully! Remember to store your new key safely.</span>
                  </div>
                )}

                {keyChangeError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>{keyChangeError}</span>
                  </div>
                )}

                <form onSubmit={handleChangeAccessKey} className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Current Access Key
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current access key..."
                      value={currentKeyVerify}
                      onChange={(e) => setCurrentKeyVerify(e.target.value)}
                      className="w-full py-2 px-3 bg-[#202c33] border border-gray-700 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      New Access Key
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new master key (min 4 chars)..."
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      className="w-full py-2 px-3 bg-[#202c33] border border-gray-700 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      Confirm New Access Key
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new key..."
                      value={confirmKeyInput}
                      onChange={(e) => setConfirmKeyInput(e.target.value)}
                      className="w-full py-2 px-3 bg-[#202c33] border border-gray-700 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={!currentKeyVerify || !newKeyInput || !confirmKeyInput}
                      className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Update Master Access Key
                    </button>
                  </div>
                </form>
              </div>

              {/* Backup & Restore System */}
              <div className="p-5 bg-[#111b21] border border-gray-800 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center space-x-2">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span>Database Backup & Restore</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Export complete system database to JSON or restore from an existing backup
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportDatabase}
                    className="px-4 py-2.5 bg-[#202c33] hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>Download JSON Backup</span>
                  </button>

                  <label className="px-4 py-2.5 bg-[#202c33] hover:bg-gray-800 text-gray-200 border border-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Restore Backup from File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDatabase}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-5 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Danger Zone: System Factory Reset</span>
                </div>
                <p className="text-xs text-gray-400">
                  Wipes all accounts, conversations, messages, and settings while preserving the Master Access Key.
                </p>
                <div>
                  <button
                    onClick={handleWipeSystem}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Wipe System Database
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: CREATE USER DIRECTLY */}
      {/* ============================================================ */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111b21] border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Create New User Profile</span>
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  Phone Number or Email *
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1 555 123 4567 or john@example.com"
                  value={userFormData.phoneNumber}
                  onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">About Status</label>
                <input
                  type="text"
                  placeholder="Hey there! I am using WhatsApp."
                  value={userFormData.aboutStatus}
                  onChange={(e) => setUserFormData({ ...userFormData, aboutStatus: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">
                  Avatar Image URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={userFormData.avatarUrl}
                  onChange={(e) => setUserFormData({ ...userFormData, avatarUrl: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-3 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl font-semibold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT USER */}
      {/* ============================================================ */}
      {showEditUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111b21] border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center space-x-2">
                <Edit className="w-4 h-4 text-sky-400" />
                <span>Edit User Profile</span>
              </h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={userFormData.fullName}
                  onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Phone Number or Email</label>
                <input
                  type="text"
                  value={userFormData.phoneNumber}
                  onChange={(e) => setUserFormData({ ...userFormData, phoneNumber: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">About Status</label>
                <input
                  type="text"
                  value={userFormData.aboutStatus}
                  onChange={(e) => setUserFormData({ ...userFormData, aboutStatus: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Avatar Image URL</label>
                <input
                  type="text"
                  value={userFormData.avatarUrl}
                  onChange={(e) => setUserFormData({ ...userFormData, avatarUrl: e.target.value })}
                  className="w-full p-2.5 bg-[#202c33] border border-gray-700 rounded-xl text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-3 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
