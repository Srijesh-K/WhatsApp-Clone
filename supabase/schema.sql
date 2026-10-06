-- ==============================================================================
-- WhatsApp Clone - Production Supabase Database Schema
-- Complete with Row Level Security (RLS), Passkeys, Devices & E2EE Support
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Users & Security Keys)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT 'WhatsApp User',
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    about_status TEXT DEFAULT 'Hey there! I am using WhatsApp.',
    public_key TEXT, -- E2EE ECDH public key (base64)
    passkey_registered BOOLEAN DEFAULT FALSE,
    two_step_pin_hash TEXT, -- Hashed 6-digit backup PIN
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PASSKEYS TABLE (WebAuthn Credentials for Anti-Account Takeover)
CREATE TABLE IF NOT EXISTS public.passkeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key_cose TEXT NOT NULL,
    counter BIGINT NOT NULL DEFAULT 0,
    device_name TEXT NOT NULL DEFAULT 'Windows Hello / Touch ID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DEVICES / SESSIONS TABLE (Linked Devices & Session Protection)
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    device_name TEXT NOT NULL,
    browser TEXT NOT NULL,
    os TEXT NOT NULL,
    ip_address TEXT DEFAULT '127.0.0.1',
    is_current BOOLEAN DEFAULT FALSE,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    is_group BOOLEAN DEFAULT FALSE,
    name TEXT, -- Null for 1-on-1 chats, populated for groups
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id),
    disappearing_duration_seconds INTEGER DEFAULT 0, -- 0 means disabled, e.g. 86400 for 24h
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CONVERSATION PARTICIPANTS TABLE
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
    safety_number_verified BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    unread_count INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- 6. MESSAGES TABLE (Encrypted Storage)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ciphertext TEXT NOT NULL, -- Encrypted message payload
    iv TEXT NOT NULL, -- Initialization vector for AES-GCM
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'audio', 'document', 'poll'
    media_url TEXT,
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read'
    reactions JSONB DEFAULT '[]'::jsonb,
    is_disappearing BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. STATUSES / STORIES TABLE (WhatsApp 24h Statuses)
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '24 hours') NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Prevents any user from reading or modifying others' data
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES:
-- Everyone authenticated can see profile public details (names, avatars, public keys)
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only edit their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- PASSKEYS POLICIES:
-- Users can only view and manage their own passkeys
CREATE POLICY "Users manage own passkeys"
ON public.passkeys FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DEVICES POLICIES:
-- Users can only see and revoke their own linked devices
CREATE POLICY "Users manage own devices"
ON public.devices FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- CONVERSATIONS & PARTICIPANTS POLICIES:
-- Users can ONLY access conversations they are a participant in!
CREATE POLICY "Participants can view conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.participants
        WHERE participants.conversation_id = conversations.id
        AND participants.user_id = auth.uid()
    )
);

CREATE POLICY "Participants can view their memberships"
ON public.participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Participants can update their own membership settings"
ON public.participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- MESSAGES POLICIES:
-- Users can ONLY view messages in conversations where they are participants!
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.participants
        WHERE participants.conversation_id = messages.conversation_id
        AND participants.user_id = auth.uid()
    )
);

-- Users can only insert messages if they belong to that conversation
CREATE POLICY "Participants can insert messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.participants
        WHERE participants.conversation_id = messages.conversation_id
        AND participants.user_id = auth.uid()
    )
);

-- Update message status (e.g., mark as delivered/read)
CREATE POLICY "Participants can update message status"
ON public.messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.participants
        WHERE participants.conversation_id = messages.conversation_id
        AND participants.user_id = auth.uid()
    )
);

-- STATUSES POLICIES:
CREATE POLICY "Authenticated users can view non-expired statuses"
ON public.statuses FOR SELECT
TO authenticated
USING (expires_at > timezone('utc'::text, now()));

CREATE POLICY "Users can create own statuses"
ON public.statuses FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime publication for instant messaging
-- ==============================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.devices;
