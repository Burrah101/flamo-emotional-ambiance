import { useState } from 'react';
import { Clock, Bookmark, Sparkles, Moon, Heart, X, Check } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Permission {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
  duration?: string;
}

const PERMISSIONS: Permission[] = [
  {
    id: 'stay_longer',
    name: 'Stay Longer',
    description: 'Extend your current session by 2 more hours',
    price: 299,
    icon: <Clock className="w-6 h-6" />,
    gradient: 'from-[#00D4FF] to-[#4A90D9]',
    glow: 'rgba(0, 212, 255, 0.3)',
    duration: '+2 hours',
  },
  {
    id: 'return_once',
    name: 'Return Once',
    description: 'Bookmark this moment and return to it anytime',
    price: 199,
    icon: <Bookmark className="w-6 h-6" />,
    gradient: 'from-[#FFB800] to-[#FF6A00]',
    glow: 'rgba(255, 184, 0, 0.3)',
  },
  {
    id: 'private_signal',
    name: 'Send a Private Signal',
    description: 'Let someone know you\'re thinking of them with a soft glow',
    price: 99,
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-[#FF69B4] to-[#9B59B6]',
    glow: 'rgba(255, 105, 180, 0.3)',
  },
  {
    id: 'unlock_tonight',
    name: 'Unlock Tonight',
    description: 'Access all intimate modes until sunrise',
    price: 499,
    icon: <Moon className="w-6 h-6" />,
    gradient: 'from-[#9B59B6] to-[#4A90D9]',
    glow: 'rgba(155, 89, 182, 0.3)',
    duration: 'Until sunrise',
  },
  {
    id: 'deeper_access',
    name: 'Deeper Access',
    description: 'Full belonging to all modes and features',
    price: 699,
    icon: <Heart className="w-6 h-6" />,
    gradient: 'from-[#FF2B2B] to-[#FF6A00]',
    glow: 'rgba(255, 43, 43, 0.3)',
    duration: 'Monthly',
  },
];

interface EmotionalPermissionsProps {
  onClose: () => void;
  currentModeId?: string;
  targetUserId?: number;
}

export default function EmotionalPermissions({ 
  onClose, 
  currentModeId,
  targetUserId 
}: EmotionalPermissionsProps) {
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const purchasePermission = trpc.permissions.purchase.useMutation({
    onSuccess: () => {
      toast.success(`${selectedPermission?.name} unlocked! ✨`);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Something went wrong');
      setIsProcessing(false);
    },
  });

  const handlePurchase = async () => {
    if (!selectedPermission) return;
    
    setIsProcessing(true);
    purchasePermission.mutate({
      permissionType: selectedPermission.id,
      targetModeId: currentModeId,
      targetUserId,
    });
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="flamo-glass w-full max-w-lg max-h-[90vh] overflow-hidden flamo-bounce-in">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-2xl font-bold text-white">Emotional Permissions</h2>
          <p className="text-white/50 mt-1">Not features. Feelings.</p>
        </div>

        {/* Permissions list */}
        <div className="p-4 space-y-3 max-h-[50vh] overflow-y-auto hide-scrollbar">
          {PERMISSIONS.map((permission, index) => (
            <button
              key={permission.id}
              onClick={() => setSelectedPermission(permission)}
              className={`w-full p-4 rounded-2xl border transition-all duration-300 text-left flamo-stagger-${index + 1} ${
                selectedPermission?.id === permission.id
                  ? 'bg-white/10 border-white/30 scale-[1.02]'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }`}
              style={{
                boxShadow: selectedPermission?.id === permission.id 
                  ? `0 0 30px ${permission.glow}` 
                  : 'none',
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${permission.gradient} flex items-center justify-center flex-shrink-0`}
                  style={{
                    boxShadow: `0 4px 20px ${permission.glow}`,
                  }}
                >
                  {permission.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-semibold">{permission.name}</h3>
                    <span className="text-[#FFB800] font-bold">{formatPrice(permission.price)}</span>
                  </div>
                  <p className="text-white/50 text-sm mt-1">{permission.description}</p>
                  {permission.duration && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-white/10 rounded-full text-white/60 text-xs">
                      {permission.duration}
                    </span>
                  )}
                </div>
                {selectedPermission?.id === permission.id && (
                  <Check className="w-5 h-5 text-[#00E5A0] flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Purchase button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handlePurchase}
            disabled={!selectedPermission || isProcessing}
            className={`w-full py-4 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2 ${
              selectedPermission
                ? `bg-gradient-to-r ${selectedPermission.gradient} text-white hover:scale-[1.02] hover:shadow-lg`
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
            style={{
              boxShadow: selectedPermission ? `0 8px 30px ${selectedPermission.glow}` : 'none',
            }}
          >
            {isProcessing ? (
              <div className="flamo-spinner w-6 h-6" />
            ) : selectedPermission ? (
              <>
                {selectedPermission.icon}
                <span>Unlock {selectedPermission.name}</span>
              </>
            ) : (
              <span>Select a permission</span>
            )}
          </button>
          
          <p className="text-center text-white/30 text-xs mt-3">
            Permission, not payment. Your vibe, your choice.
          </p>
        </div>
      </div>
    </div>
  );
}
