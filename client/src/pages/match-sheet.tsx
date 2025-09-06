import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { MatchSheet } from '@/components/lineup/MatchSheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Calendar, MapPin } from 'lucide-react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MatchSheetPage() {
  const { id: matchId } = useParams();
  const [, navigate] = useLocation();

  // Fetch match data
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: [`/api/matches/${matchId}`],
    enabled: !!matchId,
  });

  // Fetch all players for the match sheet
  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/players'],
  });

  // Fetch team config for styling
  const { data: teamConfig } = useQuery({
    queryKey: ['/api/team-config'],
  });

  if (matchLoading || playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando ficha de partido...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Partido no encontrado</h2>
          <p className="text-gray-600 mb-4">No se pudo cargar la información del partido</p>
          <Button onClick={() => navigate('/matches')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a partidos
          </Button>
        </div>
      </div>
    );
  }

  const primaryColor = (teamConfig as any)?.primaryColor || '#22c55e';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/matches')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </Button>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Ficha de Partido
                </h1>
                <p className="text-sm text-gray-600">
                  Gestiona la alineación y convocatoria
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date((match as any).date), 'dd MMM yyyy', { locale: es })}
                </span>
              </div>
              
              {(match as any).location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{(match as any).location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="mt-4 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: primaryColor }}
                />
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {(teamConfig as any)?.teamName || 'Equipo'} vs {(match as any).opponent || 'Rival'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {(match as any).competition && `${(match as any).competition} • `}
                    {format(new Date((match as any).date), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">
                  {(players as any[])?.length || 0} jugadores disponibles
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Sheet Content */}
      <div className="container mx-auto px-4 py-6">
        <MatchSheet 
          matchId={matchId!} 
          players={(players as any[]) || []}
          onPlayersUpdate={() => {
            // Could trigger refetch if needed
          }}
        />
      </div>
    </div>
  );
}