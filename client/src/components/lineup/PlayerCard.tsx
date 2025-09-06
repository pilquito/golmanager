import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlayerRef } from '@/stores/useMatchStore';
import { cn } from '@/lib/utils';
import { Check, X, Clock } from 'lucide-react';

interface PlayerCardProps {
  player: PlayerRef;
  isOutOfPosition?: boolean;
  attendanceStatus?: 'pending' | 'confirmed' | 'absent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showAttendanceControls?: boolean;
  onAttendanceChange?: (playerId: string, status: 'confirmed' | 'absent' | 'pending') => void;
  isConfirming?: boolean;
}

const positionColors = {
  'PORTERO': 'bg-yellow-500',
  'DEFENSA': 'bg-blue-500', 
  'MEDIOCENTRO': 'bg-green-500',
  'DELANTERO': 'bg-red-500'
};

const statusIcons = {
  'confirmed': '✓',
  'pending': '⧗', 
  'absent': '✗'
};

const statusColors = {
  'confirmed': 'bg-green-100 text-green-800 border-green-300',
  'pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'absent': 'bg-red-100 text-red-800 border-red-300'
};

export function PlayerCard({ 
  player, 
  isOutOfPosition = false,
  attendanceStatus = 'pending',
  size = 'md',
  className,
  showAttendanceControls = false,
  onAttendanceChange,
  isConfirming = false
}: PlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.playerId,
    data: player
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const positionColor = positionColors[player.playerPosition.toUpperCase() as keyof typeof positionColors] || 'bg-gray-500';
  const sizeClasses = {
    sm: 'h-14 px-2 text-xs',
    md: 'h-16 px-3 text-sm', 
    lg: 'h-18 px-4 text-base'
  };

  const photoSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "relative flex items-center space-x-2 rounded-lg border-2 border-white bg-white/90 dark:bg-gray-800/90 dark:border-gray-600 shadow-sm backdrop-blur-sm cursor-grab active:cursor-grabbing transition-all",
        sizeClasses[size],
        isDragging && "opacity-50 scale-105 shadow-lg",
        className
      )}
      data-testid={`player-card-${player.playerId}`}
    >
      {/* Player Photo */}
      <div className="relative">
        <img
          src={`/api/placeholder-profile-image/${player.playerId}`}
          alt={`Foto de ${player.playerName}`}
          className={cn(
            "rounded-full object-cover border-2 border-gray-200 dark:border-gray-600",
            photoSizes[size]
          )}
        />
        {/* Jersey Number Badge */}
        <div 
          className={cn(
            "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full text-white font-bold text-xs min-w-[18px] h-[18px]",
            positionColor
          )}
        >
          {player.playerNumber}
        </div>
      </div>
      
      {/* Player Name */}
      <div className="flex-1 font-medium text-gray-900 dark:text-gray-100 truncate">
        {player.playerName}
      </div>

      {/* Attendance Controls or Status */}
      {showAttendanceControls ? (
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant={attendanceStatus === 'confirmed' ? 'default' : 'outline'}
            className={cn(
              "w-6 h-6 p-0 rounded-full",
              attendanceStatus === 'confirmed' && "bg-green-500 hover:bg-green-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onAttendanceChange?.(player.playerId, 'confirmed');
            }}
            disabled={isConfirming}
            data-testid={`confirm-attendance-${player.playerId}`}
          >
            <Check className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={attendanceStatus === 'absent' ? 'default' : 'outline'}
            className={cn(
              "w-6 h-6 p-0 rounded-full",
              attendanceStatus === 'absent' && "bg-red-500 hover:bg-red-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onAttendanceChange?.(player.playerId, 'absent');
            }}
            disabled={isConfirming}
            data-testid={`reject-attendance-${player.playerId}`}
          >
            <X className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant={attendanceStatus === 'pending' ? 'default' : 'outline'}
            className={cn(
              "w-6 h-6 p-0 rounded-full",
              attendanceStatus === 'pending' && "bg-yellow-500 hover:bg-yellow-600"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onAttendanceChange?.(player.playerId, 'pending');
            }}
            disabled={isConfirming}
            data-testid={`pending-attendance-${player.playerId}`}
          >
            <Clock className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <div className={cn(
          "flex items-center justify-center w-5 h-5 rounded-full border text-xs font-medium",
          statusColors[attendanceStatus]
        )}>
          {statusIcons[attendanceStatus]}
        </div>
      )}

      {/* Out of Position Badge */}
      {isOutOfPosition && (
        <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1 py-0">
          FP
        </Badge>
      )}
    </div>
  );
}