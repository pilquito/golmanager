import { useDroppable } from '@dnd-kit/core';
import { PlayerCard } from './PlayerCard';
import { Slot, PlayerRef, useMatchStore } from '@/stores/useMatchStore';
import { cn } from '@/lib/utils';

interface LineSlotProps {
  position: string;
  slotIndex?: number;
  slot: Slot;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LineSlot({ position, slotIndex = 0, slot, className, size = 'md' }: LineSlotProps) {
  const { overrideOutOfPosition, attendances } = useMatchStore();
  
  const dropId = slotIndex !== undefined ? `${position}-${slotIndex}` : position;
  const { isOver, setNodeRef } = useDroppable({
    id: dropId,
    data: { position, slotIndex }
  });

  const canAcceptMore = slot.players.length < 2;
  const isEmpty = slot.players.length === 0;

  // Check if players are out of position
  const getPlayerOutOfPosition = (player: PlayerRef) => {
    if (!overrideOutOfPosition) return false;
    
    const playerPos = player.playerPosition.toUpperCase();
    const positionMap: Record<string, string> = {
      'PORTERO': 'POR',
      'DEFENSA': 'DEF', 
      'MEDIOCENTRO': 'MED',
      'DELANTERO': 'DEL'
    };
    
    return positionMap[playerPos] !== position;
  };

  const sizeClasses = {
    sm: 'min-h-[60px] gap-1',
    md: 'min-h-[70px] gap-2', 
    lg: 'min-h-[80px] gap-2'
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-2 transition-all",
        sizeClasses[size],
        isEmpty 
          ? "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50" 
          : "border-gray-400 dark:border-gray-500 bg-white/20 dark:bg-gray-700/20",
        isOver && canAcceptMore && "border-blue-500 bg-blue-50/70 scale-105",
        isOver && !canAcceptMore && "border-red-500 bg-red-50/70",
        className
      )}
      data-testid={`slot-${dropId}`}
    >
      {/* Slot capacity indicator */}
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
        {slot.players.length}
      </div>

      {/* Empty slot placeholder */}
      {isEmpty && (
        <div className="text-gray-400 text-xs font-medium">
          {position}
        </div>
      )}

      {/* Player cards - stacked vertically */}
      <div className="flex flex-col gap-1 w-full">
        {slot.players.map((player, index) => (
          <PlayerCard
            key={player.playerId}
            player={player}
            isOutOfPosition={getPlayerOutOfPosition(player)}
            attendanceStatus={attendances[player.playerId] || 'pending'}
            size={size}
            className={cn(
              index > 0 && "mt-[-4px]", // Slight overlap for stacking effect
              "z-10"
            )}
          />
        ))}
      </div>

      {/* Full slot warning */}
      {!canAcceptMore && isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-lg">
          <span className="text-red-700 text-xs font-medium">¡Completo!</span>
        </div>
      )}
    </div>
  );
}