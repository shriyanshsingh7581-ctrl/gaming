import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  SpinRecord,
  SPIN_WHEEL_SEGMENTS,
  DAILY_SPIN_USED_MESSAGE,
  OFFICIAL_POSTER_ASSETS,
  formatCountdownToNextIstMidnight,
  getCurrentIstDateKey,
  getWheelLandingAngleForSegment,
  sanitizeSpinRecordToEligibleBonus,
} from '../utils/exchangeLogic';
import {
  fetchUserDailySpinStatus,
  executeDailySpinForUser,
} from '../firebase';
import {
  X,
  Trophy,
  Sparkles,
  Clock,
  ShieldCheck,
  Gift,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface SpinWheelModalProps {
  isOpen: boolean;
  currentUser: UserProfile | null;
  onClose: () => void;
  onNotify?: (msg: string) => void;
}

const CONFETTI_COLORS = [
  '#facc15',
  '#ec4899',
  '#a855f7',
  '#10b981',
  '#f59e0b',
  '#ffffff',
];

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onNotify,
}) => {
  const [eligibleToday, setEligibleToday] = useState<boolean>(true);
  const [todayRecord, setTodayRecord] = useState<SpinRecord | null>(null);
  const [userHistory, setUserHistory] = useState<SpinRecord[]>([]);
  const [istDateKey, setIstDateKey] = useState<string>(() => getCurrentIstDateKey());
  const [countdownText, setCountdownText] = useState<string>(() =>
    formatCountdownToNextIstMidnight()
  );
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(() =>
    getWheelLandingAngleForSegment(4, 0, 0)
  );
  const [winningPopupRecord, setWinningPopupRecord] = useState<SpinRecord | null>(null);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const spinLockRef = useRef<boolean>(false);
  const spinTimeoutRef = useRef<number | null>(null);

  // Sync user's daily spin status from backend/database when modal opens or user changes
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    let cancelled = false;
    setErrorMessage(null);

    fetchUserDailySpinStatus(currentUser.uid)
      .then((status) => {
        if (cancelled) return;
        setIstDateKey(status.istDateKey);
        setEligibleToday(status.eligibleToday);
        const sanitizedToday = status.todayRecord
          ? sanitizeSpinRecordToEligibleBonus(status.todayRecord)
          : null;
        setTodayRecord(sanitizedToday);
        setUserHistory(
          (status.userHistory || []).map((r) => sanitizeSpinRecordToEligibleBonus(r))
        );
        if (sanitizedToday) {
          setWheelRotation((prev) =>
            getWheelLandingAngleForSegment(sanitizedToday.segmentIndex, prev, 0)
          );
        }
        if (!status.eligibleToday) {
          setErrorMessage(DAILY_SPIN_USED_MESSAGE);
        }
      })
      .catch(() => {
        // Fallback handled inside fetchUserDailySpinStatus
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, currentUser]);

  // Live 1-second countdown until 12:00 AM IST (and automatic midnight reset check)
  useEffect(() => {
    if (!isOpen) return;
    const tick = () => {
      const now = Date.now();
      setCountdownText(formatCountdownToNextIstMidnight(now));
      const latestIstDate = getCurrentIstDateKey(now);
      if (latestIstDate !== istDateKey && currentUser) {
        setIstDateKey(latestIstDate);
        fetchUserDailySpinStatus(currentUser.uid).then((status) => {
          setEligibleToday(status.eligibleToday);
          setTodayRecord(status.todayRecord);
          setUserHistory(status.userHistory);
          if (status.eligibleToday) {
            setErrorMessage(null);
          }
        });
      }
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [isOpen, istDateKey, currentUser]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen || !currentUser) return null;

  const handleSpinClick = async () => {
    if (spinLockRef.current || isSpinning) return;
    if (!eligibleToday || todayRecord) {
      setErrorMessage(DAILY_SPIN_USED_MESSAGE);
      return;
    }

    spinLockRef.current = true;
    setIsSpinning(true);
    setErrorMessage(null);
    setWinningPopupRecord(null);
    setShowConfetti(false);

    try {
      const result = await executeDailySpinForUser(currentUser);
      const record = sanitizeSpinRecordToEligibleBonus(result.record);

      // Compute exact clockwise rotation so the fixed 12 o'clock pointer lands dead-center
      // on `record.segmentIndex` (one of the 4 eligible bonus segments: 5%, 10%, 20%, 25% Bonus).
      const nextRotation = getWheelLandingAngleForSegment(
        record.segmentIndex,
        wheelRotation,
        6
      );

      setWheelRotation(nextRotation);

      spinTimeoutRef.current = window.setTimeout(() => {
        setIsSpinning(false);
        setEligibleToday(false);
        setTodayRecord(record);
        setUserHistory((prev) => [
          record,
          ...prev.filter((r) => r.spinId !== record.spinId),
        ]);
        setWinningPopupRecord(record);
        setErrorMessage(DAILY_SPIN_USED_MESSAGE);
        if (record.category !== 'try_again') {
          setShowConfetti(true);
        }
        if (onNotify) {
          if (record.category === 'cash_reward') {
            onNotify(`🎉 Congratulations! You won ${record.prizeLabel} — ₹500 credited to your wallet!`);
          } else if (record.category === 'try_again') {
            onNotify(`Spin completed: ${record.prizeLabel}. Come back tomorrow at 12:00 AM IST!`);
          } else {
            onNotify(`🎉 Congratulations! You won ${record.prizeLabel}!`);
          }
        }
        spinLockRef.current = false;
      }, 4300);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : DAILY_SPIN_USED_MESSAGE;
      setErrorMessage(msg);
      setEligibleToday(false);
      setIsSpinning(false);
      spinLockRef.current = false;
      // Refresh status from server/store
      fetchUserDailySpinStatus(currentUser.uid).then((status) => {
        setEligibleToday(status.eligibleToday);
        setTodayRecord(status.todayRecord);
        setUserHistory(status.userHistory);
      });
    }
  };

  const handleCopyRewardCode = (code: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Helper to build SVG slice paths for 10 segments
  const renderWheelSvgSlices = () => {
    const numSlices = SPIN_WHEEL_SEGMENTS.length;
    const sliceDeg = 360 / numSlices;
    const radius = 150;
    const cx = 160;
    const cy = 160;

    return SPIN_WHEEL_SEGMENTS.map((seg, idx) => {
      const startDeg = idx * sliceDeg - 90;
      const endDeg = (idx + 1) * sliceDeg - 90;
      const startRad = (startDeg * Math.PI) / 180;
      const endRad = (endDeg * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
      const midDeg = idx * sliceDeg + sliceDeg / 2;

      return (
        <g key={seg.id}>
          <path
            d={pathData}
            fill={seg.bgColor}
            stroke="#facc15"
            strokeWidth="1.5"
          />
          <g
            transform={`translate(${cx}, ${cy}) rotate(${midDeg}) translate(0, -102)`}
          >
            <text
              x="0"
              y="0"
              fill={seg.textColor}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="10.5"
              fontWeight="900"
              fontFamily="Arial Black, Inter, sans-serif"
              style={{ letterSpacing: '0.02em' }}
            >
              {seg.label}
            </text>
          </g>
        </g>
      );
    });
  };

  return (
    <div
      data-testid="spin-wheel-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      {/* Celebratory Confetti Overlay when User Wins */}
      {showConfetti && (
        <div
          data-testid="spin-confetti-overlay"
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          {Array.from({ length: 36 }).map((_, idx) => {
            const left = `${(idx * 29) % 100}%`;
            const color = CONFETTI_COLORS[idx % CONFETTI_COLORS.length];
            const delay = `${(idx % 7) * 0.12}s`;
            return (
              <span
                key={`confetti-${idx}`}
                style={{
                  left,
                  top: '-16px',
                  backgroundColor: color,
                  animationDelay: delay,
                }}
                className="absolute w-2.5 h-5 rounded-sm opacity-90 animate-bounce"
              />
            );
          })}
        </div>
      )}

      <div className="relative w-full max-w-2xl rounded-3xl bg-gradient-to-br from-[#1f052c] via-[#0c0517] to-[#260622] border-[3px] border-[#facc15] shadow-[0_0_60px_rgba(250,204,21,0.45)] text-white overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Modal Header */}
        <div className="bg-gradient-to-r from-[#2e0744] via-[#4a0e68] to-[#2e0744] border-b-2 border-[#facc15]/70 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#facc15] text-black flex items-center justify-center shadow">
              <Sparkles className="w-5 h-5 fill-current" />
            </span>
            <div>
              <h2 className="font-shark italic font-black text-base sm:text-xl tracking-wider text-white flex items-center gap-1.5">
                <span>SHARK</span>
                <span className="text-[#facc15]">EXCHANGE</span>
                <span className="text-xs sm:text-sm font-extrabold px-2 py-0.5 rounded-full bg-[#facc15] text-black not-italic">
                  SPIN THE WHEEL
                </span>
              </h2>
              <p className="text-[11px] text-purple-200/90">
                Spin &amp; Win Exciting Rewards Instantly · 1 Free Spin Every Day (Resets 12:00 AM IST)
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-spin-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black text-slate-300 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Daily Spin Limit & Live IST Countdown Banner */}
          <div className="rounded-2xl bg-black/60 border border-[#facc15]/60 p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#facc15] shrink-0" />
              <span className="text-xs font-bold text-white">
                Player: <span className="text-[#facc15]">{currentUser.name}</span>
              </span>
              <span
                data-testid="spin-eligibility-badge"
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  eligibleToday && !todayRecord
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                }`}
              >
                {eligibleToday && !todayRecord
                  ? '1 Daily Spin Available Today'
                  : 'Daily Spin Used Today'}
              </span>
            </div>

            <div
              data-testid="spin-ist-countdown"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1a092b] border border-purple-400/40 text-xs font-mono-tabular text-[#facc15] font-bold"
            >
              <Clock className="w-3.5 h-3.5 text-pink-400" />
              <span>Next Spin (12:00 AM IST): {countdownText}</span>
            </div>
          </div>

          {/* Mandatory Used Daily Spin Message */}
          {(!eligibleToday || todayRecord || errorMessage) && (
            <div
              data-testid="daily-spin-used-alert"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-red-500/20 to-amber-500/20 border-2 border-[#facc15] text-center space-y-1 shadow-lg"
            >
              <div className="flex items-center justify-center gap-2 text-[#facc15] font-extrabold text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage || DAILY_SPIN_USED_MESSAGE}</span>
              </div>
              <p className="text-[11px] text-purple-200">
                Next eligible spin unlocks automatically at{' '}
                <strong className="text-white">12:00 AM IST</strong> (in{' '}
                <span className="font-mono-tabular text-[#facc15] font-bold">
                  {countdownText}
                </span>
                ).
              </p>
            </div>
          )}

          {/* Main Wheel & Prize Showcase Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Interactive Purple, Black & Golden Spin Wheel */}
            <div className="md:col-span-7 flex flex-col items-center justify-center">
              <div className="relative w-[290px] h-[290px] sm:w-[320px] sm:h-[320px] flex items-center justify-center select-none">
                {/* Fixed Top Red & Gold Pointer */}
                <div
                  data-testid="spin-wheel-pointer"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]"
                >
                  <svg width="36" height="42" viewBox="0 0 36 42">
                    <path
                      d="M18 40 L4 14 A14 14 0 1 1 32 14 Z"
                      fill="#dc2626"
                      stroke="#facc15"
                      strokeWidth="3"
                    />
                    <circle cx="18" cy="14" r="5" fill="#fef08a" />
                  </svg>
                </div>

                {/* Outer Golden Rim with Glowing Bulbs */}
                <div className="w-full h-full rounded-full p-2.5 bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#a16207] shadow-[0_0_40px_rgba(250,204,21,0.6)] flex items-center justify-center relative">
                  {/* Rotating SVG Wheel */}
                  <div
                    data-testid="spin-wheel-rotor"
                    style={{
                      transform: `rotate(${wheelRotation}deg)`,
                      transition: isSpinning
                        ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.2, 1)'
                        : 'none',
                    }}
                    className="w-full h-full rounded-full overflow-hidden shadow-inner border-4 border-[#090d16]"
                  >
                    <svg
                      viewBox="0 0 320 320"
                      className="w-full h-full block"
                      aria-label="SHARK EXCHANGE 10-Prize Spin Wheel"
                    >
                      {renderWheelSvgSlices()}
                    </svg>
                  </div>

                  {/* Center Red & Gold SPIN Button */}
                  <button
                    type="button"
                    data-testid="spin-wheel-trigger-btn"
                    onClick={handleSpinClick}
                    disabled={isSpinning || !eligibleToday || Boolean(todayRecord)}
                    className={`absolute z-20 w-20 h-20 rounded-full border-4 border-[#fef08a] shadow-[0_0_25px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center font-shark italic font-black text-sm tracking-wider transition-transform ${
                      isSpinning || !eligibleToday || Boolean(todayRecord)
                        ? 'bg-gradient-to-b from-slate-700 to-slate-900 text-slate-400 cursor-not-allowed opacity-85'
                        : 'bg-gradient-to-b from-red-500 via-red-600 to-red-800 hover:scale-105 active:scale-95 text-white cursor-pointer'
                    }`}
                  >
                    <span>{isSpinning ? 'SPIN...' : 'SPIN'}</span>
                    <span className="text-[8px] font-sans not-italic font-extrabold text-[#facc15] uppercase">
                      {eligibleToday && !todayRecord ? 'NOW' : 'LOCKED'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Official 10 Wheel Segments & Today's Result */}
            <div className="md:col-span-5 space-y-3">
              <div className="rounded-2xl bg-[#140724] border border-[#facc15]/50 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#facc15] flex items-center gap-1.5">
                    <Gift className="w-4 h-4" />
                    <span>10 Official Wheel Rewards</span>
                  </h3>
                  <span className="text-[10px] font-bold text-purple-300">
                    100% Verified
                  </span>
                </div>

                <div
                  data-testid="spin-wheel-prize-list"
                  className="grid grid-cols-2 gap-1.5 text-[11px]"
                >
                  {SPIN_WHEEL_SEGMENTS.map((seg, idx) => (
                    <div
                      key={seg.id}
                      data-testid={`wheel-segment-item-${idx + 1}`}
                      className="px-2.5 py-1.5 rounded-xl bg-black/50 border border-white/10 flex items-center gap-1.5 font-bold text-white"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#facc15] text-black text-[9px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{seg.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Winning Result Card (or Winning Popup Summary) */}
              {(winningPopupRecord || todayRecord) && (
                <div
                  data-testid="spin-winning-result-popup"
                  className="rounded-2xl bg-gradient-to-br from-[#2d0b49] via-[#1b062e] to-[#090d16] border-2 border-[#facc15] p-3.5 shadow-[0_0_28px_rgba(250,204,21,0.4)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#facc15] text-black">
                      <Trophy className="w-3 h-3" />
                      <span>Today&apos;s Spin Result ({istDateKey})</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300">
                      {(winningPopupRecord || todayRecord)?.claimStatus}
                    </span>
                  </div>

                  <div className="text-base sm:text-lg font-black text-[#facc15]">
                    {(winningPopupRecord || todayRecord)?.prizeLabel}
                  </div>

                  {(winningPopupRecord || todayRecord)?.category === 'cash_reward' && (
                    <p className="text-xs text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>₹500 Instant Reward credited to your SHARK EXCH Wallet!</span>
                    </p>
                  )}

                  {(winningPopupRecord || todayRecord)?.category === 'bonus' && (
                    <p className="text-xs text-purple-200">
                      Share your reward code in Live Support Chat or Deposit modal to claim your{' '}
                      <strong className="text-[#facc15]">
                        {(winningPopupRecord || todayRecord)?.prizeLabel}
                      </strong>{' '}
                      on your next ID refill!
                    </p>
                  )}

                  {(winningPopupRecord || todayRecord)?.category === 'physical' && (
                    <p className="text-xs text-amber-300">
                      Physical prize requires Master Admin verification. Contact 24/7 Live Support with your Reward Code below.
                    </p>
                  )}

                  {(winningPopupRecord || todayRecord)?.rewardCode &&
                    (winningPopupRecord || todayRecord)?.category !== 'try_again' && (
                      <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/60 border border-white/15 text-xs font-mono-tabular">
                        <span className="text-[#facc15] font-bold truncate">
                          {(winningPopupRecord || todayRecord)?.rewardCode}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyRewardCode(
                              (winningPopupRecord || todayRecord)!.rewardCode
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-[#facc15] text-black font-extrabold text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Prize Conditions & Eligibility Rules + User Spin History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
            <div className="rounded-2xl bg-black/45 border border-white/10 p-3.5 space-y-1.5 text-[11px] text-slate-300">
              <h4 className="font-extrabold text-xs text-[#facc15] uppercase tracking-wider">
                Official Eligibility &amp; Prize Rules
              </h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Strictly 1 Spin per registered user per calendar day.</li>
                <li>Daily spin eligibility resets automatically at 12:00 AM IST.</li>
                <li>₹500 Cash Reward is credited once per winning spin directly to wallet.</li>
                <li>Percentage Bonuses (5%, 10%, 20%, 25%) apply to your next deposit/ID refill.</li>
                <li>Physical prizes (iPhone, Laptop, Smart TV, Refrigerator) require Admin verification.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-black/45 border border-white/10 p-3.5 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-[#facc15] uppercase tracking-wider">
                  Your Daily Spin History
                </h4>
                <img
                  src={OFFICIAL_POSTER_ASSETS.spinWheelPoster}
                  alt="Spin Poster"
                  className="w-10 h-6 object-cover rounded border border-[#facc15]/50"
                />
              </div>
              {userHistory.length === 0 ? (
                <p className="text-slate-400 py-2">
                  No spins recorded yet. Click SPIN on the wheel to use today&apos;s spin!
                </p>
              ) : (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                  {userHistory.slice(0, 5).map((item) => (
                    <div
                      key={item.spinId}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div>
                        <span className="font-bold text-white">{item.prizeLabel}</span>
                        <span className="block text-[10px] text-slate-400 font-mono-tabular">
                          IST Date: {item.istDateKey}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#facc15]">
                        {item.claimStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
