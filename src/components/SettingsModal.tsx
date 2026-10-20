import React, { useState, useEffect } from 'react';
import { X, Database, Key, Copy, Check, ExternalLink, ShieldCheck, Moon, Sun, Cpu } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d1418] border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh] cyber-grid-dark">
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0f12] border-b border-cyan-500/20 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold tracking-wider text-slate-100 font-mono">
                  CLOUD_GATEWAY // CONFIG
                </h2>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  POSTGRES_RLS
                </span>
              </div>
              <p className="text-[10px] font-mono text-cyan-400/60 mt-0.5">
                REALTIME REPLICATION • APIS • DDL SCHEMA
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors text-slate-400 hover:text-white"
              title="Toggle Cyber HUD theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyan-500/20 bg-[#090d10] px-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`py-3 px-4 uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'supabase'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>[SUPABASE]</span>
          </button>
          <button
            onClick={() => setActiveTab('mojoauth')}
            className={`py-3 px-4 uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'mojoauth'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4 text-emerald-400" />
            <span>[MOJOAUTH]</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'sql'
                ? 'border-purple-400 text-purple-300 bg-purple-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Copy className="w-4 h-4 text-purple-400" />
            <span>[DDL SCHEMA]</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-300 font-sans">
          {/* TAB 1: SUPABASE */}
          {activeTab === 'supabase' && (
            <form onSubmit={handleSaveSupabase} className="space-y-4">
              <div className="p-4 bg-[#0a1014] rounded-xl border border-cyan-500/20 space-y-1">
                <div className="text-xs font-mono font-bold text-slate-100 flex items-center space-x-2 uppercase">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>SUPABASE REALTIME SYNCHRONIZATION</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Configures PostgreSQL WebSocket replication with Row-Level Security (RLS). Automatically synchronizes ciphertext packets, contacts, and public key registries.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  PROJECT_ENDPOINT_URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-id.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a0f12] border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  ANON_PUBLIC_KEY
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a0f12] border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  <span>SUPABASE_DASHBOARD</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-950/40 transition-all"
                >
                  {supabaseSaved ? 'CONFIG_COMMITTED!' : 'COMMIT_CONFIG'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MOJOAUTH */}
          {activeTab === 'mojoauth' && (
            <form onSubmit={handleSaveMojoAuth} className="space-y-4">
              <div className="p-4 bg-[#0a1014] rounded-xl border border-emerald-500/20 space-y-1">
                <div className="text-xs font-mono font-bold text-slate-100 flex items-center space-x-2 uppercase">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>MOJOAUTH PASSWORDLESS DISPATCH</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Direct integration with MojoAuth identity dispatch. Delivers cryptographic one-time authentication codes to user email/SMS out-of-band.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  MOJOAUTH_API_KEY
                </label>
                <input
                  type="password"
                  placeholder="mojo_api_key_..."
                  value={mojoApiKey}
                  onChange={(e) => setMojoApiKey(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[#0a0f12] border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-mono focus:outline-hidden focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href="https://mojoauth.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <span>MOJOAUTH_CONSOLE</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-900 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all"
                >
                  {mojoSaved ? 'API_KEY_COMMITTED!' : 'RATIFY_API_KEY'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-slate-400">
                  Postgres DDL statements with Row-Level Security definitions:
                </p>
                <button
                  onClick={handleCopySql}
                  className="py-1.5 px-3 bg-[#111a20] hover:bg-[#16232b] text-cyan-300 border border-cyan-500/30 font-mono text-xs rounded-lg flex items-center space-x-1.5 transition-colors"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'BUFFER_COPIED' : 'COPY_DDL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-[#070b0e] text-cyan-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-64 leading-relaxed border border-cyan-500/20">
                {`-- Supabase Cryptographic Schema & RLS
CREATE TABLE public.profiles (...);
CREATE TABLE public.passkeys (...);
CREATE TABLE public.devices (...);
CREATE TABLE public.conversations (...);
CREATE TABLE public.participants (...);
CREATE TABLE public.messages (...);

-- RLS Enforcement
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "E2EE Isolation" ON public.messages FOR SELECT
USING (participants.user_id = auth.uid());`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0a0f12] border-t border-cyan-500/20 flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span>NODE_TELEMETRY: ONLINE</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg uppercase tracking-wider transition-colors font-mono"
          >
            CLOSE_PANEL [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};

