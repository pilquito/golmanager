import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useAttendanceConfirmation() {
  const { toast } = useToast();

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
      return apiRequest("POST", "/api/admin/attendances", {
        matchId,
        playerId,
        status,
      });
    },
    onMutate: async ({ matchId, playerId, status }) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ 
        queryKey: [`/api/matches/${matchId}/attendances`] 
      });
      
      // Snapshot del estado anterior
      const previousAttendances = queryClient.getQueryData([
        `/api/matches/${matchId}/attendances`
      ]);
      
      // Actualización optimista
      queryClient.setQueryData([`/api/matches/${matchId}/attendances`], (old: any) => {
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
      
      return { previousAttendances };
    },
    onSuccess: (data, variables) => {
      const statusMessages = {
        confirmed: "Asistencia confirmada",
        absent: "Marcado como ausente", 
        pending: "Marcado como pendiente"
      };

      toast({
        title: "✓ Estado actualizado",
        description: statusMessages[variables.status],
      });
    },
    onError: (error, variables, context) => {
      // Revertir cambios optimistas
      if (context?.previousAttendances) {
        queryClient.setQueryData([
          `/api/matches/${variables.matchId}/attendances`
        ], context.previousAttendances);
      }
      
      console.error("Error updating attendance:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la asistencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
    onSettled: (data, error, variables) => {
      // Refrescar data desde el servidor
      queryClient.invalidateQueries({ 
        queryKey: [`/api/matches/${variables.matchId}/attendances`] 
      });
    },
  });

  return {
    confirmAttendance: confirmAttendanceMutation.mutate,
    isConfirming: confirmAttendanceMutation.isPending,
  };
}