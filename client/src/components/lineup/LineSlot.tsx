import { useState } from 'react';
import { PlayerCard } from './PlayerCard';
import { Slot, PlayerRef, useMatchStore } from '@/stores/useMatchStore';
import { PlayerSelectionModal } from './PlayerSelectionModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface LineSlotProps {
  position: string;
  slotIndex?: number;
  slot: Slot;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'lineup11' | 'lineup11-gk';
  players: any[]; // Lista completa de jugadores para seleccionar
}

export function LineSlot({ position, slotIndex = 0, slot, className, size = 'md', players }: LineSlotProps) {
  const { overrideOutOfPosition, attendances, assignPlayerToSlot, moveToBench, getAvailableBenchPlayers } = useMatchStore();
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const { toast } = useToast();
  
  const isEmpty = slot.player === null;

  // Obtener jugadores disponibles del banquillo
  const availablePlayers = getAvailableBenchPlayers();

  // Manejar clic en posición vacía - abrir modal para seleccionar jugador
  const handleEmptySlotClick = () => {
    if (isEmpty) {
      if (availablePlayers.length > 0) {
        setShowPlayerModal(true);
      } else {
        toast({
          title: "Banquillo vacío",
          description: "No hay jugadores disponibles en el banquillo para asignar a esta posición.",
          variant: "destructive"
        });
      }
    }
  };

  // Manejar clic en jugador existente - abrir modal para sustituir o mover al banquillo
  const handlePlayerClick = () => {
    if (slot.player) {
      // Abrir modal para sustituir el jugador o moverlo al banquillo
      setShowPlayerModal(true);
    }
  };

  // Manejar selección de jugador del modal
  const handlePlayerSelection = (selectedPlayer: PlayerRef) => {
    if (isEmpty) {
      // Slot vacío: asignar jugador
      assignPlayerToSlot(selectedPlayer, position, slotIndex);
      toast({
        title: "Jugador asignado",
        description: `${selectedPlayer.playerName} ha sido asignado a la posición ${position}.`,
        variant: "default"
      });
    } else {
      // Slot ocupado: hacer sustitución usando swap
      try {
        const { swapPlayerWithBench } = useMatchStore.getState();
        const success = swapPlayerWithBench(slot.player!.playerId, selectedPlayer.playerId);
        if (success) {
        toast({
          title: "Sustitución realizada",
          description: `${selectedPlayer.playerName} ha sustituido a ${slot.player!.playerName}.`,
          variant: "default"
        });
      } else {
          toast({
            title: "Sustitución fallida",
            description: `No se puede sustituir: ${selectedPlayer.playerName} no es compatible con la posición ${position}.`,
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo realizar la sustitución",
          variant: "destructive"
        });
      }
    }
  };

  // Función para mover el jugador actual al banquillo (sin sustitución)
  const handleMoveToBench = () => {
    if (slot.player) {
      moveToBench(slot.player.playerId);
    }
  };

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

  // LINEUP11 Style - No visible slot borders, just the shirts
  const isLineup11Style = size === 'lineup11' || size === 'lineup11-gk';
  
  const sizeClasses = {
    sm: 'min-h-[60px] gap-1',
    md: 'min-h-[70px] gap-2', 
    lg: 'min-h-[80px] gap-2',
    lineup11: 'min-h-[80px] gap-2',
    'lineup11-gk': 'min-h-[90px] gap-2'
  };

  return (
    <>
      <div
        className={cn(
          "relative flex flex-col items-center justify-center transition-all cursor-pointer",
          sizeClasses[size],
          // LINEUP11 style has no visible borders when empty, just transparent
          isLineup11Style
            ? "border-2 border-transparent rounded-lg p-2"
            : "rounded-lg border-2 border-dashed p-2",
          !isLineup11Style && isEmpty && "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50",
          !isLineup11Style && !isEmpty && "border-gray-400 dark:border-gray-500 bg-white/20 dark:bg-gray-700/20 hover:bg-white/30",
          className
        )}
        onClick={isEmpty ? handleEmptySlotClick : handlePlayerClick}
        data-testid={`slot-${position}-${slotIndex}`}
      >
      {/* Slot capacity indicator - Hide for LINEUP11 style */}
      {!isLineup11Style && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
          {slot.player ? 1 : 0}
        </div>
      )}

      {/* Empty slot placeholder - Different for LINEUP11 style */}
      {isEmpty && (
        <div className="text-gray-400 text-xs font-medium text-center">
          {isLineup11Style ? (
            // LINEUP11 style empty slot - minimal
            <div className="w-12 h-16 mx-auto bg-white/20 rounded-lg border-2 border-dashed border-white/40 flex items-center justify-center">
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
            </div>
          ) : (
            // Original style
            <>
              <div className="w-8 h-8 mx-auto mb-1 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"></div>
              </div>
              <div>{position}</div>
            </>
          )}
        </div>
      )}

      {/* Player card - single player per slot */}
      {slot.player && (
        <div className="w-full">
          <PlayerCard
            key={slot.player.playerId}
            player={slot.player}
            isOutOfPosition={getPlayerOutOfPosition(slot.player)}
            attendanceStatus={attendances[slot.player.playerId] || 'pending'}
            size={isLineup11Style ? 'lineup11' : size}
            className="z-10"
          />
        </div>
      )}

      </div>
      
      <PlayerSelectionModal
        isOpen={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onSelectPlayer={handlePlayerSelection}
        availablePlayers={availablePlayers}
        position={position}
        title={isEmpty ? "Seleccionar jugador" : "Sustituir jugador"}
        currentPlayer={slot.player}
        onMoveToBench={handleMoveToBench}
        overrideOutOfPosition={overrideOutOfPosition}
      />
    </>
    );
}