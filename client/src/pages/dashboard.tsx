import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import { Users, Calendar, CreditCard, DollarSign, Bell, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/monthly-payments"],
  });

  if (statsLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" subtitle="Resumen general del equipo">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </Header>
        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Dashboard" subtitle="Resumen general del equipo">
        <div className="flex items-center space-x-4">
          <Button variant="default" data-testid="button-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </Button>
          <Button variant="secondary" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </Header>

      <main className="flex-1 overflow-auto bg-background p-3 md:p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
          <Card>
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs md:text-sm">Jugadores</p>
                  <p className="text-xl md:text-3xl font-bold text-foreground truncate" data-testid="stat-total-players">
                    {stats?.totalPlayers || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 hidden md:block" data-testid="stat-active-players">
                    {stats?.activePlayers || 0} activos
                  </p>
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600 text-sm md:text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Partidos</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-upcoming-matches">
                    {stats?.upcomingMatches || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">próximos</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="text-green-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Mensualidades</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-pending-payments">
                    {stats?.pendingPayments || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">pendientes</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-orange-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Balance</p>
                  <p className="text-3xl font-bold text-green-600" data-testid="stat-current-balance">
                    €{stats?.currentBalance?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">saldo actual</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Próximos Partidos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Próximos Partidos</CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all-matches">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>No hay partidos programados próximamente</p>
              </div>
            </CardContent>
          </Card>

          {/* Últimos Pagos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historial de Pagos</CardTitle>
                <Button variant="ghost" size="sm" data-testid="button-view-all-payments">
                  Ver Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : recentPayments && recentPayments.length > 0 ? (
                <div className="space-y-3">
                  {recentPayments.slice(0, 3).map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground" data-testid={`payment-player-${payment.id}`}>
                          {payment.player.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`payment-month-${payment.id}`}>
                          {payment.month}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground" data-testid={`payment-amount-${payment.id}`}>
                          €{parseFloat(payment.amount).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`payment-status-${payment.id}`}>
                          {payment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No hay pagos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen Financiero */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resumen Financiero</CardTitle>
              <Button variant="ghost" size="sm" data-testid="button-view-financial-details">
                Ver Detalles
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 mb-2">Ingresos Totales</p>
                <p className="text-3xl font-bold text-green-600" data-testid="financial-total-income">
                  €{stats?.totalIncome?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 mb-2">Gastos Totales</p>
                <p className="text-3xl font-bold text-red-600" data-testid="financial-total-expenses">
                  €{stats?.totalExpenses?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">Saldo Actual</p>
                <p className="text-3xl font-bold text-blue-600" data-testid="financial-current-balance">
                  €{stats?.currentBalance?.toFixed(2) || "0.00"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
