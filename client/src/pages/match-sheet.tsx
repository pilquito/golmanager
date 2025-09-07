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
    <div className="min-h-screen bg-gray-200">
      {/* LINEUP11 Style Header */}
      <div className="bg-gray-200 border-b border-gray-300">
        <div className="container mx-auto px-4 py-6">
          {/* Header con equipos */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-2">
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => navigate('/matches')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
            </div>
            
            {/* Nombres de equipos */}
            <div className="flex items-center justify-center space-x-6">
              <div className="text-right">
                <h1 className="text-xl font-bold text-gray-800">
                  {(teamConfig as any)?.teamName || 'AF. Sobradillo'}
                </h1>
              </div>
              <div className="text-gray-500 font-medium">vs</div>
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-800">
                  {(match as any)?.opponent || 'Rival'}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match Sheet Content - LINEUP11 Style */}
      <div className="container mx-auto px-4 py-2">
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