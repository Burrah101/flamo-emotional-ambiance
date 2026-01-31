/**
 * FLaMO Voice Screen
 * Voice-activated mode selection using speech-to-text.
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useModeStore } from '../state/modeStore';
import { useUserStore } from '../state/userStore';
import { MODE_DEFINITIONS, ModeDefinition } from '../core/modeDefinitions';
import { AmbientGlow } from '../components/AmbientGlow';
import { GlassCard } from '../components/GlassCard';
import { GlassButton } from '../components/GlassButton';
import { ModeCard } from '../components/ModeCard';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Mic, 
  MicOff,
  Loader2,
  Sparkles
} from 'lucide-react';

// Keywords that map to modes
const MODE_KEYWORDS: Record<string, string[]> = {
  focus: ['focus', 'concentrate', 'work', 'study', 'productive', 'attention'],
  chill: ['chill', 'relax', 'calm', 'easy', 'unwind', 'peaceful'],
  sleep: ['sleep', 'rest', 'tired', 'night', 'bed', 'drowsy'],
  romance: ['romance', 'romantic', 'love', 'intimate', 'together', 'date'],
  bond: ['bond', 'connect', 'close', 'together', 'stable', 'grounded'],
  afterglow: ['afterglow', 'warm', 'fade', 'linger', 'gentle', 'soft'],
};

export default function Voice() {
  const [, navigate] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [suggestedMode, setSuggestedMode] = useState<ModeDefinition | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const recognitionRef = useRef<any>(null);
  
  const enterMode = useModeStore(state => state.enterMode);
  const isPremium = useUserStore(state => state.isPremium);
  const features = useUserStore(state => state.features);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const text = result[0].transcript.toLowerCase();
          setTranscript(text);
          
          if (result.isFinal) {
            processTranscript(text);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setHasPermission(false);
            toast.error('Microphone access denied');
          }
          setIsListening(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  const processTranscript = (text: string) => {
    setIsProcessing(true);
    
    // Find matching mode based on keywords
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    for (const [modeId, keywords] of Object.entries(MODE_KEYWORDS)) {
      const score = keywords.filter(keyword => text.includes(keyword)).length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = modeId;
      }
    }
    
    // Also check for direct mode name mentions
    for (const modeId of Object.keys(MODE_DEFINITIONS)) {
      if (text.includes(modeId)) {
        bestMatch = modeId;
        break;
      }
    }
    
    setTimeout(() => {
      if (bestMatch) {
        const mode = MODE_DEFINITIONS[bestMatch];
        
        // Check premium access
        if (mode.accessLevel === 'premium' && !isPremium) {
          toast.error('Premium mode', {
            description: `${mode.name} requires premium subscription.`,
          });
          setSuggestedMode(null);
        } else {
          setSuggestedMode(mode);
        }
      } else {
        toast.info('No mode matched', {
          description: 'Try saying how you feel or a mode name.',
        });
        setSuggestedMode(null);
      }
      setIsProcessing(false);
    }, 500);
  };
  
  const startListening = async () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }
    
    try {
      setTranscript('');
      setSuggestedMode(null);
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      toast.error('Failed to start listening');
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };
  
  const handleEnterMode = () => {
    if (suggestedMode) {
      enterMode(suggestedMode.id);
      navigate('/experience');
    }
  };
  
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
              <h1 className="text-xl font-medium flamo-text">Voice Mode</h1>
              <p className="text-sm flamo-text-muted">Speak your mood</p>
            </div>
          </div>
        </header>
        
        <main className="px-6 pb-8 flex flex-col items-center">
          {/* Not supported message */}
          {hasPermission === false && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <GlassCard className="p-6 text-center">
                <MicOff className="w-12 h-12 mx-auto mb-4 flamo-text-muted" />
                <h2 className="text-lg font-medium flamo-text mb-2">
                  Voice Not Available
                </h2>
                <p className="text-sm flamo-text-muted">
                  Speech recognition is not supported or microphone access was denied.
                </p>
              </GlassCard>
            </motion.div>
          )}
          
          {/* Voice interface */}
          {hasPermission && (
            <>
              {/* Microphone button */}
              <motion.div
                className="mt-12 mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.button
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                    isListening ? 'flamo-glow-pulse' : ''
                  }`}
                  style={{
                    background: isListening 
                      ? 'linear-gradient(135deg, oklch(0.55 0.18 280 / 0.4), oklch(0.45 0.15 300 / 0.4))'
                      : 'linear-gradient(135deg, oklch(0.20 0.03 280 / 0.3), oklch(0.15 0.02 300 / 0.3))',
                    border: `2px solid ${isListening ? 'oklch(0.65 0.18 280)' : 'oklch(0.35 0.05 280)'}`,
                    boxShadow: isListening 
                      ? '0 0 60px oklch(0.55 0.18 280 / 0.4)'
                      : '0 0 30px oklch(0.30 0.05 280 / 0.2)',
                  }}
                  onClick={isListening ? stopListening : startListening}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isListening ? {
                    scale: [1, 1.05, 1],
                  } : undefined}
                  transition={isListening ? {
                    duration: 1.5,
                    repeat: Infinity,
                    ease: [0.37, 0, 0.63, 1],
                  } : undefined}
                >
                  {isProcessing ? (
                    <Loader2 className="w-12 h-12 flamo-text animate-spin" />
                  ) : isListening ? (
                    <Mic className="w-12 h-12" style={{ color: 'oklch(0.80 0.15 280)' }} />
                  ) : (
                    <Mic className="w-12 h-12 flamo-text-muted" />
                  )}
                </motion.button>
              </motion.div>
              
              {/* Instructions */}
              <motion.p
                className="text-center flamo-text-muted mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isListening 
                  ? 'Listening... say how you feel'
                  : isProcessing
                  ? 'Processing...'
                  : 'Tap to speak'}
              </motion.p>
              
              {/* Transcript display */}
              <AnimatePresence>
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="w-full mb-6"
                  >
                    <GlassCard className="p-4">
                      <p className="text-sm flamo-text-muted mb-1">You said:</p>
                      <p className="flamo-text text-lg">"{transcript}"</p>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Suggested mode */}
              <AnimatePresence>
                {suggestedMode && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 flamo-text-muted" />
                      <p className="text-sm flamo-text-muted">Suggested mode:</p>
                    </div>
                    
                    <ModeCard
                      mode={suggestedMode}
                      onSelect={handleEnterMode}
                      size="lg"
                    />
                    
                    <GlassButton
                      variant="primary"
                      size="lg"
                      className="w-full mt-4"
                      onClick={handleEnterMode}
                    >
                      Enter {suggestedMode.name}
                    </GlassButton>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Example phrases */}
              {!transcript && !suggestedMode && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full"
                >
                  <p className="text-sm flamo-text-muted mb-3">Try saying:</p>
                  <div className="space-y-2">
                    {[
                      '"I need to focus"',
                      '"I want to relax"',
                      '"I feel tired"',
                      '"Something romantic"',
                    ].map((phrase, index) => (
                      <div
                        key={phrase}
                        className="px-4 py-2 rounded-xl bg-white/5 text-sm flamo-text-muted"
                      >
                        {phrase}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
