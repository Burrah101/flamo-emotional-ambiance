import { useState } from 'react';
import { useLocation } from 'wouter';
import { Flame, User, Heart, Camera, Sparkles, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Avatar } from '@/components/Avatar';
import { CameraVerification } from '@/components/CameraVerification';

const MOODS = [
  { id: 'focus', name: 'Focus', emoji: '🎯', color: '#00E5A0', description: 'Get in the zone' },
  { id: 'chill', name: 'Chill', emoji: '🌊', color: '#00D4FF', description: 'Relax and unwind' },
  { id: 'sleep', name: 'Sleep', emoji: '🌙', color: '#9B59B6', description: 'Wind down' },
  { id: 'romance', name: 'Romance', emoji: '💕', color: '#FF69B4', description: 'Feel the love' },
  { id: 'bond', name: 'Bond', emoji: '🤝', color: '#FFB800', description: 'Connect deeper' },
  { id: 'afterglow', name: 'Afterglow', emoji: '✨', color: '#FF6A00', description: 'Bask in warmth' },
];

const PREFERENCES = [
  { id: 'men', label: 'Men', emoji: '👨' },
  { id: 'women', label: 'Women', emoji: '👩' },
  { id: 'everyone', label: 'Everyone', emoji: '💫' },
  { id: 'vibes', label: 'Just vibes', emoji: '🌈', subtitle: 'No matching, just presence' },
];

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [preference, setPreference] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const saveProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success('Profile created! 🔥');
      setLocation('/discover');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });

  const updateLocation = trpc.profile.updateLocation.useMutation({
    onSuccess: () => {
      toast.success('Location saved!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save location');
    },
  });

  const handleNext = () => {
    if (step === 1 && !username.trim()) {
      toast.error('Give yourself a name!');
      return;
    }
    if (step === 2 && !selectedMood) {
      toast.error('Pick your vibe!');
      return;
    }
    if (step === 3 && !preference) {
      toast.error('Who do you want to meet?');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Save profile with all data
      const displayName = username || 'Anonymous';
      const bio = '';
      const avatarUrl = photoUrl || '';
      
      saveProfile.mutate({
        displayName,
        bio,
        avatarUrl,
        meetupIntent: preference === 'vibes' ? 'friends_only' : 'open',
        isDiscoverable: true, // Enable discovery after profile setup
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handlePhotoUpload = (url: string) => {
    setPhotoUrl(url);
  };

  const handleVerificationComplete = (verified: boolean) => {
    setIsVerified(verified);
    setShowVerification(false);
    if (verified) {
      toast.success('You\'re verified! 💎');
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#FF2B2B] opacity-5 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#FF6A00] opacity-5 blur-[100px]" />
      </div>

      {/* Progress bar */}
      <div className="relative z-10 px-6 pt-8">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step 
                  ? 'bg-gradient-to-r from-[#FF2B2B] to-[#FF6A00]' 
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Step 1: Username */}
          {step === 1 && (
            <div className="flamo-slide-up text-center space-y-8">
              <div className="space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FF2B2B] to-[#FF6A00] flex items-center justify-center flamo-pulse-glow">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mt-6">What should we call you?</h1>
                <p className="text-white/50">Pick something fun, it's just for vibes</p>
              </div>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your vibe name..."
                maxLength={20}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-center text-xl placeholder:text-white/30 focus:outline-none focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 transition-all"
                autoFocus
              />

              <p className="text-white/30 text-sm">
                {username.length}/20 characters
              </p>
            </div>
          )}

          {/* Step 2: Mood */}
          {step === 2 && (
            <div className="flamo-slide-up text-center space-y-8">
              <div className="space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#00D4FF] to-[#9B59B6] flex items-center justify-center flamo-pulse-glow">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mt-6">How are you feeling?</h1>
                <p className="text-white/50">Pick your current vibe</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MOODS.map((mood, i) => (
                  <button
                    key={mood.id}
                    onClick={() => setSelectedMood(mood.id)}
                    className={`p-4 rounded-2xl border transition-all duration-300 flamo-stagger-${i + 1} ${
                      selectedMood === mood.id
                        ? 'bg-white/10 border-white/30 scale-105'
                        : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                    }`}
                    style={{
                      boxShadow: selectedMood === mood.id ? `0 0 30px ${mood.color}40` : 'none',
                    }}
                  >
                    <span className="text-3xl">{mood.emoji}</span>
                    <p className="text-white font-medium mt-2">{mood.name}</p>
                    <p className="text-white/40 text-xs">{mood.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Preference */}
          {step === 3 && (
            <div className="flamo-slide-up text-center space-y-8">
              <div className="space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FF69B4] to-[#FF2B2B] flex items-center justify-center flamo-pulse-glow">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mt-6">Who do you want to vibe with?</h1>
                <p className="text-white/50">No pressure, just preferences</p>
              </div>

              <div className="space-y-3">
                {PREFERENCES.map((pref, i) => (
                  <button
                    key={pref.id}
                    onClick={() => setPreference(pref.id)}
                    className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition-all duration-300 flamo-stagger-${i + 1} ${
                      preference === pref.id
                        ? 'bg-white/10 border-[#FF6A00]/50 scale-[1.02]'
                        : 'bg-white/5 border-white/10 hover:bg-white/8'
                    }`}
                  >
                    <span className="text-2xl">{pref.emoji}</span>
                    <div className="text-left flex-1">
                      <p className="text-white font-medium">{pref.label}</p>
                      {pref.subtitle && <p className="text-white/40 text-sm">{pref.subtitle}</p>}
                    </div>
                    {preference === pref.id && (
                      <Check className="w-5 h-5 text-[#FF6A00]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Photo */}
          {step === 4 && (
            <div className="flamo-slide-up text-center space-y-8">
              <div className="space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#FFB800] to-[#FF6A00] flex items-center justify-center flamo-pulse-glow">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mt-6">Show yourself</h1>
                <p className="text-white/50">Real faces create real connections</p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <Avatar
                  src={photoUrl}
                  name={username}
                  size="xl"
                  editable
                  onUpload={handlePhotoUpload}
                  verified={isVerified}
                  showVerifiedBadge
                />

                {photoUrl && !isVerified && (
                  <button
                    onClick={() => setShowVerification(true)}
                    className="px-6 py-3 bg-[#00D4FF]/20 border border-[#00D4FF]/30 rounded-xl text-[#00D4FF] font-medium hover:bg-[#00D4FF]/30 transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Verify it's really you
                  </button>
                )}

                {isVerified && (
                  <div className="flex items-center gap-2 text-[#00D4FF]">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Verified!</span>
                  </div>
                )}

                <p className="text-white/30 text-sm max-w-xs">
                  Verified profiles get more matches and appear higher in discover
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="relative z-10 px-6 pb-8 safe-bottom">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-medium hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={saveProfile.isPending}
            className="flex-1 py-4 bg-gradient-to-r from-[#FF2B2B] to-[#FF6A00] rounded-2xl text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saveProfile.isPending ? (
              <div className="flamo-spinner w-6 h-6" />
            ) : (
              <>
                {step === 4 ? 'Let\'s Go!' : 'Continue'}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Verification Modal */}
      {showVerification && photoUrl && (
        <CameraVerification
          profilePhotoUrl={photoUrl}
          onComplete={handleVerificationComplete}
          onClose={() => setShowVerification(false)}
        />
      )}
    </div>
  );
}
