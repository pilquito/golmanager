import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Header from "@/components/layout/header";
import { DataTable } from "@/components/ui/data-table";
import { Plus, Edit, Trash2, Filter, RefreshCcw, Info } from "lucide-react";
import { insertMonthlyPaymentSchema } from "@shared/schema";
import type { MonthlyPayment, Player } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function MonthlyPayments() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<MonthlyPayment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery<(MonthlyPayment & { player: Player })[]>({
    queryKey: ["/api/monthly-payments"],
  });

  const { data: players } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });

  const { data: teamConfig } = useQuery({
    queryKey: ["/api/team-config"],
  });

  const form = useForm({
    resolver: zodResolver(insertMonthlyPaymentSchema),
    defaultValues: {
      playerId: "",
      month: "",
      amount: "15.00",
      dueDate: undefined,
      paymentDate: undefined,
      status: "pending",
      paymentMethod: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/monthly-payments", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-payments"] });
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
      const response = await apiRequest("PATCH", `/api/monthly-payments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-payments"] });
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
      await apiRequest("DELETE", `/api/monthly-payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-payments"] });
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

  const handleEdit = (payment: MonthlyPayment & { player: Player }) => {
    setEditingPayment(payment);
    form.reset({
      playerId: payment.playerId,
      month: payment.month,
      amount: payment.amount,
      dueDate: payment.dueDate ? new Date(payment.dueDate) : undefined,
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate) : undefined,
      status: payment.status || "pending",
      paymentMethod: payment.paymentMethod || "",
      notes: payment.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (payment: MonthlyPayment & { player: Player }) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el pago de ${payment.player.name}?`)) {
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

  const columns = [
    {
      accessorKey: "player.name",
      header: "Jugador",
      cell: ({ row }: any) => (
        <div className="font-medium" data-testid={`payment-player-${row.original.id}`}>
          {row.original.player.name}
        </div>
      ),
    },
    {
      accessorKey: "month",
      header: "Mes",
      cell: ({ row }: any) => (
        <div className="font-medium" data-testid={`payment-month-${row.original.id}`}>
          {row.getValue("month")}
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
      <Header title="Control de Mensualidades" subtitle="Control de pagos mensuales">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="button-add-payment">
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
                  : "Registra un nuevo pago mensual."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="playerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jugador</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-player">
                            <SelectValue placeholder="Seleccionar jugador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {players?.map((player) => (
                            <SelectItem key={player.id} value={player.id}>
                              {player.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mes (YYYY-MM)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="2025-01"
                            {...field}
                            data-testid="input-month"
                          />
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
                            placeholder="15.00"
                            {...field}
                            data-testid="input-amount"
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
                          <Input placeholder="Efectivo, Transferencia..." {...field} data-testid="input-payment-method" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                    data-testid="button-save-payment"
                  >
                    {editingPayment ? "Actualizar" : "Registrar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </Header>

      <main className="flex-1 overflow-auto bg-background p-3 md:p-6">
        {/* Configuration Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Mensualidad: ${teamConfig?.monthlyFee || "15.00"}</CardTitle>
                <p className="text-muted-foreground">
                  {teamConfig?.paymentDueDay 
                    ? `Vencimiento día ${teamConfig.paymentDueDay} de cada mes`
                    : "Fecha límite no configurada"
                  }
                </p>
              </div>
              <div className="flex space-x-3">
                <Button variant="default" data-testid="button-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
                <Button variant="secondary" data-testid="button-refresh">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Renovar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Results */}
        {payments && payments.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Info className="text-blue-600 mr-3" />
                  <p className="text-blue-800" data-testid="no-payments-message">
                    No hay pagos registrados que coincidan con los filtros seleccionados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={payments || []}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
