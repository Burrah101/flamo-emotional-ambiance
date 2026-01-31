/**
 * FLaMO Avatar Component
 * Displays user avatar with fallback and optional upload capability.
 */

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, User } from 'lucide-react';
import { VerificationBadge } from './VerificationBadge';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showOnlineIndicator?: boolean;
  isVerified?: boolean;
  showVerificationBadge?: boolean;
  editable?: boolean;
  onPhotoChange?: (url: string) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

const onlineIndicatorSizes = {
  sm: 'w-2 h-2 right-0 bottom-0',
  md: 'w-3 h-3 right-0 bottom-0',
  lg: 'w-4 h-4 right-0.5 bottom-0.5',
  xl: 'w-5 h-5 right-1 bottom-1',
};

const verificationBadgeSizes = {
  sm: { size: 'sm' as const, position: '-right-0.5 -top-0.5' },
  md: { size: 'sm' as const, position: '-right-0.5 -top-0.5' },
  lg: { size: 'md' as const, position: '-right-1 -top-1' },
  xl: { size: 'lg' as const, position: '-right-1 -top-1' },
};

export function Avatar({
  src,
  name,
  size = 'md',
  isOnline,
  showOnlineIndicator = false,
  isVerified = false,
  showVerificationBadge = false,
  editable = false,
  onPhotoChange,
  className = '',
}: AvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.profilePhoto.useMutation({
    onSuccess: (result) => {
      if (result.success && result.url) {
        toast.success('Photo updated!');
        onPhotoChange?.(result.url);
      } else {
        toast.error(result.error || 'Failed to upload photo');
      }
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error('Upload failed: ' + error.message);
      setIsUploading(false);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please select a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      uploadMutation.mutate({
        base64Data,
        mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
      });
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
  };

  const handleClick = () => {
    if (editable && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Get initials from name
  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const showImage = src && !imageError;

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        className={`
          ${sizeClasses[size]}
          rounded-full overflow-hidden
          bg-gradient-to-br from-violet-500/30 to-pink-500/30
          flex items-center justify-center
          ${editable ? 'cursor-pointer hover:opacity-80' : ''}
          transition-opacity
        `}
        onClick={handleClick}
        whileTap={editable ? { scale: 0.95 } : undefined}
      >
        {isUploading ? (
          <Loader2 className="w-1/2 h-1/2 text-white/70 animate-spin" />
        ) : showImage ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="font-semibold text-white/80">{initials}</span>
        )}

        {/* Edit overlay */}
        {editable && !isUploading && (
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
            <Camera className="w-1/3 h-1/3 text-white" />
          </div>
        )}
      </motion.div>

      {/* Online indicator */}
      {showOnlineIndicator && (
        <span
          className={`
            absolute ${onlineIndicatorSizes[size]}
            rounded-full border-2 border-[#0a0a12]
            ${isOnline ? 'bg-emerald-400' : 'bg-slate-400'}
          `}
        />
      )}

      {/* Verification badge */}
      {showVerificationBadge && isVerified && (
        <div className={`absolute ${verificationBadgeSizes[size].position}`}>
          <VerificationBadge size={verificationBadgeSizes[size].size} />
        </div>
      )}

      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}
    </div>
  );
}

/**
 * Avatar group for showing multiple avatars
 */
interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string | null;
    isOnline?: boolean;
  }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const overlapClass = {
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
  };

  return (
    <div className="flex items-center">
      {visible.map((avatar, index) => (
        <div
          key={index}
          className={index > 0 ? overlapClass[size] : ''}
          style={{ zIndex: visible.length - index }}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            size={size}
            isOnline={avatar.isOnline}
            showOnlineIndicator
          />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${sizeClasses[size]} ${overlapClass[size]}
            rounded-full bg-white/10 border-2 border-[#0a0a12]
            flex items-center justify-center
          `}
          style={{ zIndex: 0 }}
        >
          <span className="text-white/70 font-medium">+{remaining}</span>
        </div>
      )}
    </div>
  );
}
