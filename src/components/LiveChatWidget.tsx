import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ChatThread, ChatMessage } from '../utils/exchangeLogic';
import {
  getOrCreateGuestChatIdentity,
  sendCustomerChatMessage,
  markChatThreadRead,
} from '../firebase';
import { X, Send, ShieldCheck, Sparkles } from 'lucide-react';

/**
 * Crisp Official Green WhatsApp Logo SVG Icon (Used exclusively to open the In-App Live Chat Messenger —
 * never redirects to an external phone number or wa.me link).
 */
export const OfficialWhatsAppLogoSvg: React.FC<{ className?: string }> = ({
  className = 'w-7 h-7',
}) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M16.002 3.2C8.932 3.2 3.2 8.93 3.2 15.998c0 2.257.589 4.46 1.708 6.402L3.1 28.8l6.564-1.722a12.742 12.742 0 006.338 1.678h.005c7.068 0 12.793-5.73 12.793-12.798 0-3.42-1.331-6.635-3.748-9.053A12.712 12.712 0 0016.002 3.2zm0 23.394h-.004a10.6 10.6 0 01-5.404-1.48l-.388-.23-4.018 1.054 1.072-3.917-.252-.402a10.575 10.575 0 01-1.624-5.621c0-5.853 4.763-10.615 10.622-10.615 2.836 0 5.502 1.105 7.507 3.111a10.548 10.548 0 013.109 7.506c0 5.855-4.763 10.594-10.62 10.594zm5.825-7.937c-.319-.16-1.889-.932-2.182-1.039-.292-.106-.505-.16-.718.16-.213.319-.824 1.038-1.01 1.25-.186.214-.373.24-.692.08-.319-.16-1.347-.496-2.566-1.583-.949-.846-1.589-1.892-1.775-2.211-.186-.32-.02-.492.14-.651.143-.143.319-.373.479-.559.159-.186.212-.319.319-.532.106-.213.053-.399-.027-.559-.08-.16-.718-1.73-.984-2.369-.259-.622-.522-.538-.718-.548l-.612-.01c-.213 0-.558.08-.851.399-.292.32-1.117 1.091-1.117 2.661 0 1.57 1.144 3.087 1.303 3.3.16.213 2.251 3.437 5.453 4.819.762.329 1.356.525 1.82.672.764.243 1.46.209 2.01.127.613-.092 1.889-.772 2.155-1.517.266-.745.266-1.384.186-1.517-.08-.133-.292-.213-.612-.373z"
      fill="currentColor"
    />
  </svg>
);

interface LiveChatWidgetProps {
  currentUser: UserProfile | null;
  chatsMap: Record<string, ChatThread>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_CUSTOMER_PROMPTS = [
  'Hi 👋 Need Help',
  'Create New Exchange ID 🔑',
  'Verify My Deposit UTR ⏫',
  'Fast Withdrawal Help ⏬',
];

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  currentUser,
  chatsMap,
  isOpen,
  onOpenChange,
}) => {
  const [guestIdentity] = useState(() => getOrCreateGuestChatIdentity());
  const [customGuestName, setCustomGuestName] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeUserId = currentUser ? currentUser.uid : guestIdentity.userId;
  const activeUserName = currentUser
    ? currentUser.name
    : customGuestName.trim() || guestIdentity.userName;
  const activeUserEmail = currentUser ? currentUser.email : guestIdentity.userEmail;

  const myThread: ChatThread | undefined = chatsMap[activeUserId];
  const messagesList: ChatMessage[] = myThread?.messages
    ? Object.values(myThread.messages).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [
        {
          id: 'welcome_init',
          sender: 'admin',
          senderName: 'Mohit A1 · Live Support',
          text: 'Namaste! Welcome to SHARK EXCH 24/7 Official In-App Messenger. Send a message below for instant ID creation, deposit verification, or withdrawal support.',
          timestamp: new Date().toISOString(),
        },
      ];

  const unreadCount = myThread?.unreadForCustomer || 0;

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      void markChatThreadRead({ userId: activeUserId, viewer: 'customer' });
    }
  }, [isOpen, unreadCount, activeUserId]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messagesList.length]);

  const handleSend = async (textToSend?: string) => {
    const clean = (textToSend ?? messageInput).trim();
    if (!clean || sending) return;
    setSending(true);
    try {
      await sendCustomerChatMessage({
        userId: activeUserId,
        userName: activeUserName,
        userEmail: activeUserEmail,
        text: clean,
      });
      if (!textToSend) {
        setMessageInput('');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* FLOATING COMPACT WHATSAPP LOGO TRIGGER BUTTON (Opens In-App Live Chat — No External Number) */}
      <div className="fixed bottom-20 md:bottom-6 right-3.5 z-40 flex flex-col items-end">
        {!isOpen && (
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            data-testid="whatsapp-live-chat-trigger"
            aria-label="WhatsApp Live Support"
            title="Live Support"
            className="group relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white shadow-[0_4px_16px_rgba(37,211,102,0.5)] border border-white/80 transition-transform active:scale-95 cursor-pointer"
          >
            <OfficialWhatsAppLogoSvg className="w-6 h-6 text-white drop-shadow-xs" />

            {unreadCount > 0 && (
              <span
                data-testid="customer-chat-unread-badge"
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-white font-mono-tabular font-black text-[10px] border border-white shadow"
              >
                {unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* FACEBOOK MESSENGER / WHATSAPP STYLE IN-APP LIVE CHAT WINDOW */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="In-App Live Chat Support Messenger"
          data-testid="in-app-live-chat-window"
          className="fixed bottom-16 md:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-24px)] sm:w-[390px] h-[510px] max-h-[80vh] rounded-3xl bg-[#0c111d] border-2 border-[#25D366]/60 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden"
        >
          {/* Messenger Header (Zero Phone Numbers Exposed) */}
          <div className="bg-gradient-to-r from-[#075E54] via-[#128C7E] to-[#25D366] px-4 py-3.5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-10 h-10 rounded-full bg-black/25 border border-white/40 flex items-center justify-center shrink-0">
                <OfficialWhatsAppLogoSvg className="w-6 h-6 text-white" />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#facc15] border-2 border-[#075E54]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-shark italic font-black text-base tracking-wide truncate">
                    SHARK EXCHANGE SUPPORT
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-[#facc15] shrink-0" />
                </div>
                <p className="text-[11px] text-emerald-100 truncate">
                  🟢 Online · Mohit A1 &amp; VIP Desk (Encrypted In-App Chat)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close Live Chat Messenger"
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Guest Name Bar (Only if not logged in) */}
          {!currentUser && (
            <div className="px-3.5 py-2 bg-[#090d16] border-b border-white/10 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 shrink-0">Chatting as:</span>
              <input
                type="text"
                placeholder={guestIdentity.userName}
                value={customGuestName}
                onChange={(e) => setCustomGuestName(e.target.value)}
                className="flex-1 px-2.5 py-1 rounded-lg bg-[#0c111d] border border-white/15 text-white text-xs focus:outline-none focus:border-[#25D366]"
              />
            </div>
          )}

          {/* Scrollable Real-Time Chat Messages */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 bg-[#070a10]">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400">
                <Sparkles className="w-3 h-3 text-[#facc15]" />
                Direct End-to-End In-App Support · No Phone Number Required
              </span>
            </div>

            {messagesList.map((msg) => {
              const isCustomer = msg.sender === 'customer';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isCustomer ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow ${
                      isCustomer
                        ? 'bg-[#25D366] text-[#051b0e] font-semibold rounded-br-xs'
                        : 'bg-[#141c2e] border border-white/10 text-white rounded-bl-xs'
                    }`}
                  >
                    {!isCustomer && (
                      <span className="block text-[10px] font-extrabold text-[#facc15] mb-0.5">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 px-1 font-mono-tabular">
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick 1-Tap Customer Prompts */}
          <div className="px-3 py-2 bg-[#090d16] border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {QUICK_CUSTOMER_PROMPTS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => void handleSend(chip)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#25D366]/20 border border-white/15 hover:border-[#25D366] text-[11px] font-semibold text-slate-200 whitespace-nowrap cursor-pointer transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-3 bg-[#0c111d] border-t border-white/10 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              data-testid="customer-chat-input"
              placeholder="Type your message to Admin / Support..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-white text-xs focus:outline-none focus:border-[#25D366]"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || sending}
              aria-label="Send Live Chat Message"
              data-testid="customer-chat-send-btn"
              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-40 text-black font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
