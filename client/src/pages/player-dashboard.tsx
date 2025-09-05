import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, CreditCard, Users, Trophy, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlayerDashboard() {
  const { user } = useAuth();
  
  const { data: playerData, isLoading: playerLoading } = useQuery({
    queryKey: [`/api/players/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: upcomingMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches"],
  });

  const { data: playerPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: [`/api/monthly-payments/player/${playerData?.id}`],
    enabled: !!playerData?.id,
  });

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
        <div className="container mx-auto p-4 space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const pendingPayments = playerPayments?.filter((p: any) => p.status === 'pending') || [];
  const nextMatches = upcomingMatches?.filter((m: any) => m.status === 'scheduled').slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      {/* Header con perfil del jugador */}
      <div className="bg-blue-900 text-white p-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            {playerData?.profileImageUrl ? (
              <img 
                src={playerData.profileImageUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full object-cover"
                data-testid="player-profile-image"
              />
            ) : (
              <User className="w-12 h-12 text-blue-900" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="player-name">
              {playerData?.name || user?.firstName || "Jugador"}
            </h1>
            <p className="text-blue-200 text-sm" data-testid="player-age">
              {playerData?.age ? `${playerData.age} años` : ""}
            </p>
            <p className="text-blue-300 font-medium" data-testid="player-nickname">
              "{playerData?.nickname || 'Deportista'}"
            </p>
          </div>
        </div>
      </div>

      {/* Información del equipo */}
      <div className="bg-gray-100 p-6 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">
            GFC
          </div>
          <h2 className="text-xl font-bold text-gray-800" data-testid="team-name">
            GOLMANAGER FC
          </h2>
          <p className="text-gray-600" data-testid="player-position">
            {playerData?.position || "Sin posición asignada"}
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600" data-testid="pending-payments-count">
                    {pendingPayments.length}
                  </p>
                  <p className="text-xs text-gray-600">Pagos Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex flex-col items-center space-y-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600" data-testid="next-matches-count">
                    {nextMatches.length}
                  </p>
                  <p className="text-xs text-gray-600">Próximos Partidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas del jugador */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Estadísticas de jugador</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No hay datos para mostrar</p>
            </div>
          </CardContent>
        </Card>

        {/* Mi competición */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Mi competición</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12"
              data-testid="button-classification"
            >
              <span>Clasificación</span>
              <span>→</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12"
              data-testid="button-calendar"
            >
              <span>Calendario</span>
              <span>→</span>
            </Button>
          </CardContent>
        </Card>

        {/* Próximos partidos */}
        {nextMatches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Próximos Partidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextMatches.map((match: any) => (
                <div key={match.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium" data-testid={`match-opponent-${match.id}`}>
                      vs {match.opponent}
                    </p>
                    <p className="text-sm text-gray-600" data-testid={`match-date-${match.id}`}>
                      {new Date(match.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" data-testid={`match-status-${match.id}`}>
                    {match.competition}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pagos pendientes */}
        {pendingPayments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Pagos Pendientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium" data-testid={`payment-month-${payment.id}`}>
                      {payment.month}
                    </p>
                    <p className="text-sm text-gray-600" data-testid={`payment-due-${payment.id}`}>
                      Vence: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600" data-testid={`payment-amount-${payment.id}`}>
                      €{parseFloat(payment.amount).toFixed(2)}
                    </p>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}