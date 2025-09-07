import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import { ArrowLeft, Edit, Star, Calendar, CreditCard } from "lucide-react";
import type { Player, MonthlyPayment } from "@shared/schema";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerProfile() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const playerId = params.id;

  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: ["/api/players", playerId],
    enabled: !!playerId,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<MonthlyPayment[]>({
    queryKey: ["/api/players", playerId, "monthly-payments"],
    enabled: !!playerId,
  });

  if (playerLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Perfil de Jugador" subtitle="Información detallada del jugador">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </Header>
        <main className="flex-1 overflow-auto bg-background p-6">
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Jugador No Encontrado" subtitle="El jugador solicitado no existe">
          <Button
            variant="outline"
            onClick={() => setLocation("/players")}
            data-testid="button-back-to-players"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Header>
        <main className="flex-1 overflow-auto bg-background p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground text-lg">
                  No se pudo encontrar el jugador solicitado
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality or navigate to edit page
    setLocation("/players");
  };

  const formatDate = (date: string | null) => {
    if (!date) return "No especificada";
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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

  // Calculate player statistics
  const paidPayments = payments?.filter(p => p.status === "paid") || [];
  const pendingPayments = payments?.filter(p => p.status === "pending") || [];
  const totalPaid = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const averageGoals = 0; // TODO: Implement when match statistics are available

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Perfil de Jugador" subtitle="Información detallada del jugador">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/players")}
            data-testid="button-back-to-players"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <Button
            onClick={handleEdit}
            data-testid="button-edit-player"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Jugador
          </Button>
        </div>
      </Header>

      <main className="flex-1 overflow-auto bg-background p-6">
        {/* Player Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  {(player.profile_image_url || player.profileImageUrl) ? (
                    <img 
                      src={player.profile_image_url || player.profileImageUrl} 
                      alt={player.name}
                      className="w-16 h-16 rounded-full object-cover"
                      data-testid="player-profile-image"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      #{player.jerseyNumber || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground" data-testid="player-name">
                    {player.name}
                  </h1>
                  {player.tagline && (
                    <p className="text-lg text-muted-foreground mb-2" data-testid="player-tagline">
                      {player.tagline}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline" data-testid="player-position">
                      {player.position}
                    </Badge>
                    <Badge variant={player.isActive ? "default" : "secondary"} data-testid="player-status">
                      {player.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    {player.jerseyNumber && (
                      <div className="flex items-center text-muted-foreground">
                        <Star className="h-4 w-4 mr-1" />
                        <span>Número {player.jerseyNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Partidos Jugados</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-matches-played">
                    0
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Goles</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-goals">
                    0
                  </p>
                </div>
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Asistencias</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-assists">
                    0
                  </p>
                </div>
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Promedio Goles</p>
                  <p className="text-3xl font-bold text-foreground" data-testid="stat-goals-average">
                    {averageGoals.toFixed(2)}
                  </p>
                </div>
                <Star className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium" data-testid="player-phone">
                  {player.phoneNumber || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium" data-testid="player-email">
                  {player.email || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                <p className="font-medium" data-testid="player-birth-date">
                  {formatDate(player.birthDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium" data-testid="player-created-at">
                  {formatDate(player.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Historial de Pagos</CardTitle>
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 mb-1">Total Pagado</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="total-paid">
                      €{totalPaid.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-sm text-orange-700 mb-1">Pendientes</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="pending-payments">
                      {pendingPayments.length}
                    </p>
                  </div>
                </div>
              </div>
              
              {paymentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : payments && payments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {payments.slice(0, 6).map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      data-testid={`payment-${payment.id}`}
                    >
                      <div>
                        <p className="font-medium">{payment.month}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.paymentDate ? formatDate(payment.paymentDate) : "Sin fecha"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          €{parseFloat(payment.amount).toFixed(2)}
                        </p>
                        {getStatusBadge(payment.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p>No hay registros de pagos para este jugador</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
