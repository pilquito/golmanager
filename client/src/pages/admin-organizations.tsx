import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, UserCircle, MoreVertical, Pencil, Search, Plus, Trash2, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type OrganizationWithStats = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userCount: number;
  playerCount: number;
};

export default function AdminOrganizations() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOrg, setEditingOrg] = useState<OrganizationWithStats | null>(null);
  const [editName, setEditName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newOrgName, setNewOrgName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<OrganizationWithStats | null>(null);

  const { data: organizations = [], isLoading } = useQuery<OrganizationWithStats[]>({
    queryKey: ["/api/admin/organizations"],
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/organizations/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Organización actualizada" });
      setEditingOrg(null);
    },
    onError: () => {
      toast({ title: "Error al actualizar", variant: "destructive" });
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: { 
      name: string; 
      adminEmail: string; 
      adminFirstName: string; 
      adminLastName?: string; 
      adminPassword: string 
    }) => {
      const slug = data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      return await apiRequest("/api/admin/organizations", "POST", { 
        name: data.name, 
        slug,
        adminEmail: data.adminEmail,
        adminFirstName: data.adminFirstName,
        adminLastName: data.adminLastName,
        adminPassword: data.adminPassword,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Equipo y administrador creados" });
      setCreatedCredentials({
        email: data.adminUser.email,
        password: data.tempPassword,
      });
      setWizardStep(3);
    },
    onError: (error: any) => {
      const message = error?.message || "Error al crear organización";
      toast({ title: message, variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/admin/organizations/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({ title: "Organización eliminada" });
      setDeletingOrg(null);
    },
    onError: (error: any) => {
      const message = error?.message || "Error al eliminar";
      toast({ title: message, variant: "destructive" });
      setDeletingOrg(null);
    },
  });

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleActive = (org: OrganizationWithStats) => {
    updateOrgMutation.mutate({
      id: org.id,
      data: { isActive: !org.isActive },
    });
  };

  const handleSaveEdit = () => {
    if (!editingOrg || !editName.trim()) return;
    updateOrgMutation.mutate({
      id: editingOrg.id,
      data: { name: editName },
    });
  };

  const openEditDialog = (org: OrganizationWithStats) => {
    setEditingOrg(org);
    setEditName(org.name);
  };

  const handleCreateOrg = () => {
    if (wizardStep === 1) {
      if (!newOrgName.trim()) return;
      setWizardStep(2);
    } else if (wizardStep === 2) {
      if (!adminEmail.trim() || !adminFirstName.trim() || !adminPassword.trim()) return;
      createOrgMutation.mutate({ 
        name: newOrgName.trim(),
        adminEmail: adminEmail.trim(),
        adminFirstName: adminFirstName.trim(),
        adminLastName: adminLastName.trim() || undefined,
        adminPassword: adminPassword.trim(),
      });
    }
  };

  const resetCreateDialog = () => {
    setCreateDialogOpen(false);
    setWizardStep(1);
    setNewOrgName("");
    setAdminEmail("");
    setAdminFirstName("");
    setAdminLastName("");
    setAdminPassword("");
    setCreatedCredentials(null);
  };

  const handleDeleteOrg = () => {
    if (!deletingOrg) return;
    deleteOrgMutation.mutate(deletingOrg.id);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestionar Organizaciones</h1>
          <p className="text-gray-600 mt-1">Administra todos los equipos registrados</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          if (!open) resetCreateDialog();
          else setCreateDialogOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {wizardStep === 1 && "Paso 1: Datos del Equipo"}
                {wizardStep === 2 && "Paso 2: Administrador del Equipo"}
                {wizardStep === 3 && "Equipo Creado"}
              </DialogTitle>
              <DialogDescription>
                {wizardStep === 1 && "Ingresa el nombre del nuevo equipo."}
                {wizardStep === 2 && "Define las credenciales del administrador que gestionará este equipo."}
                {wizardStep === 3 && "Guarda estas credenciales para compartirlas con el administrador."}
              </DialogDescription>
            </DialogHeader>
            
            {wizardStep === 1 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-org-name">Nombre del equipo</Label>
                  <Input
                    id="new-org-name"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Ej: Los Tigres FC"
                  />
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email del administrador</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@equipo.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-first-name">Nombre</Label>
                    <Input
                      id="admin-first-name"
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-last-name">Apellido (opcional)</Label>
                    <Input
                      id="admin-last-name"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      placeholder="Pérez"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Contraseña temporal</Label>
                  <Input
                    id="admin-password"
                    type="text"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                  <p className="text-xs text-gray-500">El administrador podrá cambiarla después</p>
                </div>
              </div>
            )}

            {wizardStep === 3 && createdCredentials && (
              <div className="space-y-4 py-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium text-green-800">Credenciales del administrador:</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-white p-2 rounded border">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="font-mono text-sm">{createdCredentials.email}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded border">
                      <span className="text-sm text-gray-600">Contraseña:</span>
                      <span className="font-mono text-sm">{createdCredentials.password}</span>
                    </div>
                  </div>
                  <p className="text-xs text-green-700">Comparte estas credenciales con el administrador del equipo para que pueda iniciar sesión.</p>
                </div>
              </div>
            )}

            <DialogFooter>
              {wizardStep === 1 && (
                <>
                  <Button variant="outline" onClick={resetCreateDialog}>Cancelar</Button>
                  <Button onClick={handleCreateOrg} disabled={!newOrgName.trim()}>Siguiente</Button>
                </>
              )}
              {wizardStep === 2 && (
                <>
                  <Button variant="outline" onClick={() => setWizardStep(1)}>Atrás</Button>
                  <Button 
                    onClick={handleCreateOrg} 
                    disabled={createOrgMutation.isPending || !adminEmail.trim() || !adminFirstName.trim() || !adminPassword.trim() || adminPassword.length < 6}
                  >
                    {createOrgMutation.isPending ? "Creando..." : "Crear Equipo"}
                  </Button>
                </>
              )}
              {wizardStep === 3 && (
                <Button onClick={resetCreateDialog}>Cerrar</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <Building2 className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{organizations.length}</p>
            <p className="text-sm text-gray-600">Equipos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{organizations.reduce((sum, o) => sum + o.userCount, 0)}</p>
            <p className="text-sm text-gray-600">Usuarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <UserCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{organizations.reduce((sum, o) => sum + o.playerCount, 0)}</p>
            <p className="text-sm text-gray-600">Jugadores</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar equipos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrgs.map((org) => (
          <Card key={org.id} className={`border-l-4 ${org.isActive ? 'border-l-green-500' : 'border-l-gray-300'}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt={org.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      org.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{org.name}</h3>
                    <p className="text-sm text-gray-500">/{org.slug}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/admin/organizations/${org.id}`)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditDialog(org)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar nombre
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setDeletingOrg(org)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {org.userCount} usuarios
                </span>
                <span className="flex items-center gap-1">
                  <UserCircle className="w-4 h-4" />
                  {org.playerCount} jugadores
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Badge variant={org.isActive ? "default" : "secondary"}>
                  {org.isActive ? "Activo" : "Inactivo"}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Activo</span>
                  <Switch
                    checked={org.isActive ?? false}
                    onCheckedChange={() => handleToggleActive(org)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrgs.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron organizaciones</p>
        </div>
      )}

      <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Organización</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Nombre</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nombre del equipo"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingOrg(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={updateOrgMutation.isPending}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingOrg} onOpenChange={(open) => !open && setDeletingOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deletingOrg?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados a este equipo:
              jugadores, partidos, pagos, y configuración.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOrg} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteOrgMutation.isPending}
            >
              {deleteOrgMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
