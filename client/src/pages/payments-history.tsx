import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, CreditCard, ArrowLeft, CheckCircle, Clock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsHistory() {
  const { user } = useAuth();
  
  const { data: playerData, isLoading: playerLoading } = useQuery({
    queryKey: [`/api/players/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const playerInfo = playerData as any;

  const { data: allPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: [`/api/monthly-payments/player/${playerInfo?.id}`],
    enabled: !!playerInfo?.id,
  });

  const handleGoBack = () => {
    window.history.back();
  };

  if (playerLoading || paymentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-6">
        <div className="container mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-4 text-white mb-6">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const payments = (allPayments as any) || [];
  const paidPayments = payments.filter((p: any) => p.status === 'paid');
  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const overduePayments = payments.filter((p: any) => p.status === 'overdue');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'overdue':
        return 'Vencido';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-6">
      <div className="container mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 text-white mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="text-white hover:bg-white/20"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" data-testid="page-title">
              Historial de Pagos
            </h1>
            <p className="text-blue-200">
              Resumen completo de tus cuotas mensuales
            </p>
          </div>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-800" data-testid="paid-count">
                {paidPayments.length}
              </p>
              <p className="text-sm text-green-700">Pagados</p>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-100 border-yellow-200">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-800" data-testid="pending-count">
                {pendingPayments.length}
              </p>
              <p className="text-sm text-yellow-700">Pendientes</p>
            </CardContent>
          </Card>
          
          <Card className="bg-red-100 border-red-200">
            <CardContent className="p-4 text-center">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-800" data-testid="overdue-count">
                {overduePayments.length}
              </p>
              <p className="text-sm text-red-700">Vencidos</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Historial Completo ({payments.length} registros)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((payment: any) => (
                  <div 
                    key={payment.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(payment.status)}`}
                    data-testid={`payment-item-${payment.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(payment.status)}
                      <div>
                        <p className="font-semibold text-gray-900" data-testid={`payment-month-${payment.id}`}>
                          {payment.month}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cuota mensual
                        </p>
                        {payment.paymentDate && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Pagado: {new Date(payment.paymentDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg" data-testid={`payment-amount-${payment.id}`}>
                        €{payment.amount}
                      </p>
                      <Badge 
                        variant={getStatusBadgeVariant(payment.status)}
                        data-testid={`payment-status-${payment.id}`}
                      >
                        {getStatusText(payment.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No hay registros de pagos disponibles
                </p>
                <p className="text-gray-400 text-sm">
                  Los pagos aparecerán aquí cuando sean registrados
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Información de Pagos
                </h3>
                <p className="text-sm text-blue-700">
                  Para realizar un pago o consultar dudas sobre tu facturación, 
                  contacta con el administrador del equipo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}