import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const players = [
  { name: "Francisco Eduardo Pérez Corzen", jersey: 8, position: "Mediocampista" },
  { name: "Alejandro Martín Reyes", jersey: 14, position: "Delantero" },
  { name: "Antonio Javier Yanes Guallarte", jersey: 15, position: "Defensa" },
  { name: "Benaylio Cruz Mendoza", jersey: 6, position: "Defensa" },
  { name: "Oliver González Bustamacurt", jersey: 1, position: "Portero" },
  { name: "Yeray Rodríguez Marrero", jersey: 3, position: "Defensa" },
  { name: "Egobar Alexander Gallardo Medina", jersey: 19, position: "Mediocampista" },
  { name: "Daniel César Vera Ávobsa", jersey: 12, position: "Delantero" },
  { name: "Óscar Jesús Martín Castiola", jersey: 9, position: "Delantero" },
  { name: "Johny Zebenzui Marón Socorro", jersey: 4, position: "Mediocampista" },
  { name: "Santiago Delgado Fleitas", jersey: 10, position: "Delantero" },
  { name: "Nicolás Yeray Fernández Rodríguez", jersey: 11, position: "Mediocampista" },
  { name: "Zebenzui Aguilar Yanes", jersey: 7, position: "Mediocampista" },
  { name: "Rayco Plasencia", jersey: 5, position: "Defensa" },
  { name: "David Aluzey Fuentes Chávez", jersey: 16, position: "Delantero" },
  { name: "Tinerfe Miguel Palmero Hernández", jersey: 2, position: "Defensa" }
];

export default function CreatePlayersBatch() {
  const [progress, setProgress] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createdPlayers, setCreatedPlayers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPlayersMutation = useMutation({
    mutationFn: async () => {
      setIsCreating(true);
      setProgress(0);
      setCreatedPlayers([]);
      
      const results = [];
      
      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        try {
          const result = await apiRequest("/api/players", "POST", {
            name: player.name,
            jerseyNumber: player.jersey,
            position: player.position,
            phoneNumber: `+346${String(player.jersey).padStart(8, '0')}`,
            email: `${player.name.toLowerCase().replace(/\s+/g, '.')}@email.com`,
            isActive: true
          });
          
          results.push({ success: true, player: player.name, data: result });
          setCreatedPlayers(prev => [...prev, `✓ ${player.name} (#${player.jersey})`]);
          
        } catch (error) {
          results.push({ success: false, player: player.name, error });
          setCreatedPlayers(prev => [...prev, `✗ Error: ${player.name}`]);
        }
        
        setProgress(((i + 1) / players.length) * 100);
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      toast({
        title: "Creación completada",
        description: `${successful} jugadores creados, ${failed} errores`,
        variant: successful > 0 ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setIsCreating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear jugadores en lote",
        variant: "destructive",
      });
      setIsCreating(false);
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Jugadores en Lote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Se crearán {players.length} jugadores con sus cuentas de usuario automáticamente.
            </p>
            
            <Button 
              onClick={() => createPlayersMutation.mutate()}
              disabled={isCreating}
              className="w-full"
              data-testid="button-create-all-players"
            >
              {isCreating ? "Creando jugadores..." : "Crear Todos los Jugadores"}
            </Button>
          </div>
          
          {isCreating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center">{Math.round(progress)}% completado</p>
            </div>
          )}
          
          {createdPlayers.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <p className="font-medium">Resultados:</p>
              {createdPlayers.map((result, index) => (
                <p key={index} className={`text-sm ${result.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {result}
                </p>
              ))}
            </div>
          )}
          
          <div className="space-y-2">
            <p className="font-medium">Jugadores a crear:</p>
            <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
              {players.map((player, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  #{player.jersey} {player.name} - {player.position}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}