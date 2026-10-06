# 🟢 WhatsApp Web (High-Security Architecture with Supabase & MojoAuth)

An authentic, human-crafted WhatsApp Web application built with **React**, **TypeScript**, **Tailwind CSS v4**, **Supabase Realtime PostgreSQL**, **MojoAuth OTP Authentication**, and **FIDO2 / WebAuthn Biometric Passkeys**.

---

## 🔒 Security & Anti-Takeover System

This clone is designed with the exact defense-in-depth security model of WhatsApp:

1. **Passwordless OTP Login via MojoAuth**:
   - Phone number authentication via MojoAuth SMS gateway.
   - Built-in sandbox mode with automatic SMS code assistance for effortless local testing.

2. **WebAuthn Biometric Passkeys (FIDO2)**:
   - Registers device hardware credentials (Windows Hello, Apple Touch ID / Face ID, Android Biometrics, YubiKeys).
   - **Anti-Account Takeover**: Even if a malicious attacker intercepts an SMS code or performs a SIM swap, they **cannot** log into your WhatsApp account without your physical hardware passkey!

3. **Supabase PostgreSQL Row-Level Security (RLS)**:
   - Complete production database schema provided in [`supabase/schema.sql`](file:///c:/Users/SRIJESH/OneDrive/Documents/projects/WhatsApp/supabase/schema.sql).
   - Strict participant-level RLS policies: Users can **never** query or read messages from chats they are not explicit members of.

4. **End-to-End Encryption (E2EE)**:
   - Web Crypto API (`SubtleCrypto`) ECDH P-256 key agreement + AES-GCM (256-bit) message payload encryption.
   - 60-digit Numeric Safety Number verification in 12 blocks of 5 digits, matching WhatsApp's exact QR code security verification screen.

5. **WhatsApp App Lock**:
   - Screen lock requiring biometric passkey or 6-digit backup PIN to unlock.
   - Auto-locks on idle, tab switch, or via manual lock button.

6. **Linked Devices & Session Protection**:
   - Inspect all active sessions (OS, browser, IP address, last active).
   - Remote one-tap logout to terminate unauthorized sessions.

---

## 🚀 Quick Start

### 1. Install & Run Dev Server
```bash
npm install
npm run dev
```

The app will run at `http://localhost:5173`.

### 2. Connect Supabase (Optional)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Paste and run the SQL code from [`supabase/schema.sql`](file:///c:/Users/SRIJESH/OneDrive/Documents/projects/WhatsApp/supabase/schema.sql).
4. Copy your **Project URL** and **Anon Key** into the app's **Settings Modal** (or `.env` file).

### 3. Connect MojoAuth (Optional)
1. Sign up at [MojoAuth](https://mojoauth.com) to get your API Key.
2. Enter your API Key in the app's **Settings Modal** under the **MojoAuth** tab.

---

## 📁 Project Architecture

```
WhatsApp/
├── supabase/
│   └── schema.sql            # Supabase PostgreSQL schema with RLS policies & Realtime
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx             # Phone onboarding, MojoAuth OTP & Passkey checks
│   │   ├── AppLockScreen.tsx         # Biometric / Passkey & PIN screen lock
│   │   ├── Sidebar.tsx               # WhatsApp chat list, search, filter pills & menu
│   │   ├── ChatArea.tsx              # Doodle wallpaper, bubbles, voice note player/recorder
│   │   ├── ContactInfoDrawer.tsx     # Contact info, disappearing messages & media
│   │   ├── SafetyNumberModal.tsx     # 60-digit E2EE code & QR verification
│   │   ├── PasskeySecurityModal.tsx  # Manage WebAuthn passkeys, 2-Step PIN & App Lock
│   │   ├── LinkedDevicesModal.tsx    # Multi-device session manager & remote logout
│   │   ├── StatusStoriesModal.tsx    # 24h stories viewer with timer bars
│   │   ├── CallModal.tsx             # Audio & Video call interface with tones
│   │   ├── NewChatModal.tsx          # Start new encrypted chats
│   │   └── SettingsModal.tsx         # Supabase & MojoAuth credentials manager
│   ├── services/
│   │   ├── security.ts       # WebAuthn passkeys, Web Crypto E2EE & session security
│   │   ├── mojoauth.ts       # MojoAuth OTP API & dev sandbox simulator
│   │   ├── supabase.ts       # Supabase client & persistent offline data store
│   │   └── sound.ts          # Web Audio API synthesizer for WhatsApp audio tones
│   ├── App.tsx               # Main application orchestration & theme management
│   ├── main.tsx              # Application entrypoint
│   └── index.css             # Tailwind v4 & authentic WhatsApp doodle patterns
├── vite.config.ts
├── package.json
└── README.md
```
