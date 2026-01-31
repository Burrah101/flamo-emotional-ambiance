/**
 * FLaMO Invite Screen
 * Create and share presence invites.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useSearch } from 'wouter';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { MODE_DEFINITIONS } from '../core/modeDefinitions';
import { AmbientGlow } from '../components/AmbientGlow';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { ModeCard } from '../components/ModeCard';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { 
  ArrowLeft, 
  Link2, 
  Copy, 
  Check,
  QrCode,
  Share2,
  Users
} from 'lucide-react';

export default function Invite() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  const { isAuthenticated } = useAuth();
  
  const currentModeId = useModeStore(state => state.currentModeId);
  const enterMode = useModeStore(state => state.enterMode);
  const startSharedSession = useModeStore(state => state.startSharedSession);
  const joinSharedSession = useModeStore(state => state.joinSharedSession);
  
  const isPremium = useUserStore(state => state.isPremium);
  const features = useUserStore(state => state.features);
  
  // Check for join parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const joinSession = params.get('join');
    const joinMode = params.get('mode');
    
    if (joinSession && joinMode) {
      handleJoinSession(joinSession, joinMode);
    }
  }, [searchString]);
  
  // Use current mode if in experience
  useEffect(() => {
    if (currentModeId && !selectedModeId) {
      setSelectedModeId(currentModeId);
    }
  }, [currentModeId]);
  
  const handleJoinSession = async (sessionId: string, modeId: string) => {
    setIsJoining(true);
    
    try {
      // Simulate joining delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mode = MODE_DEFINITIONS[modeId];
      if (!mode) {
        toast.error('Invalid mode');
        return;
      }
      
      // Check if mode requires premium
      if (mode.accessLevel === 'premium' && !isPremium) {
        toast.error('Premium required', {
          description: 'This mode requires a premium subscription.',
        });
        navigate('/premium');
        return;
      }
      
      // Join the session
      joinSharedSession(sessionId, 'partner-' + nanoid(6));
      enterMode(modeId);
      
      toast.success('Joined presence', {
        description: `You're now in ${mode.name} mode together.`,
      });
      
      navigate('/experience');
    } catch (error) {
      toast.error('Failed to join');
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleCreateInvite = () => {
    if (!selectedModeId) {
      toast.error('Select a mode first');
      return;
    }
    
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    const sessionId = nanoid(10);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/invite?join=${sessionId}&mode=${selectedModeId}`;
    
    setInviteLink(link);
    startSharedSession(sessionId);
    
    // Enter the mode
    enterMode(selectedModeId);
  };
  
  const handleCopyLink = async () => {
    if (!inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };
  
  const handleShare = async () => {
    if (!inviteLink) return;
    
    const mode = selectedModeId ? MODE_DEFINITIONS[selectedModeId] : null;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my FLaMO mode',
          text: `Join me in ${mode?.name || 'a'} mode on FLaMO. We don't need to talk. Just join my mode.`,
          url: inviteLink,
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };
  
  const handleGoToExperience = () => {
    navigate('/experience');
  };
  
  // Get accessible modes
  const accessibleModes = Object.values(MODE_DEFINITIONS).filter(mode => {
    if (mode.accessLevel === 'free') return true;
    return isPremium;
  });
  
  return (
    <div className="min-h-screen relative">
      <AmbientGlow />
      
      <div className="relative z-10 min-h-screen safe-top safe-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 rounded-full flamo-glass-subtle flex items-center justify-center"
              onClick={() => navigate(currentModeId ? '/experience' : '/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 flamo-text" />
            </motion.button>
            <div>
              <h1 className="text-xl font-medium flamo-text">Share Presence</h1>
              <p className="text-sm flamo-text-muted">Invite someone to join</p>
            </div>
          </div>
        </header>
        
        <main className="px-6 pb-8">
          {/* Joining state */}
          {isJoining && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                className="w-16 h-16 rounded-full flamo-glass flex items-center justify-center mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Users className="w-8 h-8 flamo-text" />
              </motion.div>
              <p className="flamo-text">Joining presence...</p>
            </motion.div>
          )}
          
          {/* Premium required message */}
          {!features.sharedPresence && !isJoining && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 flamo-text-muted" />
                <h2 className="text-lg font-medium flamo-text mb-2">
                  Premium Feature
                </h2>
                <p className="text-sm flamo-text-muted mb-4">
                  Shared presence requires a premium subscription.
                </p>
                <GlassButton
                  variant="primary"
                  onClick={() => navigate('/premium')}
                >
                  Upgrade to Premium
                </GlassButton>
              </GlassCard>
            </motion.div>
          )}
          
          {/* Invite creation flow */}
          {features.sharedPresence && !isJoining && (
            <>
              {/* Invite link generated */}
              {inviteLink ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <GlassCard className="p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full flamo-glass flex items-center justify-center">
                        <Link2 className="w-5 h-5 flamo-text" />
                      </div>
                      <div>
                        <h2 className="font-medium flamo-text">Invite Ready</h2>
                        <p className="text-sm flamo-text-muted">Share this link</p>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-xl bg-white/5 mb-4">
                      <p className="text-sm flamo-text break-all font-mono">
                        {inviteLink}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <GlassButton
                        variant="secondary"
                        className="flex-1"
                        onClick={handleCopyLink}
                        icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </GlassButton>
                      <GlassButton
                        variant="primary"
                        className="flex-1"
                        onClick={handleShare}
                        icon={<Share2 className="w-4 h-4" />}
                      >
                        Share
                      </GlassButton>
                    </div>
                  </GlassCard>
                  
                  <GlassButton
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={handleGoToExperience}
                  >
                    Enter Experience
                  </GlassButton>
                  
                  <p className="text-sm text-center flamo-text-muted mt-4">
                    Waiting for someone to join...
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Mode selection */}
                  <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6"
                  >
                    <h3 className="text-sm font-medium flamo-text-muted mb-4 uppercase tracking-wider">
                      Select a Mode to Share
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {accessibleModes.map((mode) => (
                        <motion.div
                          key={mode.id}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div
                            className={`relative ${selectedModeId === mode.id ? 'ring-2 ring-offset-2 ring-offset-transparent rounded-[20px]' : ''}`}
                            style={{
                              // @ts-ignore
                              '--tw-ring-color': mode.colorProfile.glow,
                            }}
                            onClick={() => setSelectedModeId(mode.id)}
                          >
                            <ModeCard
                              mode={mode}
                              onSelect={() => setSelectedModeId(mode.id)}
                              size="sm"
                            />
                            {selectedModeId === mode.id && (
                              <motion.div
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                                style={{ background: mode.colorProfile.glow }}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                  
                  {/* Create invite button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <GlassButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleCreateInvite}
                      disabled={!selectedModeId}
                      icon={<Link2 className="w-5 h-5" />}
                    >
                      Create Invite Link
                    </GlassButton>
                  </motion.div>
                  
                  {/* Info */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-center flamo-text-muted mt-6"
                  >
                    We don't need to talk.
                    <br />
                    Just join my mode.
                  </motion.p>
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
