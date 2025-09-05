import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, CreditCard, Users, Trophy, User, Target, Zap, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TeamConfig } from "@shared/schema";

export default function PlayerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
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

  // Mutation para confirmar asistencia
  const confirmAttendanceMutation = useMutation({
    mutationFn: async ({ matchId, playerId, status }: { matchId: string; playerId: string; status: string }) => {
      return apiRequest("/api/attendances", {
        method: "POST",
        body: JSON.stringify({
          matchId,
          playerId,
          status,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Asistencia confirmada!",
        description: "Tu asistencia al partido ha sido registrada exitosamente.",
      });
      // Invalidar queries relacionadas si es necesario
      queryClient.invalidateQueries({ queryKey: ["/api/attendances"] });
    },
    onError: (error) => {
      console.error("Error confirming attendance:", error);
      toast({
        title: "Error",
        description: "No se pudo confirmar tu asistencia. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleConfirmAttendance = (match: any) => {
    if (!playerInfo?.id) {
      toast({
        title: "Error",
        description: "No se pudo encontrar tu perfil de jugador.",
        variant: "destructive",
      });
      return;
    }
    
    confirmAttendanceMutation.mutate({
      matchId: match.id,
      playerId: playerInfo.id,
      status: "confirmed",
    });
  };

  if (playerLoading || teamConfigLoading) {
    return (
      <div 
        className="min-h-screen relative"
        style={{
          backgroundColor: '#2d5016',
          backgroundImage: "url('/attached_assets/stadium-background.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/15" />
        <div className="relative container mx-auto p-4 space-y-6">
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
        backgroundColor: '#2d5016', // Fallback color
        backgroundImage: `
          linear-gradient(135deg, ${primaryColor}40 0%, ${primaryColor}20 50%, transparent 100%),
          url('${(teamConfig?.backgroundImageUrl && teamConfig.backgroundImageUrl.trim()) ? teamConfig.backgroundImageUrl : '/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png'}')
        `,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat'
      }}
    >
      {/* Overlay adicional para mejor contraste */}
      <div className="absolute inset-0 bg-black/15" />
      
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
              {teamConfig?.logoUrl ? (
                <div className="relative">
                  <div className="w-20 h-20 aspect-square flex items-center justify-center">
                    <img 
                      src={teamConfig.logoUrl} 
                      alt={(teamConfig as any)?.teamName || "Team Logo"} 
                      width={80}
                      height={80}
                      className="max-w-20 max-h-20 object-contain drop-shadow-lg"
                      data-testid="team-logo"
                    />
                  </div>
                  {/* Efecto de estadio */}
                  <div className="absolute -inset-2 rounded-full bg-white/20 animate-pulse" />
                </div>
              ) : (
                <div className="relative">
                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-2xl border-4 border-white/30"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {teamConfig?.teamName?.substring(0, 3).toUpperCase() || "GFC"}
                  </div>
                  {/* Efecto de estadio */}
                  <div className="absolute -inset-2 rounded-full bg-white/20 animate-pulse" />
                </div>
              )}
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
              <div className="flex flex-col items-center text-center space-y-3">
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
                <div>
                  <h2 className="text-lg font-bold" data-testid="player-name">
                    {`${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || "Jugador"}
                  </h2>
                  <p className="text-white/80 text-sm" data-testid="player-nickname">
                    {playerInfo?.tagline || 'Deportista'}
                  </p>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-gradient-to-r from-orange-500/30 to-red-500/30 text-white border-orange-300/50 shadow-sm"
                      data-testid="player-position"
                    >
                      {(playerData as any)?.position || "Sin posición"}
                    </Badge>
                    {playerInfo?.jerseyNumber && (
                      <Badge 
                        variant="outline" 
                        className="text-xs bg-gradient-to-r from-blue-500/30 to-pink-500/30 text-white border-blue-300/50 shadow-sm"
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
          <Card className="bg-gradient-to-br from-red-500/70 to-orange-400/70 backdrop-blur-md border border-white/30 shadow-xl">
            <CardContent className="p-3 text-center text-white">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/40 rounded-full flex items-center justify-center shadow-lg">
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
          <Card className="bg-gradient-to-br from-blue-500/70 to-cyan-400/70 backdrop-blur-md border border-white/30 shadow-xl">
            <CardContent className="p-3 text-center text-white">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/40 rounded-full flex items-center justify-center shadow-lg">
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
          <Card className="bg-gradient-to-br from-pink-500/70 to-fuchsia-400/70 backdrop-blur-md border border-white/30 shadow-xl">
            <CardContent className="p-3 text-center text-white">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 bg-white/40 rounded-full flex items-center justify-center shadow-lg">
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

        {/* Estadísticas del jugador - solo mostrar si está habilitado */}
        {(teamConfig?.playerStatsEnabled ?? true) && (
          <Card className="bg-white/30 backdrop-blur-md border border-white/20 shadow-lg" data-testid="card-player-stats">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Trophy className="w-5 h-5" />
                <span>Estadísticas de jugador</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-white/70">
                <Trophy className="w-12 h-12 mx-auto mb-3 text-white/50" />
                <p>No hay datos para mostrar</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mi competición - solo mostrar si está habilitado */}
        {(teamConfig?.myCompetitionEnabled ?? true) && (
          <Card className="bg-white/30 backdrop-blur-md border border-white/20 shadow-lg" data-testid="card-my-competition">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Users className="w-5 h-5" />
                <span>Mi competición</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-between h-12 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-pink-500/20 transition-all duration-300"
                data-testid="button-classification"
              >
                <span>Clasificación</span>
                <span className="text-yellow-400">→</span>
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-12 hover:bg-gradient-to-r hover:from-orange-500/20 hover:to-red-500/20 transition-all duration-300"
                data-testid="button-calendar"
              >
                <span>Calendario</span>
                <span className="text-yellow-400">→</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* PRÓXIMO PARTIDO - Solo el siguiente */}
        {nextMatch ? (
          <Card 
            className="relative overflow-hidden backdrop-blur-md bg-white/30 border border-white/20 shadow-lg"
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l4-4v3h4v2h-4v3l-4-4z"/>
              </svg>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center space-x-2 text-lg text-white">
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
                  {(teamConfig as any)?.logoUrl ? (
                    <div className="w-16 h-16 aspect-square flex items-center justify-center bg-white/10 rounded-full shadow-lg">
                      <img 
                        src={(teamConfig as any).logoUrl} 
                        alt={(teamConfig as any)?.teamName || "Team Logo"} 
                        width={56}
                        height={56}
                        className="max-w-14 max-h-14 object-contain drop-shadow-md"
                        data-testid="next-match-team-logo"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(teamConfig as any)?.teamName?.substring(0, 3).toUpperCase() || "GFC"}
                    </div>
                  )}
                  <p className="text-sm font-medium text-center text-white">
                    {(teamConfig as any)?.teamName || "Mi Equipo"}
                  </p>
                </div>
                
                {/* VS */}
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-2xl font-bold text-white">VS</div>
                  <Badge 
                    variant="outline" 
                    className="text-xs bg-white/20 text-white border-white/30"
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
                  <p className="text-sm font-medium text-center text-white" data-testid={`match-opponent-${nextMatch.id}`}>
                    {nextMatch.opponent}
                  </p>
                </div>
              </div>
              
              {/* Detalles del partido */}
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 space-y-3 border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white" data-testid={`match-date-${nextMatch.id}`}>
                      {new Date(nextMatch.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long'
                      })}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {new Date(nextMatch.date).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white" data-testid={`match-venue-${nextMatch.id}`}>
                    {nextMatch.venue || "Por confirmar"}
                  </span>
                </div>
                
                {/* Botón de confirmación funcional */}
                <Button 
                  className="w-full mt-4 hover:opacity-90 transition-opacity" 
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => handleConfirmAttendance(nextMatch)}
                  disabled={confirmAttendanceMutation.isPending}
                  data-testid="button-confirm-assistance"
                >
                  <Award className="w-4 h-4 mr-2" />
                  {confirmAttendanceMutation.isPending ? "Confirmando..." : "Confirmar Asistencia"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/30 backdrop-blur-md border border-white/20 shadow-lg text-center py-8">
            <CardContent>
              <Calendar className="w-12 h-12 mx-auto mb-3 text-white/50" />
              <p className="text-white/70">No hay partidos programados</p>
            </CardContent>
          </Card>
        )}

        {/* Pagos pendientes */}
        <Card className="bg-white/30 backdrop-blur-md border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-orange-200">
              Pagos Pendientes ({pendingPayments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.length > 0 ? (
              <>
                {pendingPayments.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-white/20 backdrop-blur-sm rounded-lg border border-white/20">
                    <div>
                      <p className="font-medium text-white" data-testid={`payment-month-${payment.id}`}>
                        {payment.month}
                      </p>
                      <p className="text-sm text-white/70" data-testid={`payment-due-${payment.id}`}>
                        Vence: {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-200" data-testid={`payment-amount-${payment.id}`}>
                        €{parseFloat(payment.amount).toFixed(2)}
                      </p>
                      <Badge variant="secondary" className="bg-white/20 text-white border-white/30">Pendiente</Badge>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-green-200 text-center py-4">
                ¡No tienes pagos pendientes!
              </p>
            )}
            <div className="pt-3 border-t border-white/20">
              <button 
                onClick={() => window.location.href = '/payments-history'}
                className="w-full text-center text-blue-200 hover:text-blue-100 text-sm font-medium"
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