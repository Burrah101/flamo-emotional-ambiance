/**
 * FLaMO Profile Setup Page
 * User profile and preferences for matching.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { GlassCard } from '../components/GlassCard';
import { Avatar } from '../components/Avatar';
import { GlassButton } from '../components/GlassButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  User, 
  MapPin, 
  Eye, 
  EyeOff, 
  Heart,
  Users,
  Shield,
  ChevronLeft,
  Save,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { CameraVerification } from '../components/CameraVerification';
import { VerificationBadge } from '../components/VerificationBadge';
import { AnimatePresence } from 'framer-motion';

const MEETUP_INTENTS = [
  { value: 'open', label: 'Open to meet', description: 'Actively looking to connect' },
  { value: 'maybe', label: 'Maybe', description: 'Open to the right connection' },
  { value: 'friends_only', label: 'Friends only', description: 'Looking for friendship' },
  { value: 'not_now', label: 'Not now', description: 'Just browsing' },
] as const;

const MODE_PREFERENCES = [
  { id: 'focus', label: 'Focus', color: '#34d399' },
  { id: 'chill', label: 'Chill', color: '#60a5fa' },
  { id: 'sleep', label: 'Sleep', color: '#a78bfa' },
  { id: 'romance', label: 'Romance', color: '#f472b6' },
  { id: 'bond', label: 'Bond', color: '#fbbf24' },
  { id: 'afterglow', label: 'Afterglow', color: '#c084fc' },
];

export default function Profile() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isDiscoverable, setIsDiscoverable] = useState(false);
  const [showDistance, setShowDistance] = useState(true);
  const [meetupIntent, setMeetupIntent] = useState<string>('maybe');
  const [selectedModes, setSelectedModes] = useState<string[]>([]);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.profile.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: verification, refetch: refetchVerification } = trpc.profile.verificationStatus.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    },
  });

  // Load profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setBio(profile.bio || '');
      setIsDiscoverable(profile.isDiscoverable);
      setShowDistance(profile.showDistance);
      setMeetupIntent(profile.meetupIntent);
      
      if (profile.preferences) {
        try {
          const prefs = JSON.parse(profile.preferences);
          setSelectedModes(prefs.modePreferences || []);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [profile]);

  const handleSave = () => {
    const preferences = JSON.stringify({
      modePreferences: selectedModes,
    });

    updateProfile.mutate({
      displayName,
      bio,
      isDiscoverable,
      showDistance,
      meetupIntent: meetupIntent as any,
      preferences,
    });
  };

  const toggleMode = (modeId: string) => {
    setSelectedModes(prev => 
      prev.includes(modeId)
        ? prev.filter(m => m !== modeId)
        : [...prev, modeId]
    );
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12] flex items-center justify-center">
        <div className="animate-pulse text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#0f0f1a] to-[#0a0a12]">
      <div className="max-w-lg mx-auto px-4 py-6 safe-top safe-bottom">
        {/* Header */}
        <header className="flex items-center gap-4 mb-6">
          <motion.button
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-5 h-5 text-white/70" />
          </motion.button>
          <h1 className="text-xl font-semibold text-white">Your Profile</h1>
        </header>

        <div className="space-y-6">
          {/* Profile Photo & Verification */}
          <GlassCard className="p-5">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar
                  src={profile?.avatarUrl}
                  name={displayName || user?.name}
                  size="xl"
                  editable
                  isVerified={verification?.isVerified}
                  showVerificationBadge
                  onPhotoChange={() => {
                    // Refetch profile to get updated avatar URL
                    refetchProfile();
                  }}
                />
              </div>
              <p className="text-sm text-white/50 mt-3">Tap to change photo</p>
              
              {/* Verification Status */}
              <div className="mt-4 w-full">
                {verification?.isVerified ? (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <VerificationBadge size="md" showTooltip={false} />
                    <span className="text-sm text-cyan-400 font-medium">Profile Verified</span>
                  </div>
                ) : profile?.avatarUrl ? (
                  <motion.button
                    className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                    onClick={() => setShowVerificationModal(true)}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Camera className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm text-white/80">Verify Your Photo</span>
                  </motion.button>
                ) : (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5">
                    <Clock className="w-4 h-4 text-white/40" />
                    <span className="text-xs text-white/50">Add a photo to verify your profile</span>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Basic Info */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-medium text-white">Basic Info</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName" className="text-white/70 text-sm">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How others will see you"
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-white/70 text-sm">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others a bit about yourself..."
                  className="mt-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px]"
                  maxLength={300}
                />
                <p className="text-xs text-white/40 mt-1">{bio.length}/300</p>
              </div>
            </div>
          </GlassCard>

          {/* Mode Preferences */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-pink-400" />
              <h2 className="text-lg font-medium text-white">Mode Preferences</h2>
            </div>
            <p className="text-sm text-white/50 mb-4">
              Select modes you enjoy. This helps find compatible connections.
            </p>

            <div className="grid grid-cols-3 gap-2">
              {MODE_PREFERENCES.map((mode) => (
                <motion.button
                  key={mode.id}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedModes.includes(mode.id)
                      ? 'ring-2'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundColor: selectedModes.includes(mode.id) ? `${mode.color}20` : undefined,
                    borderColor: selectedModes.includes(mode.id) ? mode.color : undefined,
                    borderWidth: selectedModes.includes(mode.id) ? 2 : undefined,
                  }}
                  onClick={() => toggleMode(mode.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <span 
                    className="text-sm font-medium"
                    style={{ color: selectedModes.includes(mode.id) ? mode.color : 'rgba(255,255,255,0.7)' }}
                  >
                    {mode.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </GlassCard>

          {/* Meetup Intent */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-medium text-white">Connection Intent</h2>
            </div>

            <div className="space-y-2">
              {MEETUP_INTENTS.map((intent) => (
                <motion.button
                  key={intent.value}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    meetupIntent === intent.value
                      ? 'bg-amber-500/20 ring-1 ring-amber-500/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  onClick={() => setMeetupIntent(intent.value)}
                  whileTap={{ scale: 0.98 }}
                >
                  <p className={`font-medium ${meetupIntent === intent.value ? 'text-amber-400' : 'text-white/80'}`}>
                    {intent.label}
                  </p>
                  <p className="text-xs text-white/50">{intent.description}</p>
                </motion.button>
              ))}
            </div>
          </GlassCard>

          {/* Privacy Settings */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-medium text-white">Privacy</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isDiscoverable ? (
                    <Eye className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-white/40" />
                  )}
                  <div>
                    <p className="text-white font-medium">Discoverable</p>
                    <p className="text-xs text-white/50">Others can find you nearby</p>
                  </div>
                </div>
                <Switch
                  checked={isDiscoverable}
                  onCheckedChange={setIsDiscoverable}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Show Distance</p>
                    <p className="text-xs text-white/50">Display how far you are</p>
                  </div>
                </div>
                <Switch
                  checked={showDistance}
                  onCheckedChange={setShowDistance}
                />
              </div>
            </div>
          </GlassCard>

          {/* Safety Warning */}
          <GlassCard className="p-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-amber-200 font-medium">Safety Reminder</p>
                <p className="text-xs text-amber-200/70 mt-1">
                  When meeting someone new, always meet in public places first. 
                  Never share personal information like your address until you trust someone.
                  Your safety is your responsibility.
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Save Button */}
          <GlassButton
            variant="primary"
            onClick={handleSave}
            loading={updateProfile.isPending}
            icon={<Save className="w-5 h-5" />}
            className="w-full"
          >
            Save Profile
          </GlassButton>
        </div>
      </div>
      
      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && profile?.avatarUrl && (
          <CameraVerification
            profilePhotoUrl={profile.avatarUrl}
            onVerificationComplete={(verified, confidence) => {
              if (verified) {
                refetchVerification();
              }
              setShowVerificationModal(false);
            }}
            onClose={() => setShowVerificationModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
