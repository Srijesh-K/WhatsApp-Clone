import React, { useState, useEffect } from 'react';
import { X, Database, Key, Copy, Check, ExternalLink, ShieldCheck, Moon, Sun, Settings } from 'lucide-react';
import { supabaseData } from '../services/supabase';
import { mojoAuth } from '../services/mojoauth';

interface SettingsModalProps {
  onClose: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  isDark,
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'mojoauth' | 'sql'>('supabase');

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseSaved, setSupabaseSaved] = useState(false);

  // MojoAuth states
  const [mojoApiKey, setMojoApiKey] = useState('');
  const [mojoSaved, setMojoSaved] = useState(false);

  // SQL Copy state
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    const cfg = supabaseData.getSupabaseConfig();
    setSupabaseUrl(cfg.url);
    setSupabaseAnonKey(cfg.anonKey);
    setMojoApiKey(mojoAuth.getApiKey());
  }, []);

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseData.setSupabaseConfig(supabaseUrl, supabaseAnonKey);
    setSupabaseSaved(true);
    setTimeout(() => setSupabaseSaved(false), 2500);
  };

  const handleSaveMojoAuth = (e: React.FormEvent) => {
    e.preventDefault();
    mojoAuth.setApiKey(mojoApiKey);
    setMojoSaved(true);
    setTimeout(() => setMojoSaved(false), 2500);
  };

  const handleCopySql = () => {
    const sqlSchema = `-- Run this in your Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'WhatsApp User',
  avatar_url TEXT,
  about_status TEXT DEFAULT 'Hey there! I am using WhatsApp.',
  public_key TEXT,
  passkey_registered BOOLEAN DEFAULT FALSE,
  two_step_pin_hash TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.passkeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id TEXT UNIQUE NOT NULL,
  public_key_cose TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT NOT NULL DEFAULT 'Passkey Authenticator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_group BOOLEAN DEFAULT FALSE,
  name TEXT,
  avatar_url TEXT,
  disappearing_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ciphertext TEXT NOT NULL,
  iv TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text',
  status TEXT NOT NULL DEFAULT 'sent',
  reactions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read chats they belong to"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.participants WHERE participants.conversation_id = messages.conversation_id AND participants.user_id = auth.uid()));
`;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#111b21] border border-[#222e35] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#202c33] border-b border-[#222e35] text-[#e9edef]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#00a884]/20 flex items-center justify-center text-[#00a884]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#e9edef]">Settings</h2>
              <p className="text-xs text-[#8696a0]">Backend connection and authentication settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#00a884]" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#374248] text-[#aebac1] hover:text-[#e9edef] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#222e35] bg-[#202c33]/50 px-6 text-xs">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-4 font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'supabase'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase</span>
          </button>
          <button
            onClick={() => setActiveTab('mojoauth')}
            className={`py-3 px-4 font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'mojoauth'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>MojoAuth</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 font-medium flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-[#00a884] text-[#00a884]'
                : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Database SQL</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-[#e9edef]">
          {/* TAB 1: SUPABASE */}
          {activeTab === 'supabase' && (
            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div className="p-4 bg-[#202c33] rounded-xl border border-[#2a3942] space-y-1">
                <div className="text-xs font-semibold text-[#e9edef] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#00a884]" />
                  <span>Supabase Realtime Database</span>
                </div>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Connect your live Supabase backend to enable multi-device synchronization, online status tracking, and encrypted message delivery.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                  Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#202c33] border border-[#2a3942] text-[#e9edef] rounded-lg text-sm focus:outline-hidden focus:border-[#00a884] placeholder:text-[#8696a0]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                  Anon / Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#202c33] border border-[#2a3942] text-[#e9edef] rounded-lg text-sm focus:outline-hidden focus:border-[#00a884] placeholder:text-[#8696a0]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#00a884] hover:underline flex items-center space-x-1"
                >
                  <span>Open Supabase Dashboard</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#00a884] hover:bg-[#008f6f] text-white font-medium text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {supabaseSaved ? 'Saved!' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MOJOAUTH */}
          {activeTab === 'mojoauth' && (
            <form onSubmit={handleSaveMojoAuth} className="space-y-4">
              <div className="p-4 bg-[#202c33] rounded-xl border border-[#2a3942] space-y-1">
                <div className="text-xs font-semibold text-[#e9edef] flex items-center space-x-2">
                  <Key className="w-4 h-4 text-[#00a884]" />
                  <span>MojoAuth Passwordless Login</span>
                </div>
                <p className="text-xs text-[#8696a0] leading-relaxed">
                  Enter your MojoAuth API key to enable passwordless magic link & OTP authentication directly to user email or phone.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8696a0] mb-1.5">
                  MojoAuth API Key
                </label>
                <input
                  type="password"
                  placeholder="mojo_api_key_..."
                  value={mojoApiKey}
                  onChange={(e) => setMojoApiKey(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#202c33] border border-[#2a3942] text-[#e9edef] rounded-lg text-sm focus:outline-hidden focus:border-[#00a884] placeholder:text-[#8696a0]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://mojoauth.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#00a884] hover:underline flex items-center space-x-1"
                >
                  <span>Get MojoAuth Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#00a884] hover:bg-[#008f6f] text-white font-medium text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  {mojoSaved ? 'Saved!' : 'Save changes'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#8696a0]">
                  Run this SQL in Supabase SQL Editor to set up required tables and security policies:
                </p>
                <button
                  onClick={handleCopySql}
                  className="py-1.5 px-3 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] border border-[#2a3942] text-xs font-medium rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-[#0c1317] text-[#8696a0] font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 leading-relaxed border border-[#222e35]">
                {`-- Supabase Schema & Row-Level Security
CREATE TABLE public.profiles (...);
CREATE TABLE public.passkeys (...);
CREATE TABLE public.conversations (...);
CREATE TABLE public.participants (...);
CREATE TABLE public.messages (...);

-- RLS Enforcement
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only read chats they belong to"
ON public.messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.participants WHERE participants.conversation_id = messages.conversation_id AND participants.user_id = auth.uid()));`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#202c33] border-t border-[#222e35] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
