import { useState, useEffect } from 'react';
import { supabaseData } from './services/supabase';
import type { Conversation, UserProfile } from './services/supabase';
import { security } from './services/security';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { EmptyChatState } from './components/EmptyChatState';
import { AuthModal } from './components/AuthModal';
import { AppLockScreen } from './components/AppLockScreen';
import { SafetyNumberModal } from './components/SafetyNumberModal';
import { PasskeySecurityModal } from './components/PasskeySecurityModal';
import { LinkedDevicesModal } from './components/LinkedDevicesModal';
import { ContactInfoDrawer } from './components/ContactInfoDrawer';
import { CallModal } from './components/CallModal';
import { StatusStoriesModal } from './components/StatusStoriesModal';
import { SettingsModal } from './components/SettingsModal';
import { NewChatModal } from './components/NewChatModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => supabaseData.getCurrentUser());
  const [conversations, setConversations] = useState<Conversation[]>(() => supabaseData.getConversations());
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const list = supabaseData.getConversations();
    return list.length > 0 ? list[0].id : null;
  });

  // App Lock
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return security.isAppLockEnabled() && security.getLockTimeout() === 'immediately';
  });

  // Theme
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('wa_theme') === 'dark' ||
      (!localStorage.getItem('wa_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Modals state
  const [showNewChat, setShowNewChat] = useState(false);
  const [showStatusStories, setShowStatusStories] = useState(false);
  const [showPasskeys, setShowPasskeys] = useState(false);
  const [showLinkedDevices, setShowLinkedDevices] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSafetyNumber, setShowSafetyNumber] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [callState, setCallState] = useState<{ active: boolean; isVideo: boolean } | null>(null);

  // Apply dark theme class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wa_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wa_theme', 'light');
    }
  }, [isDark]);

  // Subscribe to live data updates
  useEffect(() => {
    const unsubscribe = supabaseData.subscribe(() => {
      setConversations(supabaseData.getConversations());
      setCurrentUser(supabaseData.getCurrentUser());
    });
    return unsubscribe;
  }, []);

  // Idle / Visibility app lock handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && security.isAppLockEnabled() && security.getLockTimeout() === 'immediately') {
        setIsLocked(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Global ESC shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewChat(false);
        setShowStatusStories(false);
        setShowPasskeys(false);
        setShowLinkedDevices(false);
        setShowSettings(false);
        setShowSafetyNumber(false);
        setShowContactInfo(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeChatId);
  const currentMessages = activeChatId ? supabaseData.getMessages(activeChatId) : [];

  // If user is not logged in, show AuthModal
  if (!currentUser) {
    return (
      <AuthModal
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // If App Lock is active, show AppLockScreen
  if (isLocked) {
    return (
      <AppLockScreen
        onUnlock={() => {
          setIsLocked(false);
        }}
      />
    );
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#d1d7db] dark:bg-[#0c1317]">
      {/* WhatsApp Web Container Window */}
      <div className="w-full h-full flex flex-row overflow-hidden bg-white dark:bg-[#111b21] shadow-2xl">
        {/* Left Sidebar */}
        <Sidebar
          currentUser={currentUser}
          conversations={conversations}
          activeChatId={activeChatId}
          onSelectChat={(conv) => {
            setActiveChatId(conv.id);
            setShowContactInfo(false);
          }}
          onOpenNewChat={() => setShowNewChat(true)}
          onOpenStatusStories={() => setShowStatusStories(true)}
          onOpenPasskeys={() => setShowPasskeys(true)}
          onOpenLinkedDevices={() => setShowLinkedDevices(true)}
          onOpenSettings={() => setShowSettings(true)}
          onLockApp={() => setIsLocked(true)}
          onLogout={() => {
            supabaseData.logout();
            setCurrentUser(null);
          }}
        />

        {/* Right Chat Area or Empty Placeholder */}
        {activeConversation ? (
          <div className="flex-1 h-full flex overflow-hidden">
            <ChatArea
              conversation={activeConversation}
              currentUser={currentUser}
              messages={currentMessages}
              onOpenContactInfo={() => setShowContactInfo(!showContactInfo)}
              onOpenSafetyNumber={() => setShowSafetyNumber(true)}
              onStartCall={(isVideo) => setCallState({ active: true, isVideo })}
              onBackMobile={() => setActiveChatId(null)}
            />

            {/* Slide-out Contact Info Drawer */}
            {showContactInfo && (
              <ContactInfoDrawer
                conversation={activeConversation}
                onClose={() => setShowContactInfo(false)}
                onOpenSafetyNumber={() => setShowSafetyNumber(true)}
                onStartCall={(isVideo) => setCallState({ active: true, isVideo })}
              />
            )}
          </div>
        ) : (
          <EmptyChatState />
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODALS */}
      {/* ==================================================================== */}

      {/* 1. New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelectChat={(conv: Conversation) => setActiveChatId(conv.id)}
        />
      )}

      {/* 2. Safety Number E2EE Verification Modal */}
      {showSafetyNumber && activeConversation && (
        <SafetyNumberModal
          conversation={activeConversation}
          userPhone={currentUser.phoneNumber}
          onClose={() => setShowSafetyNumber(false)}
          onToggleVerified={() => {
            supabaseData.toggleSafetyNumberVerified(activeConversation.id);
          }}
        />
      )}

      {/* 3. Passkey & Two-Step PIN Security Modal */}
      {showPasskeys && (
        <PasskeySecurityModal
          user={currentUser}
          onClose={() => setShowPasskeys(false)}
          onLockAppNow={() => setIsLocked(true)}
        />
      )}

      {/* 4. Linked Devices & Active Sessions Modal */}
      {showLinkedDevices && (
        <LinkedDevicesModal onClose={() => setShowLinkedDevices(false)} />
      )}

      {/* 5. Status Stories Viewer Modal */}
      {showStatusStories && (
        <StatusStoriesModal
          statuses={supabaseData.getStatuses()}
          onClose={() => setShowStatusStories(false)}
          onSendReply={(name, text) => {
            if (activeChatId) {
              supabaseData.sendMessage(activeChatId, `[Story reply to ${name}] ${text}`);
            }
          }}
        />
      )}

      {/* 6. Audio/Video Call Screen */}
      {callState && activeConversation && (
        <CallModal
          conversation={activeConversation}
          isVideo={callState.isVideo}
          onEndCall={() => setCallState(null)}
        />
      )}

      {/* 7. Backend Settings & SQL Schema Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
        />
      )}
    </div>
  );
}

export default App;
