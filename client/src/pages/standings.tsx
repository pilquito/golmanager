import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import { Download, Trophy, TrendingUp, TrendingDown, Minus, Shield, Camera, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Opponent } from "@shared/schema";

// Tipo para los datos de clasificación
interface StandingTeam {
  position: number;
  team: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form?: string[]; // Últimos 5 resultados: 'W', 'D', 'L'
}

export default function Standings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Query para obtener los equipos rivales (con escudos)
  const { data: opponents } = useQuery<Opponent[]>({
    queryKey: ["/api/opponents"],
  });

  // Query para obtener la clasificación desde el backend
  const { data: standings, isLoading } = useQuery<StandingTeam[]>({
    queryKey: ["/api/standings"],
  });

  // Función para obtener el logo de un equipo
  const getTeamLogo = (teamName: string): string | null => {
    const opponent = opponents?.find(opp => 
      opp.name.toLowerCase().includes(teamName.toLowerCase()) ||
      teamName.toLowerCase().includes(opp.name.toLowerCase())
    );
    return opponent?.logoUrl || null;
  };

  const importStandingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/liga-hesperides/import-standings", "POST", {});
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
      toast({
        title: "Importación completada",
        description: data.message || "Clasificación importada desde Liga Hesperides",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error en la importación",
        description: "No se pudo importar la clasificación desde Liga Hesperides",
        variant: "destructive",
      });
    },
  });

  const importFromScreenshotMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const response = await apiRequest("/api/liga-hesperides/import-standings-screenshot", "POST", {
        imageBase64: base64,
        mimeType: file.type,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/standings"] });
      toast({
        title: "Importación completada",
        description: data.message || `Clasificación importada: ${data.importedTeams} nuevos, ${data.updatedTeams} actualizados`,
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Redirigiendo al login...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error en la importación",
        description: error.message || "No se pudo procesar la captura de pantalla",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importFromScreenshotMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getPositionColor = (position: number) => {
    if (position <= 2) return "text-green-600 bg-green-50";
    if (position <= 4) return "text-blue-600 bg-blue-50";
    if (position >= standings!.length - 2) return "text-red-600 bg-red-50";
    return "text-gray-600 bg-gray-50";
  };

  const getFormIcon = (result: string) => {
    switch (result) {
      case 'W': return <div className="w-2 h-2 bg-green-500 rounded-full" title="Victoria" />;
      case 'D': return <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Empate" />;
      case 'L': return <div className="w-2 h-2 bg-red-500 rounded-full" title="Derrota" />;
      default: return <div className="w-2 h-2 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Clasificación" subtitle="Tabla de posiciones de la liga">
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importFromScreenshotMutation.isPending}
            variant="default"
            data-testid="button-import-screenshot"
          >
            {importFromScreenshotMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {importFromScreenshotMutation.isPending ? "Analizando..." : "Importar Captura"}
          </Button>
          <Button
            onClick={() => importStandingsMutation.mutate()}
            disabled={importStandingsMutation.isPending}
            variant="outline"
            data-testid="button-import-standings"
          >
            <Download className="h-4 w-4 mr-2" />
            {importStandingsMutation.isPending ? "Importando..." : "Importar URL"}
          </Button>
        </div>
      </Header>

      <main className="flex-1 overflow-auto bg-background p-3 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Tabla de Clasificación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Pos</th>
                    <th className="text-left p-3 font-medium">Equipo</th>
                    <th className="text-center p-3 font-medium">PJ</th>
                    <th className="text-center p-3 font-medium">G</th>
                    <th className="text-center p-3 font-medium">E</th>
                    <th className="text-center p-3 font-medium">P</th>
                    <th className="text-center p-3 font-medium">GF</th>
                    <th className="text-center p-3 font-medium">GC</th>
                    <th className="text-center p-3 font-medium">DG</th>
                    <th className="text-center p-3 font-medium">Pts</th>
                    <th className="text-center p-3 font-medium">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={11} className="text-center p-8 text-muted-foreground">
                        Cargando clasificación...
                      </td>
                    </tr>
                  ) : standings && standings.length > 0 ? (
                    standings.map((team) => (
                      <tr
                        key={team.position}
                        className={`border-b hover:bg-muted/30 ${
                          team.team === "AF. Sobradillo" ? "bg-blue-50 font-medium" : ""
                        }`}
                        data-testid={`standing-row-${team.position}`}
                      >
                        <td className="p-3">
                          <Badge
                            variant="secondary"
                            className={`${getPositionColor(team.position)} font-bold`}
                          >
                            {team.position}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium" data-testid={`team-name-${team.position}`}>
                          <div className="flex items-center gap-3">
                            {getTeamLogo(team.team) ? (
                              <img
                                src={getTeamLogo(team.team)!}
                                alt={`Escudo de ${team.team}`}
                                className="w-6 h-6 object-contain rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const shield = target.nextElementSibling as HTMLElement;
                                  if (shield) shield.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <Shield 
                              className="w-6 h-6 text-muted-foreground" 
                              style={{ display: getTeamLogo(team.team) ? 'none' : 'block' }}
                            />
                            <span>{team.team}</span>
                          </div>
                        </td>
                        <td className="text-center p-3">{team.matches}</td>
                        <td className="text-center p-3 text-green-600 font-medium">{team.wins}</td>
                        <td className="text-center p-3 text-yellow-600 font-medium">{team.draws}</td>
                        <td className="text-center p-3 text-red-600 font-medium">{team.losses}</td>
                        <td className="text-center p-3">{team.goalsFor}</td>
                        <td className="text-center p-3">{team.goalsAgainst}</td>
                        <td className={`text-center p-3 font-medium ${
                          team.goalDifference > 0 ? 'text-green-600' : 
                          team.goalDifference < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                        </td>
                        <td className="text-center p-3 font-bold text-blue-600">{team.points}</td>
                        <td className="text-center p-3">
                          <div className="flex justify-center gap-1">
                            {team.form?.map((result, index) => (
                              <div key={index}>{getFormIcon(result)}</div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="text-center p-8 text-muted-foreground">
                        No hay datos de clasificación disponibles.
                        <br />
                        <span className="text-sm">
                          Usa el botón "Importar Clasificación" para obtener los datos de Liga Hesperides.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Leyenda */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Posiciones</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className="text-green-600 bg-green-50">1-2</Badge>
                    <span>Ascenso directo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-blue-600 bg-blue-50">3-4</Badge>
                    <span>Playoff de ascenso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-red-600 bg-red-50">Últimos</Badge>
                    <span>Descenso</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Abreviaciones</h4>
                <div className="space-y-1 text-xs">
                  <div><strong>PJ:</strong> Partidos Jugados</div>
                  <div><strong>G:</strong> Ganados</div>
                  <div><strong>E:</strong> Empatados</div>
                  <div><strong>P:</strong> Perdidos</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Goles</h4>
                <div className="space-y-1 text-xs">
                  <div><strong>GF:</strong> Goles a Favor</div>
                  <div><strong>GC:</strong> Goles en Contra</div>
                  <div><strong>DG:</strong> Diferencia de Goles</div>
                  <div><strong>Pts:</strong> Puntos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}