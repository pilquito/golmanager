import { useEffect } from 'react';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { MatchTabs } from './MatchTabs';
import { useMatchStore, PlayerRef } from '@/stores/useMatchStore';
import { useAttendanceConfirmation } from '@/hooks/useAttendanceConfirmation';
import { cn } from '@/lib/utils';

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
                playerNumber: (player.jerseyNumber || 0).toString(),
                playerPosition: (player.position || 'DEFENSA').toUpperCase(),
                profileImageUrl: player.profileImageUrl
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

  // Obtener información real del partido desde props o estado
  const [matchInfo, setMatchInfo] = React.useState<any>(null);
  
  React.useEffect(() => {
    const fetchMatch = async () => {
      try {
        const response = await fetch(`/api/matches/${matchId}`);
        if (response.ok) {
          const matchData = await response.json();
          const newMatchInfo = {
            id: matchData.id,
            date: new Date(matchData.date),
            opponent: matchData.opponent,
            venue: matchData.venue,
            competition: matchData.competition,
            status: matchData.status,
            notes: matchData.notes || 'Partido'
          };
          setMatchInfo(newMatchInfo);
        }
      } catch (error) {
        console.error('Error fetching match data:', error);
        // Fallback con datos básicos
        const fallbackMatchInfo = {
          id: matchId,
          date: new Date(),
          opponent: 'Rival FC',
          venue: 'Campo Municipal',
          competition: 'Liga Local',
          status: 'scheduled',
          notes: 'Partido'
        };
        setMatchInfo(fallbackMatchInfo);
      }
    };
    
    if (matchId) {
      fetchMatch();
    }
  }, [matchId]);

  if (!matchInfo) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del partido...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <MatchTabs 
        match={matchInfo}
        players={players}
        onPlayersUpdate={onPlayersUpdate}
        onAttendanceChange={handleAttendanceChange}
        isConfirming={isConfirming}
      />
    </div>
  );
}