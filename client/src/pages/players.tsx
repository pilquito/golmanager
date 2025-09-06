import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Eye, Pencil, Trash2, Archive, User } from "lucide-react";
import { insertPlayerSchema } from "@shared/schema";
import type { Player } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function Players() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const form = useForm({
    resolver: zodResolver(insertPlayerSchema),
    defaultValues: {
      name: "",
      jerseyNumber: 1,
      position: "",
      phoneNumber: "",
      email: "",
      tagline: "",
      birthDate: "",
      isActive: true,
      profileImageUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/players", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Éxito",
        description: "Jugador creado correctamente",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
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
        title: "Error",
        description: "Error al crear jugador",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest(`/api/players/${id}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Éxito",
        description: "Jugador actualizado correctamente",
      });
      setIsDialogOpen(false);
      setEditingPlayer(null);
      form.reset();
    },
    onError: (error) => {
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
        title: "Error",
        description: "Error al actualizar jugador",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/players/${id}`, "DELETE");
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Éxito",
        description: "Jugador eliminado correctamente",
      });
    },
    onError: (error) => {
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
        title: "Error",
        description: "Error al eliminar jugador",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/players/${id}`, "PATCH", { isActive: false });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Éxito",
        description: "Jugador archivado correctamente",
      });
    },
    onError: (error) => {
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
        title: "Error",
        description: "Error al archivar jugador",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingPlayer) {
      updateMutation.mutate({ ...data, id: editingPlayer.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    form.reset({
      name: player.name,
      jerseyNumber: player.jerseyNumber || 1,
      position: player.position,
      phoneNumber: player.phoneNumber || "",
      email: player.email || "",
      tagline: player.tagline || "",
      birthDate: player.birthDate ? new Date(player.birthDate).toISOString().slice(0, 10) : "",
      isActive: player.isActive ?? true,
      profileImageUrl: player.profileImageUrl || "",
    });
    setIsDialogOpen(true);
  };

  // Handle photo upload
  const handlePhotoUpload = async (file: File, purpose?: string) => {
    try {
      const response = await apiRequest("/api/upload/url", "POST", {
        fileName: file.name,
        contentType: file.type,
        purpose: purpose || 'profile'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
        objectPath: data.objectPath,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const onPhotoUploadComplete = (result: any) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      form.setValue("profileImageUrl", uploadedFile.objectPath);
      toast({
        title: "Foto subida",
        description: "La foto se guardará cuando actualices el jugador.",
      });
    }
  };

  const handleView = (player: Player) => {
    setLocation(`/players/${player.id}`);
  };

  const handleDelete = async (player: Player) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${player.name}?`)) {
      deleteMutation.mutate(player.id);
    }
  };

  const handleArchive = async (player: Player) => {
    if (window.confirm(`¿Archivar a ${player.name}? Podrás reactivarlo después.`)) {
      archiveMutation.mutate(player.id);
    }
  };

  const columns = [
    {
      accessorKey: "photo",
      header: "Foto",
      cell: ({ row }: any) => {
        const player = row.original;
        return (
          <div className="flex items-center justify-center w-10 h-10">
            {(player.profile_image_url || player.profileImageUrl) ? (
              <img 
                src={player.profile_image_url || player.profileImageUrl} 
                alt={player.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                data-testid={`player-photo-${player.id}`}
              />
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "jerseyNumber",
      header: "#",
      cell: ({ row }: any) => (
        <div className="font-medium" data-testid={`player-number-${row.original.id}`}>
          {row.getValue("jerseyNumber") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }: any) => (
        <div className="font-medium" data-testid={`player-name-${row.original.id}`}>
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "position",
      header: "Posición",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`player-position-${row.original.id}`}>
          {row.getValue("position")}
        </div>
      ),
    },
    {
      accessorKey: "phoneNumber",
      header: "Teléfono",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`player-phone-${row.original.id}`}>
          {row.getValue("phoneNumber") || "No especificado"}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ row }: any) => (
        <Badge
          variant={row.getValue("isActive") ? "default" : "secondary"}
          data-testid={`player-status-${row.original.id}`}
        >
          {row.getValue("isActive") ? "Activo" : "Inactivo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }: any) => {
        const player = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(player)}
              data-testid={`button-view-${player.id}`}
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(player)}
              data-testid={`button-edit-${player.id}`}
            >
              <Pencil className="h-4 w-4 text-yellow-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleArchive(player)}
              data-testid={`button-archive-${player.id}`}
            >
              <Archive className="h-4 w-4 text-orange-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(player)}
              data-testid={`button-delete-${player.id}`}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Jugadores" subtitle="Gestión de plantilla del equipo">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-player">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Jugador
            </Button>
          </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPlayer ? "Editar Jugador" : "Nuevo Jugador"}
              </DialogTitle>
              <DialogDescription>
                {editingPlayer
                  ? "Modifica los datos del jugador."
                  : "Completa los datos del nuevo jugador."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del jugador" {...field} data-testid="input-player-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jerseyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            data-testid="input-jersey-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Posición</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-position">
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Portero">Portero</SelectItem>
                            <SelectItem value="Defensa">Defensa</SelectItem>
                            <SelectItem value="Mediocampista">Mediocampista</SelectItem>
                            <SelectItem value="Delantero">Delantero</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de teléfono" {...field} data-testid="input-phone-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Correo electrónico" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-eslogan (ej: "Deportista")</FormLabel>
                      <FormControl>
                        <Input placeholder="Deportista, Atleta, etc." {...field} data-testid="input-tagline" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-birth-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Foto del jugador */}
                <FormField
                  control={form.control}
                  name="profileImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foto del Jugador</FormLabel>
                      <div className="space-y-3">
                        {field.value && (
                          <div className="flex items-center space-x-3">
                            <img 
                              src={field.value} 
                              alt="Foto del jugador" 
                              className="w-16 h-16 rounded-full object-cover border"
                            />
                            <div className="text-sm text-muted-foreground">
                              Foto actual del jugador
                            </div>
                          </div>
                        )}
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={handlePhotoUpload}
                          onComplete={onPhotoUploadComplete}
                          acceptedFileTypes="image/*"
                          purpose="profile"
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{field.value ? "Cambiar Foto" : "Subir Foto"}</span>
                          </div>
                        </ObjectUploader>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingPlayer(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-player"
                  >
                    {editingPlayer ? "Actualizar" : "Crear"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
            </DialogContent>
          </Dialog>
      </Header>

      <main className="flex-1 overflow-auto bg-background p-3 md:p-6">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={players || []}
                isLoading={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
