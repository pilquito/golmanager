import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { PlayerRef } from '@/stores/useMatchStore';
import { cn } from '@/lib/utils';

interface PlayerCardProps {
  player: PlayerRef;
  isOutOfPosition?: boolean;
  attendanceStatus?: 'pending' | 'confirmed' | 'absent';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
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
  className 
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
    sm: 'h-12 px-2 text-xs',
    md: 'h-14 px-3 text-sm',
    lg: 'h-16 px-4 text-base'
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
      {/* Jersey Number */}
      <div 
        className={cn(
          "flex items-center justify-center rounded-full text-white font-bold min-w-[24px] h-6",
          positionColor
        )}
      >
        {player.playerNumber}
      </div>
      
      {/* Player Name */}
      <div className="flex-1 font-medium text-gray-900 truncate">
        {player.playerName}
      </div>

      {/* Attendance Status */}
      <div className={cn(
        "flex items-center justify-center w-5 h-5 rounded-full border text-xs font-medium",
        statusColors[attendanceStatus]
      )}>
        {statusIcons[attendanceStatus]}
      </div>

      {/* Out of Position Badge */}
      {isOutOfPosition && (
        <Badge variant="destructive" className="absolute -top-1 -right-1 text-xs px-1 py-0">
          FP
        </Badge>
      )}
    </div>
  );
}