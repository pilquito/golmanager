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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { insertOpponentSchema } from "@shared/schema";
import type { Opponent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Opponents() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opponents, isLoading } = useQuery<Opponent[]>({
    queryKey: ["/api/opponents"],
  });

  const form = useForm({
    resolver: zodResolver(insertOpponentSchema.omit({ organizationId: true })),
    defaultValues: {
      name: "",
      shortName: "",
      city: "",
      stadium: "",
      colors: "",
      website: "",
      logoUrl: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/opponents", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opponents"] });
      toast({
        title: "Éxito",
        description: "Contrincante creado correctamente",
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
        description: "Error al crear contrincante",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest(`/api/opponents/${id}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opponents"] });
      toast({
        title: "Éxito",
        description: "Contrincante actualizado correctamente",
      });
      setIsDialogOpen(false);
      setEditingOpponent(null);
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
        description: "Error al actualizar contrincante",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/opponents/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opponents"] });
      toast({
        title: "Éxito",
        description: "Contrincante eliminado correctamente",
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
        description: "Error al eliminar contrincante",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingOpponent) {
      updateMutation.mutate({ ...data, id: editingOpponent.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (opponent: Opponent) => {
    setEditingOpponent(opponent);
    form.reset({
      name: opponent.name,
      shortName: opponent.shortName || "",
      city: opponent.city || "",
      stadium: opponent.stadium || "",
      colors: opponent.colors || "",
      website: opponent.website || "",
      logoUrl: opponent.logoUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (opponent: Opponent) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar ${opponent.name}?`)) {
      deleteMutation.mutate(opponent.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingOpponent(null);
    form.reset();
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          {row.original.logoUrl && (
            <img 
              src={row.original.logoUrl} 
              alt={row.original.name}
              className="w-6 h-6 rounded object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "shortName",
      header: "Abreviatura",
    },
    {
      accessorKey: "city",
      header: "Ciudad",
    },
    {
      accessorKey: "stadium",
      header: "Estadio",
    },
    {
      accessorKey: "source",
      header: "Origen",
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded text-xs ${
          row.original.source === 'liga_hesperides' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.source === 'liga_hesperides' ? 'Liga Hespérides' : 'Manual'}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleEdit(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Contrincantes" subtitle="Gestión de equipos rivales" />
        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Contrincantes" subtitle="Gestión de equipos rivales" />

      <main className="flex-1 overflow-auto bg-background p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {opponents?.length || 0} equipos rivales
              </h3>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setEditingOpponent(null); form.reset(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Contrincante
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOpponent ? "Editar Contrincante" : "Nuevo Contrincante"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingOpponent 
                        ? "Modifica los datos del equipo rival"
                        : "Añade un nuevo equipo rival a tu lista"
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Equipo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Club Deportivo Ejemplo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="shortName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Abreviatura</FormLabel>
                              <FormControl>
                                <Input placeholder="CDE" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="colors"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Colores</FormLabel>
                              <FormControl>
                                <Input placeholder="Rojo y Blanco" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ciudad</FormLabel>
                              <FormControl>
                                <Input placeholder="Santa Cruz" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="stadium"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Estadio</FormLabel>
                              <FormControl>
                                <Input placeholder="Campo Municipal" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL del Logo</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sitio Web</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleDialogClose}>
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {editingOpponent ? "Guardar Cambios" : "Crear Contrincante"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <DataTable 
              columns={columns} 
              data={opponents || []} 
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
