import { useEffect, useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 800),
      setTimeout(() => setStage(3), 1300),
      setTimeout(() => onComplete(), 2500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] flex flex-col items-center justify-center overflow-hidden z-50">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-r from-[#FF2B2B] to-[#FF6A00] opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `flamo-float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Glow orbs */}
      <div className="absolute w-96 h-96 rounded-full bg-[#FF2B2B] opacity-10 blur-[100px] animate-pulse" />
      <div className="absolute w-64 h-64 rounded-full bg-[#FF6A00] opacity-10 blur-[80px] animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo */}
        <div className={`flex items-center justify-center gap-4 transition-all duration-700 ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative">
            <Flame 
              className="w-20 h-20 text-[#FF2B2B] flamo-fire-flicker" 
              fill="url(#fireGradient)"
            />
            <svg width="0" height="0">
              <defs>
                <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#FF2B2B" />
                  <stop offset="50%" stopColor="#FF4500" />
                  <stop offset="100%" stopColor="#FF6A00" />
                </linearGradient>
              </defs>
            </svg>
            {/* Sparkles around flame */}
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[#FFB800] animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-[#FF6A00] animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
          <h1 className="text-7xl font-bold tracking-tight">
            <span className="gradient-text-animated">FLaMO</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className={`mt-6 text-2xl font-light tracking-wide transition-all duration-700 delay-300 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="text-white/80">Light Up </span>
          <span className="text-[#FF6A00]">Your Vibe</span>
        </p>

        {/* Subtitle */}
        <p className={`mt-3 text-sm text-white/50 transition-all duration-700 delay-500 ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          Connect through presence, not words
        </p>

        {/* Loading indicator */}
        <div className={`mt-12 transition-all duration-700 delay-700 ${stage >= 3 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flamo-spinner mx-auto" />
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0F] to-transparent" />
    </div>
  );
}
