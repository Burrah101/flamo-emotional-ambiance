/**
 * FLaMO Settings Screen
 * User preferences and account settings.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useUserStore } from '../state/userStore';
import { useModeStore } from '../state/modeStore';
import { AmbientGlow } from '../components/AmbientGlow';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  User,
  Crown,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function Settings() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  
  const isPremium = useUserStore(state => state.isPremium);
  const clearUser = useUserStore(state => state.clearUser);
  
  const modeHistory = useModeStore(state => state.modeHistory);
  
  const handleLogout = async () => {
    try {
      await logout();
      clearUser();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };
  
  const handleClearHistory = () => {
    // Clear mode history from localStorage
    localStorage.removeItem('flamo-mode-store');
    toast.success('History cleared');
    window.location.reload();
  };
  
  const settingsSections: Array<{
    title: string;
    items: Array<{
      icon: React.ComponentType<{ className?: string }>;
      label: string;
      value?: string;
      onClick: () => void;
      highlight?: boolean;
      danger?: boolean;
    }>;
  }> = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          value: user?.name || 'Guest',
          onClick: () => toast.info('Profile settings coming soon'),
        },
        {
          icon: Crown,
          label: 'Subscription',
          value: isPremium ? 'Premium' : 'Free',
          onClick: () => navigate('/premium'),
          highlight: !isPremium,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          value: 'Off',
          onClick: () => toast.info('Notification settings coming soon'),
        },
      ],
    },
    {
      title: 'Privacy',
      items: [
        {
          icon: Shield,
          label: 'Privacy Policy',
          onClick: () => toast.info('Privacy policy coming soon'),
        },
        {
          icon: Trash2,
          label: 'Clear Mode History',
          value: `${modeHistory.length} entries`,
          onClick: handleClearHistory,
          danger: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          onClick: () => toast.info('Help center coming soon'),
        },
      ],
    },
  ];
  
  return (
    <div className="min-h-screen relative">
      <AmbientGlow />
      
      <div className="relative z-10 min-h-screen safe-top safe-bottom">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <motion.button
              className="w-10 h-10 rounded-full flamo-glass-subtle flex items-center justify-center"
              onClick={() => navigate('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 flamo-text" />
            </motion.button>
            <div>
              <h1 className="text-xl font-medium flamo-text">Settings</h1>
              <p className="text-sm flamo-text-muted">Manage your preferences</p>
            </div>
          </div>
        </header>
        
        <main className="px-6 pb-8">
          {/* User card */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <GlassCard className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full flamo-glass flex items-center justify-center">
                    <span className="text-xl font-medium flamo-text">
                      {user?.name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="font-medium flamo-text">{user?.name || 'User'}</h2>
                    <p className="text-sm flamo-text-muted">{user?.email || ''}</p>
                  </div>
                  {isPremium && (
                    <div 
                      className="px-3 py-1 rounded-full"
                      style={{
                        background: 'linear-gradient(135deg, oklch(0.75 0.12 45 / 0.2), oklch(0.65 0.15 25 / 0.2))',
                      }}
                    >
                      <span className="text-xs font-medium" style={{ color: 'oklch(0.85 0.10 45)' }}>
                        Premium
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
          
          {/* Settings sections */}
          {settingsSections.map((section, sectionIndex) => (
            <motion.section
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + sectionIndex * 0.05 }}
              className="mb-6"
            >
              <h3 className="text-sm font-medium flamo-text-muted mb-3 uppercase tracking-wider">
                {section.title}
              </h3>
              <GlassCard className="overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <motion.button
                    key={item.label}
                    className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                      itemIndex !== section.items.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                    onClick={item.onClick}
                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <item.icon 
                      className={`w-5 h-5 ${'danger' in item && item.danger ? 'text-red-400' : 'flamo-text-muted'}`} 
                    />
                    <div className="flex-1">
                      <span className={`${'danger' in item && item.danger ? 'text-red-400' : 'flamo-text'}`}>
                        {item.label}
                      </span>
                    </div>
                    {item.value && (
                      <span className={`text-sm ${'highlight' in item && item.highlight ? 'text-amber-400' : 'flamo-text-muted'}`}>
                        {item.value}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 flamo-text-muted" />
                  </motion.button>
                ))}
              </GlassCard>
            </motion.section>
          ))}
          
          {/* Logout button */}
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassButton
                variant="ghost"
                size="lg"
                className="w-full"
                onClick={handleLogout}
                icon={<LogOut className="w-5 h-5" />}
              >
                Sign Out
              </GlassButton>
            </motion.div>
          )}
          
          {/* App info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-sm flamo-text-muted">FLaMO v1.0.0</p>
            <p className="text-xs flamo-text-muted mt-1">
              Share presence. Not words.
            </p>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
