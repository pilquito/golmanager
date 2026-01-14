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
import { ArrowLeft, User, Building2, Phone, Mail, Calendar, Plus, Trash2 } from "lucide-react";
import type { Player, Organization } from "@shared/schema";

type PlayerDetail = Player & {
  organizations: { id: string; name: string; jerseyNumber?: number; position?: string }[];
};

export default function AdminPlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [targetOrgId, setTargetOrgId] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Player>>({});

  const { data: player, isLoading } = useQuery<PlayerDetail>({
    queryKey: ["/api/admin/players", id],
  });

  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (data: Partial<Player>) => {
      return await apiRequest(`/api/admin/players/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      setEditMode(false);
      toast({ title: "Jugador actualizado" });
    },
    onError: () => {
      toast({ title: "Error al actualizar", variant: "destructive" });
    },
  });

  const addToOrgMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      return await apiRequest(`/api/admin/player-organizations`, "POST", {
        playerId: id,
        organizationId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      setShowAddOrg(false);
      setTargetOrgId("");
      toast({ title: "Jugador añadido al equipo" });
    },
    onError: () => {
      toast({ title: "Error al añadir al equipo", variant: "destructive" });
    },
  });

  const removeFromOrgMutation = useMutation({
    mutationFn: async (organizationId: string) => {
      return await apiRequest(`/api/admin/player-organizations/${id}/${organizationId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/players"] });
      toast({ title: "Jugador eliminado del equipo" });
    },
    onError: () => {
      toast({ title: "Error al eliminar del equipo", variant: "destructive" });
    },
  });

  const availableOrgs = organizations.filter(org => 
    !player?.organizations?.some(o => o.id === org.id)
  );

  const handleSave = () => {
    updatePlayerMutation.mutate(formData);
  };

  const startEdit = () => {
    setFormData({
      name: player?.name,
      position: player?.position,
      jerseyNumber: player?.jerseyNumber,
      phoneNumber: player?.phoneNumber,
      email: player?.email,
      birthDate: player?.birthDate,
      tagline: player?.tagline,
      isActive: player?.isActive,
    });
    setEditMode(true);
  };

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

  if (!player) {
    return (
      <div className="p-6 text-center">
        <p>Jugador no encontrado</p>
        <Button variant="link" onClick={() => setLocation("/admin/players")}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setLocation("/admin/players")}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a Jugadores
      </Button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl">
          {player.profileImageUrl ? (
            <img src={player.profileImageUrl} alt={player.name} className="w-24 h-24 rounded-full object-cover" />
          ) : (
            player.jerseyNumber || player.name.charAt(0)
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
          <p className="text-gray-500">{player.position}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {player.organizations?.length > 0 ? (
              player.organizations.map((org) => (
                <Badge key={org.id} variant="outline">{org.name}</Badge>
              ))
            ) : (
              <Badge variant="secondary">Agente Libre</Badge>
            )}
          </div>
        </div>
        <div>
          {editMode ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updatePlayerMutation.isPending}>
                Guardar
              </Button>
            </div>
          ) : (
            <Button onClick={startEdit}>
              Editar
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info">
            <User className="w-4 h-4 mr-2" />
            Información
          </TabsTrigger>
          <TabsTrigger value="teams">
            <Building2 className="w-4 h-4 mr-2" />
            Equipos ({player.organizations?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Datos del Jugador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre</label>
                    <Input
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Posición</label>
                    <Select
                      value={formData.position || ""}
                      onValueChange={(value) => setFormData({ ...formData, position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar posición" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Portero">Portero</SelectItem>
                        <SelectItem value="Defensa">Defensa</SelectItem>
                        <SelectItem value="Mediocampista">Mediocampista</SelectItem>
                        <SelectItem value="Delantero">Delantero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Dorsal</label>
                    <Input
                      type="number"
                      value={formData.jerseyNumber || ""}
                      onChange={(e) => setFormData({ ...formData, jerseyNumber: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Teléfono</label>
                    <Input
                      value={formData.phoneNumber || ""}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
                    <Input
                      type="date"
                      value={formData.birthDate || ""}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">Eslogan / Frase</label>
                    <Input
                      value={formData.tagline || ""}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      placeholder="Frase del jugador..."
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-medium">Estado</p>
                      <p className="text-sm text-gray-500">Jugador activo o inactivo</p>
                    </div>
                    <Switch
                      checked={formData.isActive ?? true}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-medium">{player.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 text-center text-gray-400 font-bold">#</span>
                    <div>
                      <p className="text-sm text-gray-500">Dorsal</p>
                      <p className="font-medium">{player.jerseyNumber || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{player.phoneNumber || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{player.email || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                      <p className="font-medium">{player.birthDate || "-"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 text-center text-gray-400">📍</span>
                    <div>
                      <p className="text-sm text-gray-500">Posición</p>
                      <p className="font-medium">{player.position}</p>
                    </div>
                  </div>
                  {player.tagline && (
                    <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Eslogan</p>
                      <p className="italic">"{player.tagline}"</p>
                    </div>
                  )}
                  <div className="md:col-span-2 flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-medium">Estado</p>
                    </div>
                    <Badge variant={player.isActive ? "default" : "secondary"}>
                      {player.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Equipos del Jugador</CardTitle>
              <Button onClick={() => setShowAddOrg(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir a Equipo
              </Button>
            </CardHeader>
            <CardContent>
              {player.organizations?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Este jugador es un agente libre</p>
                  <Button variant="link" onClick={() => setShowAddOrg(true)}>
                    Añadir a un equipo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {player.organizations?.map((org) => (
                    <div
                      key={org.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-orange-500" />
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-gray-500">
                            {org.position && `${org.position} • `}
                            {org.jerseyNumber && `#${org.jerseyNumber}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`¿Eliminar a ${player.name} de ${org.name}?`)) {
                            removeFromOrgMutation.mutate(org.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddOrg} onOpenChange={setShowAddOrg}>
        <DialogContent aria-describedby="add-to-team-description">
          <DialogHeader>
            <DialogTitle>Añadir a Equipo</DialogTitle>
          </DialogHeader>
          <p id="add-to-team-description" className="sr-only">Selecciona un equipo para añadir al jugador</p>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Seleccionar equipo</label>
              <Select value={targetOrgId} onValueChange={setTargetOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un equipo" />
                </SelectTrigger>
                <SelectContent>
                  {availableOrgs.length === 0 ? (
                    <SelectItem value="none" disabled>Ya está en todos los equipos</SelectItem>
                  ) : (
                    availableOrgs.map((org) => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddOrg(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => addToOrgMutation.mutate(targetOrgId)}
                disabled={!targetOrgId || addToOrgMutation.isPending}
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
