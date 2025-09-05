import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FixPlayersUsers() {
  const [progress, setProgress] = useState(0);
  const [isFixing, setIsFixing] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: players, isLoading } = useQuery({
    queryKey: ["/api/players"],
  });

  const { data: users } = useQuery({
    queryKey: ["/api/users"],
  });

  const fixUsersMutation = useMutation({
    mutationFn: async () => {
      setIsFixing(true);
      setProgress(0);
      setResults([]);
      
      if (!players) return [];
      
      const playersList = Array.isArray(players) ? players : [];
      const usersList = Array.isArray(users) ? users : [];
      
      const results = [];
      
      for (let i = 0; i < playersList.length; i++) {
        const player = playersList[i];
        try {
          const expectedUsername = player.name.toLowerCase().replace(/\s+/g, '.');
          const userExists = usersList.find((u: any) => u.username === expectedUsername);
          
          if (!userExists) {
            // Create missing user
            await apiRequest("/api/auth/register-admin", "POST", {
              username: expectedUsername,
              password: "jugador123",
              firstName: player.name.split(' ')[0],
              lastName: player.name.split(' ').slice(1).join(' ') || '',
              email: `${expectedUsername}@golmanager.com`,
              role: 'user',
              isActive: true,
            });
            
            results.push({ success: true, player: player.name, username: expectedUsername });
            setResults(prev => [...prev, `✓ Creado usuario: ${expectedUsername} para ${player.name}`]);
          } else {
            results.push({ success: true, player: player.name, username: expectedUsername, existing: true });
            setResults(prev => [...prev, `→ Usuario ya existe: ${expectedUsername}`]);
          }
          
        } catch (error) {
          results.push({ success: false, player: player.name, error });
          setResults(prev => [...prev, `✗ Error: ${player.name}`]);
        }
        
        setProgress(((i + 1) / playersList.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    },
    onSuccess: (results) => {
      const created = results.filter((r: any) => r.success && !r.existing).length;
      const existing = results.filter((r: any) => r.success && r.existing).length;
      const failed = results.filter((r: any) => !r.success).length;
      
      toast({
        title: "Reparación completada",
        description: `${created} usuarios creados, ${existing} ya existían, ${failed} errores`,
        variant: created > 0 || failed === 0 ? "default" : "destructive",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsFixing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al reparar usuarios",
        variant: "destructive",
      });
      setIsFixing(false);
    },
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  const playersList = Array.isArray(players) ? players : [];
  const usersList = Array.isArray(users) ? users : [];
  
  const playersWithoutUsers = playersList.filter((player: any) => {
    const expectedUsername = player.name.toLowerCase().replace(/\s+/g, '.');
    return !usersList.find((u: any) => u.username === expectedUsername);
  });

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Reparar Usuarios de Jugadores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Jugadores totales:</strong> {playersList.length}
            </p>
            <p className="text-sm">
              <strong>Usuarios totales:</strong> {usersList.length}
            </p>
            <p className="text-sm text-red-600">
              <strong>Jugadores sin usuario:</strong> {playersWithoutUsers.length}
            </p>
          </div>
          
          {playersWithoutUsers.length > 0 && (
            <div className="space-y-2">
              <p className="font-medium">Jugadores que necesitan usuario:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {playersWithoutUsers.map((player: any) => (
                  <p key={player.id} className="text-sm text-muted-foreground">
                    {player.name} → {player.name.toLowerCase().replace(/\s+/g, '.')}
                  </p>
                ))}
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => fixUsersMutation.mutate()}
            disabled={isFixing || playersWithoutUsers.length === 0}
            className="w-full"
            data-testid="button-fix-users"
          >
            {isFixing ? "Reparando..." : 
             playersWithoutUsers.length === 0 ? "Todos los usuarios están creados" : 
             `Crear ${playersWithoutUsers.length} usuarios faltantes`}
          </Button>
          
          {isFixing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center">{Math.round(progress)}% completado</p>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              <p className="font-medium">Resultados:</p>
              {results.map((result, index) => (
                <p key={index} className={`text-sm ${
                  result.startsWith('✓') ? 'text-green-600' : 
                  result.startsWith('→') ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {result}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}