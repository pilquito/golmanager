import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOtherPaymentSchema, type OtherPayment, type InsertOtherPayment } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, TrendingUp, TrendingDown, DollarSign, Filter, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function OtherPaymentsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<OtherPayment | null>(null);
  const [dateStart, setDateStart] = useState("05/06/2025");
  const [dateEnd, setDateEnd] = useState("05/09/2025");
  const [typeFilter, setTypeFilter] = useState("Todos");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: otherPayments = [], isLoading } = useQuery({
    queryKey: ["/api/other-payments"],
  });

  const form = useForm<InsertOtherPayment>({
    resolver: zodResolver(insertOtherPaymentSchema),
    defaultValues: {
      concept: "",
      amount: "0",
      type: "income",
      paymentDate: "",
      paymentMethod: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOtherPayment) => {
      return await apiRequest("/api/other-payments", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/other-payments"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Registro creado",
        description: "El pago ha sido registrado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear el registro",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<InsertOtherPayment>) => {
      return await apiRequest(`/api/other-payments/${id}`, "PATCH", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/other-payments"] });
      setEditingPayment(null);
      form.reset();
      toast({
        title: "Registro actualizado",
        description: "El pago ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el registro",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/other-payments/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/other-payments"] });
      toast({
        title: "Registro eliminado",
        description: "El pago ha sido eliminado exitosamente",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el registro",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertOtherPayment) => {
    if (editingPayment) {
      updateMutation.mutate({ id: editingPayment.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEdit = (payment: OtherPayment) => {
    setEditingPayment(payment);
    form.reset({
      concept: payment.concept,
      amount: payment.amount,
      type: payment.type,
      paymentDate: payment.paymentDate || "",
      paymentMethod: payment.paymentMethod || "",
      notes: payment.notes || "",
    });
    setIsCreateDialogOpen(true);
  };

  const cancelEdit = () => {
    setEditingPayment(null);
    form.reset();
    setIsCreateDialogOpen(false);
  };

  // Calculate totals
  const totalIncome = otherPayments
    .filter((p: OtherPayment) => p.type === "income")
    .reduce((sum: number, p: OtherPayment) => sum + Number(p.amount), 0);
  
  const totalExpenses = otherPayments
    .filter((p: OtherPayment) => p.type === "expense")
    .reduce((sum: number, p: OtherPayment) => sum + Number(p.amount), 0);
  
  const balance = totalIncome - totalExpenses;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Otros Pagos e Ingresos</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" data-testid="button-new-payment">
              <Plus className="h-4 w-4" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Editar Registro" : "Nuevo Registro"}
              </DialogTitle>
              <DialogDescription>
                {editingPayment ? "Modifica los datos del registro" : "Registra un nuevo pago o ingreso"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="concept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concepto *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Descripción del pago/ingreso"
                          data-testid="input-concept"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importe *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            step="0.01"
                            placeholder="0.00"
                            data-testid="input-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Selecciona tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">Ingreso</SelectItem>
                            <SelectItem value="expense">Gasto</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="date"
                            data-testid="input-payment-date"
                          />
                        </FormControl>
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
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-payment-method">
                              <SelectValue placeholder="Método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
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
                        <Textarea 
                          {...field} 
                          placeholder="Información adicional..."
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-payment"
                  >
                    {editingPayment ? "Actualizar" : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">€{totalIncome.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€{totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldos</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              €{balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex gap-4 items-end p-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Inicio</label>
            <Input 
              type="date" 
              value={dateStart} 
              onChange={(e) => setDateStart(e.target.value)}
              className="w-40"
              data-testid="input-date-start"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fecha Fin</label>
            <Input 
              type="date" 
              value={dateEnd} 
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-40"
              data-testid="input-date-end"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32" data-testid="select-type-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="income">Ingresos</SelectItem>
                <SelectItem value="expense">Gastos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="flex items-center gap-2" data-testid="button-filter">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
          <CardDescription>
            {otherPayments.length === 0 
              ? "No hay registros que coincidan con los filtros seleccionados."
              : `${otherPayments.length} registro(s) encontrado(s)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : otherPayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No hay registros que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-3">
              {otherPayments.map((payment: OtherPayment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{payment.concept}</h3>
                      <Badge variant={payment.type === 'income' ? 'default' : 'destructive'}>
                        {payment.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {payment.paymentDate && (
                        <div>Fecha: {format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: es })}</div>
                      )}
                      {payment.paymentMethod && (
                        <div>Método: {payment.paymentMethod}</div>
                      )}
                      {payment.notes && (
                        <div>Notas: {payment.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${payment.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      €{Number(payment.amount).toFixed(2)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(payment)}
                        data-testid={`button-edit-${payment.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(payment.id)}
                        data-testid={`button-delete-${payment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}