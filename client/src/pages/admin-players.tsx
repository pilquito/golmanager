import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, UserCircle, Eye, Building2, Plus, ArrowRightLeft } from "lucide-react";
import type { Player, Organization } from "@shared/schema";

type PlayerWithOrgs = Player & {
  organizations: { id: string; name: string }[];
};

export default function AdminPlayers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrg, setFilterOrg] = useState<string>("all");
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithOrgs | null>(null);
  const [targetOrgId, setTargetOrgId] = useState<string>("");

  const { data: players = [], isLoading } = useQuery<PlayerWithOrgs[]>({
    queryKey: ["/api/admin/players"],
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const transferPlayerMutation = useMutation({
    mutationFn: async ({ playerId, organizationId }: { playerId: string; organizationId: string }) => {
      return await apiRequest(`/api/admin/player-organizations`, "POST", {
        playerId,
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setShowTransfer(false);
      setSelectedPlayer(null);
      setTargetOrgId("");
      toast({ title: "Jugador asignado al equipo" });
    },
    onError: () => {
      toast({ title: "Error al asignar jugador", variant: "destructive" });
    },
  });

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterOrg === "all") return matchesSearch;
    if (filterOrg === "free") return matchesSearch && (!p.organizations || p.organizations.length === 0);
    return matchesSearch && p.organizations?.some(o => o.id === filterOrg);
  });

  const freeAgents = players.filter(p => !p.organizations || p.organizations.length === 0);

  const openTransferDialog = (player: PlayerWithOrgs) => {
    setSelectedPlayer(player);
    setShowTransfer(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestionar Jugadores</h1>
        <p className="text-gray-600 mt-1">Administra todos los jugadores de todas las organizaciones</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <UserCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{players.length}</p>
            <p className="text-sm text-gray-600">Total Jugadores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Building2 className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{players.length - freeAgents.length}</p>
            <p className="text-sm text-gray-600">Con Equipo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <UserCircle className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{freeAgents.length}</p>
            <p className="text-sm text-gray-600">Agentes Libres</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar jugadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterOrg} onValueChange={setFilterOrg}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por equipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los equipos</SelectItem>
            <SelectItem value="free">Agentes libres</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {filteredPlayers.map((player) => (
          <Card key={player.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                    {player.profileImageUrl ? (
                      <img src={player.profileImageUrl} alt={player.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      player.jerseyNumber || player.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{player.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{player.position}</span>
                      {player.jerseyNumber && <span>• #{player.jerseyNumber}</span>}
                      {player.email && <span>• {player.email}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-wrap gap-1">
                    {player.organizations?.length > 0 ? (
                      player.organizations.map((org) => (
                        <Badge key={org.id} variant="outline" className="text-xs">
                          {org.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Agente Libre
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setLocation(`/admin/players/${player.id}`)}
                      title="Ver ficha completa"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openTransferDialog(player)}
                      title="Asignar a equipo"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron jugadores</p>
        </div>
      )}

      <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
        <DialogContent aria-describedby="transfer-player-description">
          <DialogHeader>
            <DialogTitle>Asignar Jugador a Equipo</DialogTitle>
          </DialogHeader>
          <p id="transfer-player-description" className="sr-only">Selecciona un equipo para asignar al jugador</p>
          {selectedPlayer && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedPlayer.name}</p>
                <p className="text-sm text-gray-500">{selectedPlayer.position}</p>
                {selectedPlayer.organizations?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Equipos actuales:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPlayer.organizations.map((org) => (
                        <Badge key={org.id} variant="outline">{org.name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Añadir a equipo</label>
                <Select value={targetOrgId} onValueChange={setTargetOrgId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un equipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations
                      .filter(org => !selectedPlayer.organizations?.some(o => o.id === org.id))
                      .map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTransfer(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => transferPlayerMutation.mutate({
                    playerId: selectedPlayer.id,
                    organizationId: targetOrgId,
                  })}
                  disabled={!targetOrgId || transferPlayerMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Asignar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
