import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pitch } from './Pitch';
import { Bench } from './Bench';
import { CallupList } from './CallupList';
import { useMatchStore, PlayerRef } from '@/stores/useMatchStore';
import { useAttendanceConfirmation } from '@/hooks/useAttendanceConfirmation';
import { cn } from '@/lib/utils';
import { RefreshCw, Settings } from 'lucide-react';

interface MatchSheetProps {
  matchId: string;
  players?: any[];
  onPlayersUpdate?: () => void;
  className?: string;
}

export function MatchSheet({ 
  matchId, 
  players = [], 
  onPlayersUpdate,
  className 
}: MatchSheetProps) {
  const { 
    setMatch, 
    overrideOutOfPosition, 
    setOverrideOutOfPosition,
    assignPlayerToSlot,
    canPlaceInSlot,
    resetLineup,
    autoAssignPlayer,
    attendances,
    updateAttendance
  } = useMatchStore();
  
  const { toast } = useToast();
  const { confirmAttendance, isConfirming } = useAttendanceConfirmation();

  // Handle attendance changes from admin controls
  const handleAttendanceChange = (playerId: string, status: 'confirmed' | 'absent' | 'pending') => {
    confirmAttendance({ 
      matchId, 
      playerId, 
      status 
    });
  };

  // Initialize match when component mounts
  useEffect(() => {
    setMatch(matchId);
  }, [matchId, setMatch]);

  // Sync attendances from server and auto-assign confirmed players
  useEffect(() => {
    if (!matchId) return;
    
    // Fetch current attendances for this match
    const fetchAttendances = async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}/attendances`);
        if (response.ok) {
          const serverAttendances = await response.json();
          
          // Update local attendances state
          const attendanceMap: Record<string, 'pending' | 'confirmed' | 'absent'> = {};
          serverAttendances.forEach((attendance: any) => {
            attendanceMap[attendance.userId] = attendance.status;
          });
          
          // Update store with server attendances
          Object.entries(attendanceMap).forEach(([playerId, status]) => {
            updateAttendance(playerId, status);
          });
          
          // Auto-assign confirmed players who aren't already placed
          players.forEach(player => {
            const status = attendanceMap[player.id];
            if (status === 'confirmed') {
              const playerRef: PlayerRef = {
                playerId: player.id,
                playerName: player.name || 'Sin nombre',
                playerNumber: (player.number || '0').toString(),
                playerPosition: (player.position || 'DEFENSA').toUpperCase()
              };
              
              const currentPosition = useMatchStore.getState().findPlayerPosition(player.id);
              if (!currentPosition) {
                autoAssignPlayer(playerRef);
              }
            }
          });
        }
      } catch (error) {
        console.warn('Failed to fetch match attendances:', error);
      }
    };
    
    fetchAttendances();
  }, [matchId, players, autoAssignPlayer, updateAttendance]);


  const handleResetLineup = () => {
    resetLineup();
    toast({
      title: "Alineación reiniciada",
      description: "La alineación ha sido reiniciada",
      variant: "default",
    });
  };

  const handleOverrideToggle = (checked: boolean) => {
    setOverrideOutOfPosition(checked);
    toast({
      title: checked ? "Fuera de posición permitido" : "Posiciones estrictas",
      description: checked 
        ? "Los jugadores pueden ser colocados en cualquier posición" 
        : "Los jugadores solo pueden ir a su posición natural",
      variant: "default",
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-600" />
            <Label htmlFor="override-position" className="text-sm font-medium">
              Permitir fuera de posición
            </Label>
            <Switch
              id="override-position"
              checked={overrideOutOfPosition}
              onCheckedChange={handleOverrideToggle}
              data-testid="toggle-override-position"
            />
          </div>
        </div>
        
        <Button 
          onClick={handleResetLineup}
          variant="outline" 
          size="sm"
          className="flex items-center space-x-2"
          data-testid="button-reset-lineup"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reiniciar</span>
        </Button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pitch - Takes up 3 columns on large screens */}
        <div className="lg:col-span-3">
          <Pitch />
        </div>

        {/* Bench - 1 column on large screens */}
        <div className="lg:col-span-1">
          <Bench />
        </div>
      </div>

      {/* Callup List */}
      <CallupList 
        players={players} 
        showAttendanceControls={true}
        onAttendanceChange={handleAttendanceChange}
        isConfirming={isConfirming}
      />
    </div>
  );
}