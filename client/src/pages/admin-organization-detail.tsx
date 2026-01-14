import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, UserCircle, Settings, Upload, Plus, Trash2, ArrowRightLeft, Pencil, Check, X } from "lucide-react";
import type { Player, TeamConfig } from "@shared/schema";

type PlayerWithMembership = Player & {
  membershipId?: string;
  orgJerseyNumber?: number;
  orgPosition?: string;
};

type OrganizationDetail = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean;
  players: PlayerWithMembership[];
  teamConfig: TeamConfig | null;
};

type AllPlayer = Player & {
  organizations?: { id: string; name: string; jerseyNumber?: number; position?: string }[];
};

export default function AdminOrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editName, setEditName] = useState("");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editJerseyNumber, setEditJerseyNumber] = useState<string>("");
  const [editPosition, setEditPosition] = useState<string>("");

  const { data: org, isLoading } = useQuery<OrganizationDetail>({
    queryKey: ["/api/admin/organizations", id],
  });

  const { data: allPlayers = [] } = useQuery<AllPlayer[]>({
    queryKey: ["/api/admin/players"],
  });

  const { data: allOrganizations = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/organizations/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Organización actualizada" });
    },
    onError: () => {
      toast({ title: "Error al actualizar", variant: "destructive" });
    },
  });

  const addPlayerToOrgMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return await apiRequest(`/api/admin/player-organizations`, "POST", {
        playerId,
        organizationId: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      setShowAddPlayer(false);
      setSelectedPlayerId("");
      toast({ title: "Jugador añadido al equipo" });
    },
    onError: () => {
      toast({ title: "Error al añadir jugador", variant: "destructive" });
    },
  });

  const removePlayerFromOrgMutation = useMutation({
    mutationFn: async (playerId: string) => {
      return await apiRequest(`/api/admin/player-organizations/${playerId}/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      toast({ title: "Jugador eliminado del equipo" });
    },
    onError: () => {
      toast({ title: "Error al eliminar jugador", variant: "destructive" });
    },
  });

  const updatePlayerOrgMutation = useMutation({
    mutationFn: async ({ playerId, jerseyNumber, position }: { playerId: string; jerseyNumber?: number; position?: string }) => {
      return await apiRequest(`/api/admin/player-organizations/${playerId}/${id}`, "PATCH", {
        jerseyNumber,
        position,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      setEditingPlayerId(null);
      toast({ title: "Datos del jugador actualizados" });
    },
    onError: () => {
      toast({ title: "Error al actualizar", variant: "destructive" });
    },
  });

  // Filter players that are not already in this organization (using organizations array from allPlayers)
  const freePlayers = allPlayers.filter(p => 
    !p.organizations?.some(o => o.id === id)
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 text-center">
        <p>Organización no encontrada</p>
        <Button variant="link" onClick={() => setLocation("/admin/organizations")}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation("/admin/organizations")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Organizaciones
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt={org.name} className="w-20 h-20 rounded-full object-contain bg-white p-1" />
          ) : (
            org.name.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-gray-500">/{org.slug}</p>
          <Badge variant={org.isActive ? "default" : "secondary"} className="mt-1">
            {org.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="players">
            <UserCircle className="w-4 h-4 mr-2" />
            Jugadores ({org.players?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="config">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre del Equipo</label>
                <div className="flex gap-2">
                  <Input
                    value={editName || org.name}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nombre del equipo"
                  />
                  <Button
                    onClick={() => {
                      if (editName && editName !== org.name) {
                        updateOrgMutation.mutate({ name: editName });
                      }
                    }}
                    disabled={!editName || editName === org.name || updateOrgMutation.isPending}
                  >
                    Guardar
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Logo del Equipo</label>
                <div className="mt-2 flex items-center gap-4">
                  <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg p-1" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    El logo se puede cambiar desde la configuración del equipo
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <p className="font-medium">Estado del equipo</p>
                  <p className="text-sm text-gray-500">Desactiva el equipo para ocultar sus datos</p>
                </div>
                <Switch
                  checked={org.isActive}
                  onCheckedChange={(checked) => updateOrgMutation.mutate({ isActive: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Jugadores del Equipo</CardTitle>
              <Button onClick={() => setShowAddPlayer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Jugador
              </Button>
            </CardHeader>
            <CardContent>
              {org.players?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay jugadores en este equipo</p>
                  <Button variant="link" onClick={() => setShowAddPlayer(true)}>
                    Añadir el primer jugador
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {org.players?.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {editingPlayerId === player.id ? (
                          <>
                            <Input
                              className="w-16 text-center"
                              type="number"
                              value={editJerseyNumber}
                              onChange={(e) => setEditJerseyNumber(e.target.value)}
                              placeholder="#"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{player.name}</p>
                              <Select value={editPosition} onValueChange={setEditPosition}>
                                <SelectTrigger className="w-40 h-8 text-sm">
                                  <SelectValue placeholder="Posición" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Portero">Portero</SelectItem>
                                  <SelectItem value="Defensa">Defensa</SelectItem>
                                  <SelectItem value="Centrocampista">Centrocampista</SelectItem>
                                  <SelectItem value="Delantero">Delantero</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                              {player.orgJerseyNumber || player.jerseyNumber || player.name.charAt(0)}
                            </div>
                            <div className="cursor-pointer" onClick={() => setLocation(`/admin/players/${player.id}`)}>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-sm text-gray-500">{player.orgPosition || player.position}</p>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {editingPlayerId === player.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                updatePlayerOrgMutation.mutate({
                                  playerId: player.id,
                                  jerseyNumber: editJerseyNumber ? parseInt(editJerseyNumber) : undefined,
                                  position: editPosition || undefined,
                                });
                              }}
                              disabled={updatePlayerOrgMutation.isPending}
                            >
                              <Check className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingPlayerId(null)}
                            >
                              <X className="w-4 h-4 text-gray-500" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant={player.isActive ? "default" : "secondary"}>
                              {player.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPlayerId(player.id);
                                setEditJerseyNumber((player.orgJerseyNumber || player.jerseyNumber || "").toString());
                                setEditPosition(player.orgPosition || player.position || "");
                              }}
                            >
                              <Pencil className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("¿Eliminar este jugador del equipo?")) {
                                  removePlayerFromOrgMutation.mutate(player.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              {org.teamConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre del equipo</p>
                      <p className="font-medium">{org.teamConfig.teamName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo de fútbol</p>
                      <p className="font-medium">Fútbol {org.teamConfig.footballType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cuota mensual</p>
                      <p className="font-medium">{org.teamConfig.monthlyFee}€</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Día de pago</p>
                      <p className="font-medium">Día {org.teamConfig.paymentDueDay}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email de contacto</p>
                      <p className="font-medium">{org.teamConfig.contactEmail || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono de contacto</p>
                      <p className="font-medium">{org.teamConfig.contactPhone || "-"}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button variant="outline" onClick={() => setLocation(`/admin/settings`)}>
                      Editar configuración completa
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No hay configuración para este equipo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
        <DialogContent aria-describedby="add-player-description">
          <DialogHeader>
            <DialogTitle>Añadir Jugador al Equipo</DialogTitle>
          </DialogHeader>
          <p id="add-player-description" className="sr-only">Selecciona un jugador para añadir al equipo</p>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Seleccionar jugador</label>
              <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un jugador" />
                </SelectTrigger>
                <SelectContent>
                  {freePlayers.length === 0 ? (
                    <SelectItem value="none" disabled>No hay jugadores disponibles</SelectItem>
                  ) : (
                    freePlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.name} - {player.position}
                        {player.organizations && player.organizations.length > 0 && ` (${player.organizations.map(o => o.name).join(', ')})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => addPlayerToOrgMutation.mutate(selectedPlayerId)}
                disabled={!selectedPlayerId || addPlayerToOrgMutation.isPending}
              >
                Añadir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
