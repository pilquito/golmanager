import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlayerRef } from '@/stores/useMatchStore';
import { PlayerCard } from './PlayerCard';

interface PlayerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: PlayerRef) => void;
  availablePlayers: PlayerRef[];
  position: string;
  title: string;
  currentPlayer?: PlayerRef | null; // Jugador actual en el slot (para sustitución)
  onMoveToBench?: () => void; // Función para mover al banquillo sin sustitución
  overrideOutOfPosition?: boolean; // Para filtrar jugadores según compatibilidad
}

export function PlayerSelectionModal({
  isOpen,
  onClose,
  onSelectPlayer,
  availablePlayers,
  position,
  title,
  currentPlayer,
  onMoveToBench,
  overrideOutOfPosition = false
}: PlayerSelectionModalProps) {
  // Filter players by position if not overriding
  const compatiblePlayers = availablePlayers.filter(player => {
    if (position === 'BENCH') return true;
    
    // Si no hay jugador actual (slot vacío), mostrar TODOS los jugadores
    if (!currentPlayer) return true;
    
    // Si hay jugador actual (sustitución) y override está habilitado, mostrar todos
    if (overrideOutOfPosition) return true;
    
    // Si hay jugador actual (sustitución) y override NO está habilitado, filtrar por posición
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
        
        {/* Mostrar jugador actual si es para sustitución */}
        {currentPlayer && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border">
            <h3 className="text-sm font-medium mb-2 text-blue-900 dark:text-blue-100">Jugador actual:</h3>
            <PlayerCard
              player={currentPlayer}
              size="sm"
              className="w-full"
              showAttendanceControls={false}
            />
            {onMoveToBench && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onMoveToBench();
                  onClose();
                }}
                className="mt-2 w-full"
                data-testid="button-move-to-bench"
              >
                Mover al banquillo
              </Button>
            )}
          </div>
        )}
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {compatiblePlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{currentPlayer ? 'No hay jugadores disponibles para sustituir' : 'No hay jugadores disponibles para esta posición'}</p>
            </div>
          ) : (
            <>
              {currentPlayer && (
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seleccionar sustituto:
                </h4>
              )}
            
              {compatiblePlayers.map(player => (
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
              ))}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}