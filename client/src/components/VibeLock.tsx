import { useState, useEffect } from 'react';
import { X, Lock, Sparkles, Zap, Heart, Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface VibeLockProps {
  matchId: number;
  currentUserId: number;
  otherUserId: number;
  otherUserName: string;
  onClose: () => void;
  onUnlockChat: () => void;
}

const VIBE_QUESTIONS = [
  "What would we do if we got lost in Bangkok at 2am?",
  "Pick the playlist for tonight: Chill, Chaos, or Cosmic?",
  "Which of us would survive a sunrise party better?",
  "Who's more likely to end up dancing on a table?",
  "If we found a secret rooftop at 3am, who suggests staying?",
  "Who picks the after-party spot?",
  "Who's the first to suggest 'one more drink'?",
  "Who would win at karaoke?",
  "Who's more likely to make friends with strangers?",
  "Who would remember the night better?",
];

export default function VibeLock({
  matchId,
  currentUserId,
  otherUserId,
  otherUserName,
  onClose,
  onUnlockChat,
}: VibeLockProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const utils = trpc.useUtils();

  // Get or create VibeLock session
  const { data: session, isLoading } = trpc.vibeLock.getSession.useQuery(
    { matchId },
    { refetchInterval: 2000 } // Poll for updates
  );

  // Submit answer mutation
  const submitAnswer = trpc.vibeLock.submitAnswer.useMutation({
    onSuccess: (data) => {
      utils.vibeLock.getSession.invalidate({ matchId });
      if (data.completed && data.score && data.score > 70) {
        setShowConfetti(true);
      }
    },
  });

  // Check if session is completed and show confetti
  useEffect(() => {
    if (session?.completed && session.score && session.score > 70) {
      setShowConfetti(true);
    }
  }, [session]);

  const handleAnswer = (answer: 'You' | 'Them') => {
    if (!session || submitAnswer.isPending) return;
    submitAnswer.mutate({ sessionId: session.id, answer });
  };

  const getCurrentUserAnswer = () => {
    if (!session) return null;
    return session.user1Id === currentUserId ? session.user1Answer : session.user2Answer;
  };

  const getOtherUserAnswer = () => {
    if (!session) return null;
    return session.user1Id === currentUserId ? session.user2Answer : session.user1Answer;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="flamo-spinner" />
      </div>
    );
  }

  if (!session) return null;

  const currentAnswer = getCurrentUserAnswer();
  const isWaitingForOther = currentAnswer && !session.completed;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      {/* Confetti celebration */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['🔥', '⚡', '✨', '💫', '💖', '🌟'][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>
      )}

      <div className="flamo-glass w-full max-w-md overflow-hidden flamo-bounce-in">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#FF2B2B] to-[#FF6A00] p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flamo-pulse-glow">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Vibe Lock</h2>
              <p className="text-white/80 text-sm">Answer to unlock the chat</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!session.completed ? (
            <>
              {/* Question card */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-[#FFB800]" />
                  <span className="text-white/60 text-sm">The question is...</span>
                </div>
                <p className="text-white text-lg font-medium leading-relaxed">
                  {session.question}
                </p>
              </div>

              {!currentAnswer ? (
                <div className="space-y-4">
                  <p className="text-white/50 text-center text-sm">Who does this describe better?</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleAnswer('You')}
                      disabled={submitAnswer.isPending}
                      className="group relative bg-gradient-to-br from-[#FF2B2B] to-[#FF4500] text-white py-5 px-6 rounded-2xl font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#FF2B2B]/30 disabled:opacity-50 disabled:scale-100"
                    >
                      <Zap className="w-5 h-5 mx-auto mb-2 group-hover:animate-bounce" />
                      You
                    </button>
                    <button
                      onClick={() => handleAnswer('Them')}
                      disabled={submitAnswer.isPending}
                      className="group relative bg-gradient-to-br from-[#FF4500] to-[#FF6A00] text-white py-5 px-6 rounded-2xl font-semibold transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#FF6A00]/30 disabled:opacity-50 disabled:scale-100"
                    >
                      <Heart className="w-5 h-5 mx-auto mb-2 group-hover:animate-bounce" />
                      {otherUserName}
                    </button>
                  </div>
                </div>
              ) : isWaitingForOther ? (
                <div className="text-center space-y-4 py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-full">
                    <div className="flamo-spinner" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Waiting for {otherUserName}...</p>
                    <p className="text-white/40 text-sm mt-1">Your answer: <span className="text-[#FF6A00]">{currentAnswer}</span></p>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            /* Results */
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl flamo-bounce-in">
                  {session.score! >= 90 ? '🔥' : session.score! >= 80 ? '⚡' : session.score! >= 70 ? '✨' : '💫'}
                </div>
                <div>
                  <div className="text-6xl font-bold gradient-text-animated">
                    {session.score}%
                  </div>
                  <p className="text-white font-medium mt-2">vibe aligned</p>
                </div>
                {session.score! >= 70 ? (
                  <p className="text-[#FF6A00] font-medium flex items-center justify-center gap-2">
                    <Star className="w-5 h-5" />
                    Your vibes are in sync!
                    <Star className="w-5 h-5" />
                  </p>
                ) : (
                  <p className="text-white/50">Different vibes, same energy ✨</p>
                )}
              </div>

              {/* Answer summary */}
              <div className="bg-white/5 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/50">You answered:</span>
                  <span className="text-[#FF6A00] font-semibold">{getCurrentUserAnswer()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/50">{otherUserName} answered:</span>
                  <span className="text-[#FF6A00] font-semibold">{getOtherUserAnswer()}</span>
                </div>
              </div>

              {/* Unlock button */}
              <button
                onClick={() => {
                  onClose();
                  onUnlockChat();
                }}
                className="w-full bg-gradient-to-r from-[#FF2B2B] to-[#FF6A00] text-white py-4 rounded-2xl font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF6A00]/30 flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Unlock Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
