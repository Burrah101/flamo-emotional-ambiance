/**
 * ProfileGuard - Ensures user has completed profile setup before accessing certain pages
 */

import React from 'react';
import { Redirect } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Loader2 } from 'lucide-react';

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { data: profile, isLoading } = trpc.profile.get.useQuery();

  // Still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Profile not complete - redirect to setup
  if (!profile?.displayName || !profile?.avatarUrl || !profile?.isDiscoverable) {
    return <Redirect to="/setup" />;
  }

  // Profile complete - render children
  return <>{children}</>;
}
