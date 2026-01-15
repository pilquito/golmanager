import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { Eye, Edit, Trash2, Key } from "lucide-react";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Users() {
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "user" as "admin" | "user",
    isActive: true,
  });
  
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && !authLoading,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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

    if (!authLoading && isAuthenticated && currentUser?.role !== "admin") {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para acceder a esta sección",
        variant: "destructive",
      });
    }
  }, [authLoading, isAuthenticated, currentUser, toast]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<User> }) => {
      return apiRequest("PATCH", `/api/users/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Usuario actualizado",
        description: "Los cambios se guardaron correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      return apiRequest("POST", `/api/users/${data.userId}/reset-password`, { 
        newPassword: data.newPassword 
      });
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      toast({
        title: "Contraseña actualizada",
        description: "La nueva contraseña se ha establecido correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado correctamente",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el usuario",
        variant: "destructive",
      });
    },
  });

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role as "admin" | "user",
      isActive: user.isActive ?? true,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handlePasswordReset = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      id: selectedUser.id,
      updates: {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        role: editForm.role,
        isActive: editForm.isActive,
      },
    });
  };

  const handleSavePassword = () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }
    
    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      newPassword,
    });
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;
    deleteUserMutation.mutate(selectedUser.id);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Nunca";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadge = (role: string) => {
    const roleMap = {
      admin: { label: "Admin", variant: "default" as const },
      user: { label: "Usuario", variant: "secondary" as const },
    };
    
    const roleInfo = roleMap[role as keyof typeof roleMap] || roleMap.user;
    return (
      <Badge variant={roleInfo.variant}>
        {roleInfo.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Activo" : "Inactivo"}
      </Badge>
    );
  };

  const columns = [
    {
      accessorKey: "firstName",
      header: "Nombre",
      cell: ({ row }: any) => {
        const user = row.original;
        const displayName = user.firstName 
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : user.email || "Usuario sin nombre";
        
        return (
          <div className="font-medium" data-testid={`user-name-${user.id}`}>
            {displayName}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`user-email-${row.original.id}`}>
          {row.getValue("email") || "No especificado"}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Rol",
      cell: ({ row }: any) => (
        <div data-testid={`user-role-${row.original.id}`}>
          {getRoleBadge(row.getValue("role"))}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }: any) => (
        <div data-testid={`user-status-${row.original.id}`}>
          {getStatusBadge(row.getValue("isActive"))}
        </div>
      ),
    },
    {
      accessorKey: "lastAccess",
      header: "Último Acceso",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`user-last-access-${row.original.id}`}>
          {formatDate(row.getValue("lastAccess"))}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }: any) => {
        const user = row.original;
        return (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(user)}
              data-testid={`button-view-${user.id}`}
              title="Ver detalles"
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(user)}
              data-testid={`button-edit-${user.id}`}
              title="Editar usuario"
            >
              <Edit className="h-4 w-4 text-yellow-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePasswordReset(user)}
              data-testid={`button-password-${user.id}`}
              title="Cambiar contraseña"
            >
              <Key className="h-4 w-4 text-purple-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user)}
              disabled={user.id === currentUser?.id}
              data-testid={`button-delete-${user.id}`}
              title="Eliminar usuario"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (!authLoading && currentUser?.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Gestión de Usuarios" subtitle="Administración de usuarios del sistema" />
        <main className="flex-1 overflow-auto bg-background p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground text-lg">
                  No tienes permisos para acceder a esta sección
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Solo los administradores pueden gestionar usuarios
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Gestión de Usuarios" subtitle="Administración de usuarios del sistema" />

      <main className="flex-1 overflow-auto bg-background p-6">
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={users || []}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </main>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription>
              Información completa del usuario
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Nombre</Label>
                  <p className="font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Email</Label>
                  <p className="font-medium">{selectedUser.email || "No especificado"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Rol</Label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role || "user")}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedUser.isActive ?? true)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Último Acceso</Label>
                  <p className="font-medium">{formatDate(selectedUser.lastAccess)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Creado</Label>
                  <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Los cambios de email también actualizarán el jugador asociado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  placeholder="Apellido"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "admin" | "user") => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
              <Label htmlFor="isActive">Usuario activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para {selectedUser?.firstName} {selectedUser?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePassword}
              disabled={resetPasswordMutation.isPending || !newPassword}
            >
              {resetPasswordMutation.isPending ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario {selectedUser?.firstName} {selectedUser?.lastName}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteUserMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
