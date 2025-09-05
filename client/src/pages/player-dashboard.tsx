import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, CreditCard, Users, Trophy, User, Target, Zap, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TeamConfig } from "@shared/schema";

export default function PlayerDashboard() {
  const { user } = useAuth();
  
  const { data: playerData, isLoading: playerLoading } = useQuery({
    queryKey: [`/api/players/user/${user?.id}`],
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  const playerInfo = playerData as any;

  const { data: upcomingMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches"],
  });

  const { data: playerPayments, isLoading: paymentsLoading } = useQuery({
    queryKey: [`/api/monthly-payments/player/${playerInfo?.id}`],
    enabled: !!playerInfo?.id,
    refetchOnWindowFocus: true,
  });

  const { data: teamConfig, isLoading: teamConfigLoading } = useQuery<TeamConfig>({
    queryKey: ["/api/team-config"],
  });

  if (playerLoading || teamConfigLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-700 to-green-600">
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

  const teamColors = teamConfig?.teamColors?.split(',') || ['#dc2626', '#ffffff'];
  const primaryColor = teamColors[0] || '#dc2626';
  const secondaryColor = teamColors[1] || '#ffffff';

  const pendingPayments = (playerPayments as any)?.filter((p: any) => p.status === 'pending') || [];
  const nextMatch = (upcomingMatches as any)?.filter((m: any) => m.status === 'scheduled')?.[0] || null; // Solo el próximo partido

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `
          linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 50%, transparent 100%),
          url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?q=80&w=2070&auto=format&fit=crop')
        `,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat'
      }}
    >
      {/* Overlay adicional para mejor contraste */}
      <div className="absolute inset-0 bg-black/10" />
      
      {/* Header con efecto de estadio */}
      <div className="relative overflow-hidden">
        {/* Líneas del campo de fútbol */}
        <div className="absolute inset-0 opacity-15">
          {/* Línea central horizontal */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white transform -translate-y-1/2" />
          {/* Círculo central */}
          <div className="absolute left-1/2 top-1/2 w-24 h-24 border border-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        {/* Stadium-style header */}
        <div className="relative p-6 text-center text-white">
          <div className="flex flex-col items-center space-y-6">
            {/* Logo del equipo */}
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl border-4 border-white/30"
                style={{ backgroundColor: primaryColor }}
              >
                {teamConfig?.logoUrl ? (
                  <img 
                    src={teamConfig.logoUrl} 
                    alt={teamConfig.teamName} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  teamConfig?.teamName?.substring(0, 3).toUpperCase() || "GFC"
                )}
              </div>
              {/* Efecto de estadio */}
              <div className="absolute -inset-2 rounded-full bg-white/20 animate-pulse" />
            </div>

            {/* Nombre del equipo */}
            <div>
              <h1 className="text-3xl font-bold tracking-wider drop-shadow-lg" data-testid="team-name">
                {teamConfig?.teamName || "GOLMANAGER FC"}
              </h1>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className="w-8 h-1 bg-white/60 rounded" />
                <Trophy className="w-5 h-5 text-yellow-300" />
                <div className="w-8 h-1 bg-white/60 rounded" />
              </div>
            </div>

            {/* Perfil del jugador */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 w-full max-w-sm border border-white/20">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                  {(user as any)?.profileImageUrl ? (
                    <img 
                      src={(user as any).profileImageUrl} 
                      alt="Profile" 
                      className="w-14 h-14 rounded-full object-cover"
                      data-testid="player-profile-image"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold" data-testid="player-name">
                    {`${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || "Jugador"}
                  </h2>
                  <p className="text-white/80 text-sm" data-testid="player-nickname">
                    {playerInfo?.tagline || 'Deportista'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-white/20 text-white border-white/30"
                      data-testid="player-position"
                    >
                      {(playerData as any)?.position || "Sin posición"}
                    </Badge>
                    {playerInfo?.jerseyNumber && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-white/20 text-white border-white/30"
                        data-testid="player-number"
                      >
                        #{playerInfo.jerseyNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="relative container mx-auto p-4 space-y-6">
        {/* Stats Cards con estilo futbolero */}
        <div className="grid grid-cols-3 gap-3">
          {/* Pagos Pendientes */}
          <Card className="bg-red-500/30 backdrop-blur-md border border-white/20 shadow-lg">
            <CardContent className="p-3 text-center text-white">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold drop-shadow-lg" data-testid="pending-payments-count">
                    {pendingPayments.length}
                  </p>
                  <p className="text-xs opacity-90 drop-shadow-md">Pagos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partidos Totales */}
          <Card className="bg-blue-500/30 backdrop-blur-md border border-white/20 shadow-lg">
            <CardContent className="p-3 text-center text-white">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold drop-shadow-lg" data-testid="total-matches-count">
                    {(upcomingMatches as any)?.length || 0}
                  </p>
                  <p className="text-xs opacity-90 drop-shadow-md">Partidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rendimiento (placeholder) */}
          <Card className="bg-green-500/30 backdrop-blur-md border border-white/20 shadow-lg">
            <CardContent className="p-3 text-center text-white">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl font-bold drop-shadow-lg" data-testid="player-performance">
                    100%
                  </p>
                  <p className="text-xs opacity-90 drop-shadow-md">Activo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas del jugador */}
        <Card className="bg-white/70 backdrop-blur-md border border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Trophy className="w-5 h-5" />
              <span>Estadísticas de jugador</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay datos para mostrar</p>
            </div>
          </CardContent>
        </Card>

        {/* Mi competición */}
        <Card className="bg-white/70 backdrop-blur-md border border-white/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-800">
              <Users className="w-5 h-5" />
              <span>Mi competición</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 hover:bg-white/20"
              data-testid="button-classification"
            >
              <span>Clasificación</span>
              <span>→</span>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-12 hover:bg-white/20"
              data-testid="button-calendar"
            >
              <span>Calendario</span>
              <span>→</span>
            </Button>
          </CardContent>
        </Card>

        {/* PRÓXIMO PARTIDO - Solo el siguiente */}
        {nextMatch ? (
          <Card 
            className="relative overflow-hidden backdrop-blur-lg bg-white/20 border border-white/30 shadow-xl"
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l4-4v3h4v2h-4v3l-4-4z"/>
              </svg>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span>Próximo Partido</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Enfrentamiento */}
              <div className="flex items-center justify-center space-x-6 py-4">
                {/* Equipo local */}
                <div className="flex flex-col items-center space-y-2">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {teamConfig?.teamName?.substring(0, 3).toUpperCase() || "GFC"}
                  </div>
                  <p className="text-sm font-medium text-center">
                    {teamConfig?.teamName || "Mi Equipo"}
                  </p>
                </div>
                
                {/* VS */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-2xl font-bold text-gray-600">VS</div>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    data-testid={`match-competition-${nextMatch.id}`}
                  >
                    {nextMatch.competition}
                  </Badge>
                </div>
                
                {/* Equipo rival */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs shadow-lg">
                    {nextMatch.opponent.substring(0, 3).toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-center" data-testid={`match-opponent-${nextMatch.id}`}>
                    {nextMatch.opponent}
                  </p>
                </div>
              </div>
              
              {/* Detalles del partido */}
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 space-y-3 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium" data-testid={`match-date-${nextMatch.id}`}>
                      {new Date(nextMatch.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long'
                      })}
                    </span>
                  </div>
                  <span className="text-lg font-bold">
                    {new Date(nextMatch.date).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm" data-testid={`match-venue-${nextMatch.id}`}>
                    {nextMatch.venue || "Por confirmar"}
                  </span>
                </div>
                
                {/* Botón de confirmación (preparado para futuro módulo) */}
                <Button 
                  className="w-full mt-4" 
                  style={{ backgroundColor: primaryColor }}
                  data-testid="button-confirm-assistance"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Confirmar Asistencia
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="text-center py-8">
            <CardContent>
              <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No hay partidos programados</p>
            </CardContent>
          </Card>
        )}

        {/* Pagos pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-orange-600">
              Pagos Pendientes ({pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.length > 0 ? (
              <>
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
              </>
            ) : (
              <p className="text-green-600 text-center py-4">
                ¡No tienes pagos pendientes!
              </p>
            )}
            <div className="pt-3 border-t">
              <button 
                onClick={() => window.location.href = '/payments-history'}
                className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                data-testid="button-view-payment-history"
              >
                Ver historial completo de pagos →
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}