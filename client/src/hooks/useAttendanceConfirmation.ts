import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMatchStore } from "@/stores/useMatchStore";
import { useAuth } from "@/hooks/useAuth";

export function useAttendanceConfirmation() {
  const { toast } = useToast();
  const { updateAttendance } = useMatchStore();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const confirmAttendanceMutation = useMutation({
    mutationFn: async ({ 
      matchId, 
      playerId, 
      status 
    }: { 
      matchId: string; 
      playerId: string; 
      status: 'confirmed' | 'absent' | 'pending'; 
    }) => {
      console.log(`🔧 ${isAdmin ? 'Admin' : 'Jugador'} cambiando asistencia:`, { matchId, playerId, status });
      
      if (isAdmin) {
        // Admin puede cambiar la asistencia de cualquier jugador
        return apiRequest("/api/admin/attendances", "POST", {
          matchId,
          playerId,
          status,
        });
      } else {
        // Jugador solo puede cambiar su propia asistencia
        return apiRequest("/api/attendances", "POST", {
          matchId,
          status,
        });
      }
    },
    onMutate: async ({ matchId, playerId, status }) => {
      // Cancelar queries en progreso con query key segmentado
      await queryClient.cancelQueries({ 
        queryKey: ['/api/matches', matchId, 'attendances'] 
      });
      
      // Snapshot del estado anterior
      const previousAttendances = queryClient.getQueryData([
        '/api/matches', matchId, 'attendances'
      ]);
      const previousStoreState = useMatchStore.getState().attendances[playerId];
      
      // Actualizar el store optimistamente (para UI inmediato)
      updateAttendance(playerId, status);
      
      // Actualización optimista de la caché de React Query
      queryClient.setQueryData(['/api/matches', matchId, 'attendances'], (old: any) => {
        if (!old) return [];
        
        // Buscar si ya existe la asistencia
        const existingIndex = old.findIndex((att: any) => att.userId === playerId);
        
        if (existingIndex >= 0) {
          // Actualizar existente
          const updated = [...old];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status,
            confirmedAt: new Date().toISOString(),
          };
          return updated;
        } else {
          // Crear nueva
          return [...old, {
            id: 'temp-' + Date.now(),
            matchId,
            userId: playerId,
            status,
            confirmedAt: new Date().toISOString(),
          }];
        }
      });
      
      return { previousAttendances, previousStoreState };
    },
    onSuccess: (data, variables) => {
      const statusMessages = {
        confirmed: "Asistencia confirmada",
        absent: "Marcado como ausente", 
        pending: "Marcado como pendiente"
      };

      const adminPrefix = isAdmin ? "(Admin) " : "";
      toast({
        title: "✓ Estado actualizado",
        description: `${adminPrefix}${statusMessages[variables.status]}`,
      });
    },
    onError: (error, variables, context) => {
      // Revertir cambios optimistas en React Query
      if (context?.previousAttendances) {
        queryClient.setQueryData([
          '/api/matches', variables.matchId, 'attendances'
        ], context.previousAttendances);
      }
      
      // Revertir cambios optimistas en el store
      if (context?.previousStoreState !== undefined) {
        updateAttendance(variables.playerId, context.previousStoreState);
      }
      
      console.error("❌ Error updating attendance:", error);
      
      // Error específico para perfil de jugador no encontrado (solo para no-admins)
      if (!isAdmin && error instanceof Error && error.message.includes('Player profile not found')) {
        toast({
          title: "Perfil no encontrado",
          description: "No tienes un perfil de jugador asociado. Solo los jugadores pueden cambiar su asistencia.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: "No se pudo actualizar la asistencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      // Refrescar data desde el servidor con query key segmentado
      queryClient.invalidateQueries({ 
        queryKey: ['/api/matches', variables.matchId, 'attendances'] 
      });
      
      // Si el jugador fue confirmado, forzar auto-asignación
      if (!error && variables.status === 'confirmed') {
        setTimeout(() => {
          // Encontrar el jugador para auto-asignar
          const allPlayers = queryClient.getQueryData(['/api/players']) as any[];
          const player = allPlayers?.find((p: any) => p.id === variables.playerId);
          
          if (player) {
            const playerRef = {
              playerId: player.id,
              playerName: player.name || 'Sin nombre',
              playerNumber: (player.jerseyNumber || 0).toString(),
              playerPosition: (player.position || 'DEFENSA').toUpperCase(),
              profileImageUrl: player.profileImageUrl
            };
            
            const currentPosition = useMatchStore.getState().findPlayerPosition(player.id);
            if (!currentPosition) {
              useMatchStore.getState().autoAssignPlayer(playerRef);
            }
          }
        }, 100); // Pequeño delay para asegurar que el estado se actualice
      }
    },
  });

  return {
    confirmAttendance: confirmAttendanceMutation.mutate,
    isConfirming: confirmAttendanceMutation.isPending,
  };
}