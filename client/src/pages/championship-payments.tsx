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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Edit, Trash2, Filter } from "lucide-react";
import { insertChampionshipPaymentSchema } from "@shared/schema";
import type { ChampionshipPayment, Match } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ChampionshipPayments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ChampionshipPayment | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery<(ChampionshipPayment & { match?: Match })[]>({
    queryKey: ["/api/championship-payments"],
  });

  const { data: matches } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const form = useForm({
    resolver: zodResolver(insertChampionshipPaymentSchema),
    defaultValues: {
      matchId: "none",
      concept: "",
      amount: "50.00",
      dueDate: undefined,
      paymentDate: undefined,
      status: "pending",
      paymentMethod: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/championship-payments", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/championship-payments"] });
      toast({
        title: "Éxito",
        description: "Pago registrado correctamente",
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
        description: "Error al registrar pago",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const response = await apiRequest(`/api/championship-payments/${id}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/championship-payments"] });
      toast({
        title: "Éxito",
        description: "Pago actualizado correctamente",
      });
      setIsDialogOpen(false);
      setEditingPayment(null);
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
        description: "Error al actualizar pago",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/championship-payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/championship-payments"] });
      toast({
        title: "Éxito",
        description: "Pago eliminado correctamente",
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
        description: "Error al eliminar pago",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (editingPayment) {
      updateMutation.mutate({ ...data, id: editingPayment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (payment: ChampionshipPayment & { match?: Match }) => {
    setEditingPayment(payment);
    form.reset({
      matchId: payment.matchId || "none",
      concept: payment.concept,
      amount: payment.amount,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : undefined,
      status: payment.status || "pending",
      paymentMethod: payment.paymentMethod || "",
      notes: payment.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (payment: ChampionshipPayment & { match?: Match }) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar este pago?`)) {
      deleteMutation.mutate(payment.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendiente", variant: "secondary" as const },
      paid: { label: "Pagado", variant: "default" as const },
      overdue: { label: "Vencido", variant: "destructive" as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredPayments = payments?.filter(payment => {
    if (statusFilter === "all") return true;
    return payment.status === statusFilter;
  }) || [];

  const columns = [
    {
      accessorKey: "match",
      header: "Partido",
      cell: ({ row }: any) => {
        const payment = row.original;
        return (
          <div className="font-medium" data-testid={`payment-match-${payment.id}`}>
            {payment.match 
              ? `${payment.match.opponent} - ${new Date(payment.match.date).toLocaleDateString("es-ES")}`
              : "Sin partido asignado"
            }
          </div>
        );
      },
    },
    {
      accessorKey: "concept",
      header: "Concepto",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`payment-concept-${row.original.id}`}>
          {row.getValue("concept")}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Monto",
      cell: ({ row }: any) => (
        <div className="font-medium" data-testid={`payment-amount-${row.original.id}`}>
          €{parseFloat(row.getValue("amount")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "dueDate",
      header: "Fecha Vencimiento",
      cell: ({ row }: any) => {
        const date = row.getValue("dueDate");
        return (
          <div className="text-muted-foreground" data-testid={`payment-due-date-${row.original.id}`}>
            {date ? new Date(date).toLocaleDateString("es-ES") : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "paymentDate",
      header: "Fecha Pago",
      cell: ({ row }: any) => {
        const date = row.getValue("paymentDate");
        return (
          <div className="text-muted-foreground" data-testid={`payment-date-${row.original.id}`}>
            {date ? new Date(date).toLocaleDateString("es-ES") : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }: any) => (
        <div data-testid={`payment-status-${row.original.id}`}>
          {getStatusBadge(row.getValue("status"))}
        </div>
      ),
    },
    {
      accessorKey: "paymentMethod",
      header: "Método",
      cell: ({ row }: any) => (
        <div className="text-muted-foreground" data-testid={`payment-method-${row.original.id}`}>
          {row.getValue("paymentMethod") || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }: any) => {
        const payment = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(payment)}
              data-testid={`button-edit-${payment.id}`}
            >
              <Edit className="h-4 w-4 text-yellow-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(payment)}
              data-testid={`button-delete-${payment.id}`}
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
      <Header title="Pagos de Campeonato" subtitle="Gestión de pagos de competición">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-championship-payment">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Pago
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Editar Pago" : "Nuevo Pago"}
              </DialogTitle>
              <DialogDescription>
                {editingPayment
                  ? "Modifica los datos del pago."
                  : "Registra un nuevo pago de campeonato."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="matchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partido (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-match">
                            <SelectValue placeholder="Seleccionar partido" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin partido específico</SelectItem>
                          {matches?.map((match) => (
                            <SelectItem key={match.id} value={match.id}>
                              {match.opponent} - {new Date(match.date).toLocaleDateString("es-ES")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="concept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concepto</FormLabel>
                      <FormControl>
                        <Input placeholder="Inscripción, arbitraje, etc." {...field} data-testid="input-concept" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50.00"
                          {...field}
                          data-testid="input-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Vencimiento</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? (typeof field.value === 'string' ? field.value : new Date(field.value).toISOString().split('T')[0]) : ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                            data-testid="input-due-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Pago</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            value={field.value ? (typeof field.value === 'string' ? field.value : new Date(field.value).toISOString().split('T')[0]) : ""}
                            onChange={(e) => field.onChange(e.target.value || undefined)}
                            data-testid="input-payment-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="paid">Pagado</SelectItem>
                            <SelectItem value="overdue">Vencido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Método de Pago</FormLabel>
                        <FormControl>
                          <Input placeholder="Transferencia, Efectivo..." {...field} data-testid="input-payment-method" />
                        </FormControl>
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
                        <Textarea placeholder="Observaciones adicionales" {...field} data-testid="textarea-notes" />
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
                      setEditingPayment(null);
                      form.reset();
                    }}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-championship-payment"
                  >
                    {editingPayment ? "Actualizar" : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Header>

      <main className="flex-1 overflow-auto bg-background p-6">
        {/* Filter Card */}
        <Card className="p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="overdue">Vencido</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="default" data-testid="button-apply-filter">
              <Filter className="h-4 w-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </Card>

        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={filteredPayments}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
