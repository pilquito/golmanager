import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Edit, Trash2, Eye, Users, FileText } from "lucide-react";
import { insertMatchSchema } from "@shared/schema";
import type { Match } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Matches() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  // Query para obtener todas las asistencias de todos los partidos
  const { data: allAttendances } = useQuery({
    queryKey: ["/api/attendances", matches?.map((m: Match) => m.id) || []],
    queryFn: async () => {
      const promises = matches?.map(async (match: Match) => {
        try {
          const response = await apiRequest(`/api/matches/${match.id}/attendances`, "GET");
          const attendances = await response.json();
          return { matchId: match.id, attendances };
        } catch {
          return { matchId: match.id, attendances: [] };
        }
      }) || [];
      return Promise.all(promises);
    },
    enabled: !!matches && matches.length > 0,
  });

  const form = useForm({
    resolver: zodResolver(insertMatchSchema),
    defaultValues: {
      date: new Date(),
      opponent: "",
      venue: "",
      competition: "",
      ourScore: undefined,
      opponentScore: undefined,
      status: "scheduled",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/matches", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Éxito",
        description: "Partido creado correctamente",
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
        description: "Error al crear partido",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest("PATCH", `/api/matches/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Éxito",
        description: "Partido actualizado correctamente",
      });
      setIsDialogOpen(false);
      setEditingMatch(null);
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
        description: "Error al actualizar partido",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/matches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Éxito",
        description: "Partido eliminado correctamente",
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
        description: "Error al eliminar partido",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingMatch) {
      updateMutation.mutate({ ...data, id: editingMatch.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (match: Match) => {
    setEditingMatch(match);
    form.reset({
      date: new Date(match.date),
      opponent: match.opponent,
      venue: match.venue,
      competition: match.competition,
      ourScore: match.ourScore || undefined,
      opponentScore: match.opponentScore || undefined,
      status: match.status || "scheduled",
      notes: match.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (match: Match) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el partido contra ${match.opponent}?`)) {
      deleteMutation.mutate(match.id);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      scheduled: { label: "Programado", variant: "outline" as const },
      played: { label: "Jugado", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.scheduled;
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const columns = [
    {
      accessorKey: "date",
      header: "Fecha",
      cell: ({ row }: any) => (
        <div className="font-medium" data-testid={`match-date-${row.original.id}`}>
          {formatDate(row.getValue("date"))}
        </div>
      ),
    },
    {
      accessorKey: "opponent",
      header: "Rival",
      cell: ({ row }: any) => (
        <div className="font-medium" data-testid={`match-opponent-${row.original.id}`}>
          {row.getValue("opponent")}
        </div>
      ),
    },
    {
      accessorKey: "venue",
      header: "Lugar",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`match-venue-${row.original.id}`}>
          {row.getValue("venue")}
        </div>
      ),
    },
    {
      accessorKey: "competition",
      header: "Competición",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`match-competition-${row.original.id}`}>
          {row.getValue("competition")}
        </div>
      ),
    },
    {
      id: "result",
      header: "Resultado",
      cell: ({ row }: any) => {
        const match = row.original;
        return (
          <div className="font-medium" data-testid={`match-result-${match.id}`}>
            {match.ourScore !== null && match.opponentScore !== null
              ? `${match.ourScore} - ${match.opponentScore}`
              : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }: any) => (
        <div data-testid={`match-status-${row.original.id}`}>
          {getStatusBadge(row.getValue("status"))}
        </div>
      ),
    },
    {
      id: "attendances",
      header: "Convocados",
      cell: ({ row }: any) => {
        const match = row.original;
        const matchAttendances = allAttendances?.find((a: any) => a.matchId === match.id)?.attendances || [];
        const confirmedCount = matchAttendances.filter((a: any) => a.status === 'confirmed').length;
        
        return (
          <div className="flex items-center space-x-1" data-testid={`match-attendances-${match.id}`}>
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              {confirmedCount}
            </span>
            <span className="text-xs text-muted-foreground">
              confirmado{confirmedCount !== 1 ? 's' : ''}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }: any) => {
        const match = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/match-sheet/${match.id}`)}
              data-testid={`button-match-sheet-${match.id}`}
              title="Ficha de Partido"
            >
              <FileText className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(match)}
              data-testid={`button-edit-${match.id}`}
            >
              <Edit className="h-4 w-4 text-yellow-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(match)}
              data-testid={`button-delete-${match.id}`}
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
      <Header title="Partidos" subtitle="Calendario y resultados de partidos">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-match">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Partido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingMatch ? "Editar Partido" : "Nuevo Partido"}
              </DialogTitle>
              <DialogDescription>
                {editingMatch
                  ? "Modifica los datos del partido."
                  : "Completa los datos del nuevo partido."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                          data-testid="input-match-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="opponent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rival</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del equipo rival" {...field} data-testid="input-opponent" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lugar</FormLabel>
                      <FormControl>
                        <Input placeholder="Estadio o lugar del partido" {...field} data-testid="input-venue" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="competition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Competición</FormLabel>
                      <FormControl>
                        <Input placeholder="Liga, torneo o competición" {...field} data-testid="input-competition" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ourScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nuestros Goles</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-our-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="opponentScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goles Rival</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-opponent-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="scheduled">Programado</SelectItem>
                            <SelectItem value="played">Jugado</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Observaciones del partido" {...field} data-testid="textarea-notes" />
                      </FormControl>
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
                      setEditingMatch(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-match"
                  >
                    {editingMatch ? "Actualizar" : "Crear"}
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
                data={matches || []}
                isLoading={isLoading}
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
