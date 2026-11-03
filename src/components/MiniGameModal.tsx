import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  calculateMinesMultiplier,
} from '../utils/exchangeLogic';
import { updateCustomerWalletBalance } from '../firebase';
import { GameCategoryType } from './BannerAndGames';
import { X, Rocket, Bomb, Trophy, Zap, Flame, Coins } from 'lucide-react';

interface MiniGameModalProps {
  activeGame: GameCategoryType | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onRequireAuth: () => void;
  onNotify: (msg: string) => void;
}

/**
 * Interactive Playable Exchange Mini-Games synced with Firebase `/users/{uid}/walletBalance`:
 * - Aviatrix (Space Jet Crash Multiplier Game)
 * - MINES (5x5 Bomb Minesweeper Grid Game)
 * - Cricket Live (Back/Lay Instant Match Odds Exchange)
 * - Color Prediction (WinGo Red/Green/Violet)
 * - Live Casino (VIP Teen Patti / Baccarat Quick Draw)
 */
export const MiniGameModal: React.FC<MiniGameModalProps> = ({
  activeGame,
  currentUser,
  onClose,
  onRequireAuth,
  onNotify,
}) => {
  const [stake, setStake] = useState<number>(200);

  // Aviatrix state
  const [jetState, setJetState] = useState<'idle' | 'flying' | 'crashed' | 'cashed'>('idle');
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const crashPointRef = useRef<number>(2.5);
  const animTimerRef = useRef<number | null>(null);

  // Mines state
  const [minesCount, setMinesCount] = useState<number>(3);
  const [minesActive, setMinesActive] = useState<boolean>(false);
  const [bombPositions, setBombPositions] = useState<Set<number>>(new Set());
  const [revealedTiles, setRevealedTiles] = useState<Set<number>>(new Set());
  const [minesGameOver, setMinesGameOver] = useState<'none' | 'exploded' | 'cashed'>('none');

  // Instant Odds / Color / Casino state
  const [quickResult, setQuickResult] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) window.clearInterval(animTimerRef.current);
    };
  }, []);

  if (!activeGame) return null;

  const balance = currentUser?.walletBalance ?? 0;

  /* ---------------- AVIATRIX HANDLERS ---------------- */
  const startAviatrixFlight = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (stake <= 0 || stake > balance) {
      onNotify('Insufficient wallet balance for this bet. Please Deposit first.');
      return;
    }

    await updateCustomerWalletBalance(currentUser.uid, balance - stake);
    const randomCrash = Number((1.15 + Math.random() * 5.8).toFixed(2));
    crashPointRef.current = randomCrash;
    setMultiplier(1.0);
    setJetState('flying');

    if (animTimerRef.current) window.clearInterval(animTimerRef.current);
    animTimerRef.current = window.setInterval(() => {
      setMultiplier((prev) => {
        const next = Number((prev + 0.06).toFixed(2));
        if (next >= crashPointRef.current) {
          if (animTimerRef.current) window.clearInterval(animTimerRef.current);
          setJetState('crashed');
          return crashPointRef.current;
        }
        return next;
      });
    }, 90);
  };

  const cashoutAviatrix = async () => {
    if (!currentUser || jetState !== 'flying') return;
    if (animTimerRef.current) window.clearInterval(animTimerRef.current);
    setJetState('cashed');
    const winAmount = Math.round(stake * multiplier);
    await updateCustomerWalletBalance(currentUser.uid, balance + winAmount);
    onNotify(`AVIATRIX CASHOUT AT ${multiplier.toFixed(2)}X! Won ₹${winAmount.toLocaleString('en-IN')}`);
  };

  /* ---------------- MINES HANDLERS ---------------- */
  const startMinesRound = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (stake <= 0 || stake > balance) {
      onNotify('Insufficient wallet balance. Please Deposit funds.');
      return;
    }

    await updateCustomerWalletBalance(currentUser.uid, balance - stake);
    const bombs = new Set<number>();
    while (bombs.size < minesCount) {
      bombs.add(Math.floor(Math.random() * 25));
    }
    setBombPositions(bombs);
    setRevealedTiles(new Set());
    setMinesGameOver('none');
    setMinesActive(true);
  };

  const clickMineTile = (idx: number) => {
    if (!minesActive || revealedTiles.has(idx)) return;
    const nextRevealed = new Set(revealedTiles);
    nextRevealed.add(idx);
    setRevealedTiles(nextRevealed);

    if (bombPositions.has(idx)) {
      setMinesActive(false);
      setMinesGameOver('exploded');
    }
  };

  const cashoutMinesRound = async () => {
    if (!currentUser || !minesActive || revealedTiles.size === 0) return;
    const mult = calculateMinesMultiplier(minesCount, revealedTiles.size);
    const winAmount = Math.round(stake * mult);
    setMinesActive(false);
    setMinesGameOver('cashed');
    await updateCustomerWalletBalance(currentUser.uid, balance + winAmount);
    onNotify(`MINES CASHOUT (${mult}X)! Credited ₹${winAmount.toLocaleString('en-IN')} to Wallet.`);
  };

  /* ---------------- QUICK EXCHANGE / COLOR / CASINO HANDLER ---------------- */
  const placeInstantExchangeBet = async (selectionLabel: string, odds: number) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (stake <= 0 || stake > balance) {
      onNotify('Insufficient wallet balance. Please Deposit funds.');
      return;
    }

    const won = Math.random() > 0.42;
    if (won) {
      const profit = Math.round(stake * (odds - 1));
      await updateCustomerWalletBalance(currentUser.uid, balance + profit);
      setQuickResult(
        `WON on "${selectionLabel}" (${odds}x)! Net Profit +₹${profit.toLocaleString('en-IN')} synced to Firebase.`
      );
    } else {
      await updateCustomerWalletBalance(currentUser.uid, balance - stake);
      setQuickResult(
        `Round settled against "${selectionLabel}". Stake ₹${stake.toLocaleString('en-IN')} deducted.`
      );
    }
  };

  const currentMinesMult = calculateMinesMultiplier(minesCount, revealedTiles.size);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shark Exch Live Game Arena"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-3xl bg-[#0c111d] border border-[#facc15]/40 shadow-2xl overflow-hidden my-auto">
        {/* Top Game Header */}
        <div className="bg-[#090d16] border-b border-white/10 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeGame === 'aviatrix' && <Rocket className="w-5 h-5 text-sky-400" />}
            {activeGame === 'mines' && <Bomb className="w-5 h-5 text-red-400" />}
            {activeGame === 'cricket' && <Trophy className="w-5 h-5 text-emerald-400" />}
            {activeGame === 'color' && <Zap className="w-5 h-5 text-purple-400" />}
            {activeGame === 'casino' && <Flame className="w-5 h-5 text-pink-400" />}
            <h2 className="font-shark italic font-black text-xl uppercase text-white">
              {activeGame === 'aviatrix' && 'AVIATRIX SPACE JET CRASH'}
              {activeGame === 'mines' && 'SHARK MINES (5x5 TURBO)'}
              {activeGame === 'cricket' && 'CRICKET LIVE BACK/LAY EXCHANGE'}
              {activeGame === 'color' && 'WINGO 30S COLOR PREDICTION'}
              {activeGame === 'casino' && 'SEXY LIVE CASINO VIP TABLE'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 text-xs">
              <Coins className="w-3.5 h-3.5 text-[#facc15]" />
              <span className="font-mono-tabular font-bold text-[#facc15]">
                ₹{balance.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Game Modal"
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* 1. AVIATRIX CRASH ARENA */}
          {activeGame === 'aviatrix' && (
            <div className="space-y-4">
              <div className="relative h-52 rounded-2xl bg-gradient-to-b from-[#070b24] via-[#131d56] to-[#090d16] border border-sky-500/30 flex flex-col items-center justify-center overflow-hidden">
                <div className="font-mono-tabular font-black text-5xl sm:text-6xl text-white drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]">
                  {multiplier.toFixed(2)}x
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-sky-300">
                  {jetState === 'idle' && 'Place Bet to Launch Space Jet'}
                  {jetState === 'flying' && 'JET IN FLIGHT — CASHOUT ANYTIME!'}
                  {jetState === 'crashed' && `FLEW AWAY AT ${multiplier.toFixed(2)}X`}
                  {jetState === 'cashed' && `CASHED OUT SUCCESSFULLY AT ${multiplier.toFixed(2)}X!`}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Bet Stake (₹)
                  </label>
                  <input
                    type="number"
                    min={50}
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular font-bold text-white"
                  />
                </div>
                {jetState === 'flying' ? (
                  <button
                    type="button"
                    onClick={cashoutAviatrix}
                    className="mt-5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm cursor-pointer shadow-lg"
                  >
                    CASHOUT ₹{Math.round(stake * multiplier).toLocaleString('en-IN')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startAviatrixFlight}
                    className="mt-5 px-6 py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm cursor-pointer shadow-lg"
                  >
                    LAUNCH BET (₹{stake})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2. MINES 5x5 BOMB GRID ARENA */}
          {activeGame === 'mines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs bg-[#090d16] p-3 rounded-xl border border-white/10">
                <div>
                  <span className="text-slate-400">Bombs on Grid: </span>
                  <select
                    value={minesCount}
                    disabled={minesActive}
                    onChange={(e) => setMinesCount(Number(e.target.value))}
                    className="bg-slate-800 text-[#facc15] font-bold rounded px-2 py-1 ml-1"
                  >
                    <option value={3}>3 Bombs</option>
                    <option value={5}>5 Bombs</option>
                    <option value={10}>10 Bombs</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-400">Current Multiplier: </span>
                  <span className="font-mono-tabular font-bold text-[#facc15] text-sm">
                    {currentMinesMult}x
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 max-w-xs mx-auto">
                {Array.from({ length: 25 }).map((_, idx) => {
                  const isRevealed = revealedTiles.has(idx);
                  const isBomb = bombPositions.has(idx);
                  const showAllBombs = minesGameOver !== 'none' && isBomb;

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={!minesActive || isRevealed}
                      onClick={() => clickMineTile(idx)}
                      aria-label={`Mine Tile ${idx + 1}`}
                      className={`h-12 rounded-xl font-bold text-sm flex items-center justify-center border transition-all cursor-pointer ${
                        isRevealed
                          ? isBomb
                            ? 'bg-red-600 border-red-400 text-white'
                            : 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : showAllBombs
                          ? 'bg-red-900/40 border-red-500/40 text-red-300'
                          : 'bg-[#090d16] hover:bg-slate-800 border-white/15 text-slate-400'
                      }`}
                    >
                      {isRevealed ? (isBomb ? '💣' : '💎') : showAllBombs ? '💣' : '?'}
                    </button>
                  );
                })}
              </div>

              {minesGameOver === 'exploded' && (
                <p className="text-center text-xs font-bold text-red-400">
                  BOOM! You hit a naval mine. Start a new round to try again!
                </p>
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Bet Stake (₹)
                  </label>
                  <input
                    type="number"
                    min={50}
                    disabled={minesActive}
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular font-bold text-white"
                  />
                </div>
                {minesActive ? (
                  <button
                    type="button"
                    onClick={cashoutMinesRound}
                    disabled={revealedTiles.size === 0}
                    className="mt-5 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm cursor-pointer disabled:opacity-40"
                  >
                    CASHOUT ₹{Math.round(stake * currentMinesMult).toLocaleString('en-IN')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startMinesRound}
                    className="mt-5 px-6 py-3 rounded-xl bg-[#facc15] hover:bg-yellow-300 text-black font-extrabold text-sm cursor-pointer"
                  >
                    START MINES (₹{stake})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. CRICKET / COLOR PREDICTION / LIVE CASINO INSTANT EXCHANGE */}
          {(activeGame === 'cricket' ||
            activeGame === 'color' ||
            activeGame === 'casino') && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Enter Exchange Stake (₹)
                </label>
                <input
                  type="number"
                  min={100}
                  value={stake}
                  onChange={(e) => setStake(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090d16] border border-white/15 font-mono-tabular font-bold text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {activeGame === 'cricket' && (
                  <>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('India Back', 1.92)}
                      className="p-3.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-left cursor-pointer"
                    >
                      <div className="text-xs font-bold text-sky-300">BACK INDIA</div>
                      <div className="font-mono-tabular font-black text-xl text-white mt-1">
                        1.92
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('Australia Back', 2.05)}
                      className="p-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-left cursor-pointer"
                    >
                      <div className="text-xs font-bold text-amber-300">BACK AUSTRALIA</div>
                      <div className="font-mono-tabular font-black text-xl text-white mt-1">
                        2.05
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('6+ Runs Next Over', 1.85)}
                      className="p-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-left cursor-pointer"
                    >
                      <div className="text-xs font-bold text-emerald-300">FANCY SESSION YES</div>
                      <div className="font-mono-tabular font-black text-xl text-white mt-1">
                        1.85
                      </div>
                    </button>
                  </>
                )}

                {activeGame === 'color' && (
                  <>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('Green', 2.0)}
                      className="p-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-center cursor-pointer"
                    >
                      JOIN GREEN (2X)
                    </button>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('Violet', 4.5)}
                      className="p-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-center cursor-pointer"
                    >
                      JOIN VIOLET (4.5X)
                    </button>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('Red', 2.0)}
                      className="p-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-center cursor-pointer"
                    >
                      JOIN RED (2X)
                    </button>
                  </>
                )}

                {activeGame === 'casino' && (
                  <>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('Player (Baccarat)', 1.98)}
                      className="p-3.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-400/40 text-center cursor-pointer"
                    >
                      <div className="text-xs text-indigo-200 font-bold">PLAYER</div>
                      <div className="font-mono-tabular font-black text-lg text-white">1.98x</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('Banker (Baccarat)', 1.95)}
                      className="p-3.5 rounded-xl bg-pink-600/30 hover:bg-pink-600/40 border border-pink-400/40 text-center cursor-pointer"
                    >
                      <div className="text-xs text-pink-200 font-bold">BANKER</div>
                      <div className="font-mono-tabular font-black text-lg text-white">1.95x</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => placeInstantExchangeBet('Super Tie', 8.0)}
                      className="p-3.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/40 text-center cursor-pointer"
                    >
                      <div className="text-xs text-amber-200 font-bold">TIE BONUS</div>
                      <div className="font-mono-tabular font-black text-lg text-white">8.00x</div>
                    </button>
                  </>
                )}
              </div>

              {quickResult && (
                <div className="p-3 rounded-xl bg-white/5 border border-[#facc15]/40 text-xs text-[#facc15] font-semibold">
                  {quickResult}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
