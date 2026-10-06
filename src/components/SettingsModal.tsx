import React, { useState, useEffect } from 'react';
import { X, Database, Key, Copy, Check, ExternalLink, ShieldCheck, Moon, Sun } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#202c33] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#008069] text-white">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Backend & Cloud Settings</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors text-white"
              title="Toggle Dark / Light Mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#111b21] px-4">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'supabase'
                ? 'border-[#00a884] text-[#00a884] dark:text-[#00a884]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Supabase</span>
          </button>
          <button
            onClick={() => setActiveTab('mojoauth')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'mojoauth'
                ? 'border-[#00a884] text-[#00a884] dark:text-[#00a884]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>MojoAuth</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-[#00a884] text-[#00a884] dark:text-[#00a884]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>SQL Schema</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 dark:text-gray-200">
          {/* TAB 1: SUPABASE */}
          {activeTab === 'supabase' && (
            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div className="p-4 bg-teal-50 dark:bg-[#111b21] rounded-xl border border-teal-100 dark:border-gray-800 space-y-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00a884]" />
                  <span>Supabase Live Sync</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your Supabase Project URL and Anon Public Key below. When configured, your chats, passkeys, and encrypted messages sync directly to Supabase with PostgreSQL Row-Level Security!
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono focus:outline-hidden focus:border-[#00a884]"
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
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl text-sm font-medium shadow-sm transition-all"
                >
                  {supabaseSaved ? 'Saved & Connected!' : 'Save & Sync'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MOJOAUTH */}
          {activeTab === 'mojoauth' && (
            <form onSubmit={handleSaveMojoAuth} className="space-y-4">
              <div className="p-4 bg-teal-50 dark:bg-[#111b21] rounded-xl border border-teal-100 dark:border-gray-800 space-y-1">
                <div className="text-sm font-semibold text-gray-900 dark:text-white flex items-center space-x-1.5">
                  <Key className="w-4 h-4 text-[#00a884]" />
                  <span>MojoAuth Passwordless API</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter your MojoAuth API Key. MojoAuth powers passwordless OTP SMS login. If left empty, the application runs in local sandbox demo mode with instant SMS codes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  MojoAuth API Key
                </label>
                <input
                  type="password"
                  placeholder="mojo_api_key_..."
                  value={mojoApiKey}
                  onChange={(e) => setMojoApiKey(e.target.value)}
                  className="w-full py-2.5 px-3 bg-gray-50 dark:bg-[#111b21] border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono focus:outline-hidden focus:border-[#00a884]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://mojoauth.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#00a884] hover:underline flex items-center space-x-1"
                >
                  <span>Get MojoAuth API Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl text-sm font-medium shadow-sm transition-all"
                >
                  {mojoSaved ? 'Saved API Key!' : 'Save Key'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Execute this SQL in Supabase SQL editor to create all tables and RLS security policies.
                </p>
                <button
                  onClick={handleCopySql}
                  className="py-1.5 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium rounded-lg flex items-center space-x-1 transition-colors text-gray-700 dark:text-gray-300 shrink-0"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL' : 'Copy All SQL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-gray-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 leading-relaxed border border-gray-800">
                {`-- Supabase WhatsApp Database Schema
-- Includes RLS & Realtime publication
-- See supabase/schema.sql for complete file
CREATE TABLE public.profiles (...);
CREATE TABLE public.passkeys (...);
CREATE TABLE public.devices (...);
CREATE TABLE public.conversations (...);
CREATE TABLE public.participants (...);
CREATE TABLE public.messages (...);`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
