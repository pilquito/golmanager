import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Users() {
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && !authLoading,
  });

  // Redirect if not authenticated or not admin
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

  const handleView = (user: User) => {
    // TODO: Implement user profile view
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La vista de perfil de usuario estará disponible próximamente",
    });
  };

  const handleEdit = (user: User) => {
    // TODO: Implement user edit functionality
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La edición de usuarios estará disponible próximamente",
    });
  };

  const handleDelete = (user: User) => {
    // TODO: Implement user deletion
    toast({
      title: "Funcionalidad en desarrollo",
      description: "La eliminación de usuarios estará disponible próximamente",
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleDateString("es-ES", {
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
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(user)}
              data-testid={`button-view-${user.id}`}
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(user)}
              data-testid={`button-edit-${user.id}`}
            >
              <Edit className="h-4 w-4 text-yellow-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user)}
              disabled={user.id === currentUser?.id}
              data-testid={`button-delete-${user.id}`}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Show access denied if not admin
  if (!authLoading && currentUser?.role !== "admin") {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Gestión de Usuarios" subtitle="Administración de usuarios del sistema">
          <Button disabled data-testid="button-add-user">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Header>
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
      <Header title="Gestión de Usuarios" subtitle="Administración de usuarios del sistema">
        <Button data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </Header>

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
    </div>
  );
}
