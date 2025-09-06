import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlayerRef } from '@/stores/useMatchStore';
import { PlayerCard } from './PlayerCard';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: PlayerRef) => void;
  availablePlayers: PlayerRef[];
  position: string;
  title: string;
}

export function PlayerSelectionModal({
  isOpen,
  onClose,
  onSelectPlayer,
  availablePlayers,
  position,
  title
}: PlayerSelectionModalProps) {
  // Filter players by position if not overriding
  const compatiblePlayers = availablePlayers.filter(player => {
    if (position === 'BENCH') return true;
    
    const positionMap: Record<string, string> = {
      'PORTERO': 'POR',
      'DEFENSA': 'DEF',
      'MEDIOCENTRO': 'MED',
      'DELANTERO': 'DEL'
    };
    
    const playerLineupPosition = positionMap[player.playerPosition.toUpperCase()];
    return playerLineupPosition === position;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {compatiblePlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay jugadores disponibles para esta posición</p>
            </div>
          ) : (
            compatiblePlayers.map(player => (
              <div
                key={player.playerId}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors"
                onClick={() => {
                  onSelectPlayer(player);
                  onClose();
                }}
                data-testid={`select-player-${player.playerId}`}
              >
                <PlayerCard
                  player={player}
                  size="sm"
                  className="w-full cursor-pointer"
                  showAttendanceControls={false}
                />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}