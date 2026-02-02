/**
 * VibeLock Page
 * Sync your energy with others in the same vibe
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, Users, Heart, Sparkles, Radio, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VibeUser {
  id: string;
  name: string;
  avatar: string;
  vibe: string;
  syncLevel: number;
}

const mockVibeUsers: VibeUser[] = [
  { id: "1", name: "Alex", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex", vibe: "Energetic", syncLevel: 92 },
  { id: "2", name: "Jordan", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan", vibe: "Chill", syncLevel: 87 },
  { id: "3", name: "Sam", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam", vibe: "Romantic", syncLevel: 78 },
  { id: "4", name: "Taylor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor", vibe: "Party", syncLevel: 95 },
];

const vibeOptions = [
  { id: "energetic", label: "Energetic", icon: Zap, color: "from-yellow-500 to-orange-500" },
  { id: "chill", label: "Chill", icon: Waves, color: "from-blue-500 to-cyan-500" },
  { id: "romantic", label: "Romantic", icon: Heart, color: "from-pink-500 to-rose-500" },
  { id: "party", label: "Party", icon: Sparkles, color: "from-purple-500 to-pink-500" },
];

export default function VibeLock() {
  const [, setLocation] = useLocation();
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [syncedUsers, setSyncedUsers] = useState<VibeUser[]>([]);

  const handleVibeSelect = (vibeId: string) => {
    setSelectedVibe(vibeId);
  };

  const handleLockVibe = () => {
    if (selectedVibe) {
      setIsLocked(true);
      // Simulate finding synced users
      setTimeout(() => {
        setSyncedUsers(mockVibeUsers.filter(u => Math.random() > 0.3));
      }, 1500);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    setSelectedVibe(null);
    setSyncedUsers([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setLocation("/")}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Radio className="w-5 h-5 text-orange-500" />
            VibeLock
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4"
        >
          <h2 className="text-2xl font-bold mb-2">Sync Your Energy</h2>
          <p className="text-gray-400">
            Lock into a vibe and find others on the same wavelength tonight
          </p>
        </motion.div>

        {/* Vibe Selection */}
        {!isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {vibeOptions.map((vibe) => {
              const Icon = vibe.icon;
              const isSelected = selectedVibe === vibe.id;
              return (
                <motion.button
                  key={vibe.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleVibeSelect(vibe.id)}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? `border-orange-500 bg-gradient-to-br ${vibe.color} bg-opacity-20`
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <Icon className={`w-8 h-8 mx-auto mb-3 ${isSelected ? "text-white" : "text-gray-400"}`} />
                  <span className={`font-semibold ${isSelected ? "text-white" : "text-gray-300"}`}>
                    {vibe.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Lock Button */}
        {!isLocked && selectedVibe && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pt-4"
          >
            <Button
              onClick={handleLockVibe}
              className="w-full py-6 text-lg font-bold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 rounded-2xl"
            >
              <Zap className="w-5 h-5 mr-2" />
              Lock In Your Vibe
            </Button>
          </motion.div>
        )}

        {/* Locked State */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Vibe Indicator */}
            <div className="text-center py-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center mb-4"
              >
                <Radio className="w-12 h-12 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-orange-500">Vibe Locked!</h3>
              <p className="text-gray-400 mt-2">
                Finding others on your wavelength...
              </p>
            </div>

            {/* Synced Users */}
            <AnimatePresence>
              {syncedUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-500" />
                    Synced With You ({syncedUsers.length})
                  </h4>
                  <div className="space-y-3">
                    {syncedUsers.map((user, index) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <h5 className="font-semibold">{user.name}</h5>
                          <p className="text-sm text-gray-400">{user.vibe} vibe</p>
                        </div>
                        <div className="text-right">
                          <span className="text-orange-500 font-bold">{user.syncLevel}%</span>
                          <p className="text-xs text-gray-400">sync</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unlock Button */}
            <Button
              onClick={handleUnlock}
              variant="outline"
              className="w-full py-4 border-white/20 hover:bg-white/10"
            >
              Change Vibe
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
