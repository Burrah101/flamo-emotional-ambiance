/**
 * FLaMO Camera Verification Component
 * Captures a live photo and compares with profile photo for verification.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  X, 
  Shield,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface CameraVerificationProps {
  profilePhotoUrl: string | null;
  onVerificationComplete: (verified: boolean, confidenceScore: number) => void;
  onClose: () => void;
}

export function CameraVerification({ 
  profilePhotoUrl, 
  onVerificationComplete, 
  onClose 
}: CameraVerificationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidence: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const verifyMutation = trpc.profile.verify.useMutation();
  
  // Start camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);
  
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error('[Camera] Error accessing camera:', err);
      setError('Unable to access camera. Please grant permission and try again.');
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };
  
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw mirrored image (selfie mode)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    
    // Get data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
  }, []);
  
  const retakePhoto = () => {
    setCapturedImage(null);
    setVerificationResult(null);
  };
  
  const verifyPhoto = async () => {
    if (!capturedImage || !profilePhotoUrl) return;
    
    setIsVerifying(true);
    
    try {
      // Convert data URL to base64
      const base64Data = capturedImage.split(',')[1];
      
      const result = await verifyMutation.mutateAsync({
        verificationPhotoBase64: base64Data,
        profilePhotoUrl,
      });
      
      setVerificationResult({
        verified: result.verified,
        confidence: result.confidenceScore,
      });
      
      if (result.verified) {
        toast.success('Verification successful!', {
          description: 'Your profile is now verified.',
        });
      } else {
        toast.error('Verification failed', {
          description: 'The photos don\'t appear to match. Please try again.',
        });
      }
      
      onVerificationComplete(result.verified, result.confidenceScore);
    } catch (err) {
      console.error('[Verification] Error:', err);
      toast.error('Verification failed', {
        description: 'Please try again later.',
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        className="relative w-full max-w-md"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flamo-glass-subtle flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-medium flamo-text">Verify Your Photo</h2>
                <p className="text-xs flamo-text-muted">
                  Take a selfie to verify your profile
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flamo-glass-subtle flex items-center justify-center"
            >
              <X className="w-4 h-4 flamo-text-muted" />
            </button>
          </div>
          
          {/* Error state */}
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
              <GlassButton
                onClick={startCamera}
                className="mt-3 w-full"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Try Again
              </GlassButton>
            </div>
          )}
          
          {/* Camera / Captured image */}
          {!error && (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 bg-black/50">
              {/* Video preview */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${capturedImage ? 'hidden' : ''}`}
                style={{ transform: 'scaleX(-1)' }}
                playsInline
                muted
              />
              
              {/* Captured image */}
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Loading overlay */}
              {!cameraReady && !capturedImage && !error && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin flamo-text-muted" />
                </div>
              )}
              
              {/* Face guide overlay */}
              {cameraReady && !capturedImage && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div 
                    className="w-48 h-60 rounded-full border-2 border-white/30"
                    style={{
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
              )}
              
              {/* Verification result overlay */}
              <AnimatePresence>
                {verificationResult && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      background: verificationResult.verified 
                        ? 'rgba(34, 197, 94, 0.3)' 
                        : 'rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      verificationResult.verified ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {verificationResult.verified ? (
                        <Check className="w-10 h-10 text-white" />
                      ) : (
                        <X className="w-10 h-10 text-white" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          
          {/* Profile photo comparison */}
          {profilePhotoUrl && (
            <div className="flex items-center gap-4 mb-4 p-3 rounded-xl flamo-glass-subtle">
              <img
                src={profilePhotoUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="text-sm flamo-text">Your profile photo</p>
                <p className="text-xs flamo-text-muted">
                  We'll compare your selfie with this photo
                </p>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3">
            {!capturedImage ? (
              <GlassButton
                onClick={capturePhoto}
                disabled={!cameraReady || !!error}
                className="flex-1 py-3"
                icon={<Camera className="w-5 h-5" />}
              >
                Take Photo
              </GlassButton>
            ) : (
              <>
                <GlassButton
                  onClick={retakePhoto}
                  className="flex-1 py-3"
                  icon={<RefreshCw className="w-5 h-5" />}
                >
                  Retake
                </GlassButton>
                <GlassButton
                  onClick={verifyPhoto}
                  disabled={isVerifying || !!verificationResult}
                  className="flex-1 py-3"
                  icon={isVerifying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                >
                  {isVerifying ? 'Verifying...' : 'Verify'}
                </GlassButton>
              </>
            )}
          </div>
          
          {/* Privacy note */}
          <p className="text-xs text-center flamo-text-muted mt-4">
            Your verification photo is only used for comparison and is not stored.
          </p>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
