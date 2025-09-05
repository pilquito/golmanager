import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Calendar } from "lucide-react";
import { useLocation } from "wouter";

export default function TeamView() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'players' | 'matches'>('players');

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ["/api/players"],
  });

  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/matches"],
  });

  const activePlayersList = players?.filter((p: any) => p.isActive) || [];
  const upcomingMatches = matches?.filter((m: any) => m.status === 'scheduled') || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700">
      {/* Header */}
      <div className="bg-blue-900 text-white p-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/')}
            className="text-white hover:bg-blue-800"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold" data-testid="page-title">Equipo</h1>
        </div>
      </div>

      {/* Team Info */}
      <div className="bg-blue-800 text-white p-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-20 h-20 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            GFC
          </div>
          <h2 className="text-2xl font-bold" data-testid="team-name">
            GOLMANAGER FC
          </h2>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-blue-600 flex">
        <Button
          variant="ghost"
          className={`flex-1 py-4 text-white font-medium rounded-none ${
            activeTab === 'players' ? 'bg-blue-500' : 'hover:bg-blue-700'
          }`}
          onClick={() => setActiveTab('players')}
          data-testid="tab-players"
        >
          <Users className="w-5 h-5 mr-2" />
          Jugadores
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 py-4 text-white font-medium rounded-none ${
            activeTab === 'matches' ? 'bg-blue-500' : 'hover:bg-blue-700'
          }`}
          onClick={() => setActiveTab('matches')}
          data-testid="tab-matches"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Partidos
        </Button>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4">
        {activeTab === 'players' && (
          <div className="space-y-4">
            {playersLoading ? (
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {activePlayersList.map((player: any) => (
                  <Card 
                    key={player.id} 
                    className="text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => alert(`Jugador: ${player.name}\nPosición: ${player.position}\nDorsal: #${player.jerseyNumber || 'N/A'}\nEmail: ${player.email || 'N/A'}`)}
                    data-testid={`card-player-${player.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center relative">
                          {(player.profile_image_url || player.profileImageUrl) ? (
                            <img 
                              src={player.profile_image_url || player.profileImageUrl} 
                              alt={player.name}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <Users className="w-8 h-8 text-gray-400" />
                          )}
                          {player.jerseyNumber && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {player.jerseyNumber}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm" data-testid={`player-name-${player.id}`}>
                            {player.name.split(' ').slice(0, 2).join(' ')}
                          </p>
                          <p className="text-xs text-gray-600" data-testid={`player-position-${player.id}`}>
                            {player.position}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matchesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : upcomingMatches.length > 0 ? (
              upcomingMatches.map((match: any) => (
                <Card key={match.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            GFC
                          </div>
                          <span className="text-lg font-bold">VS</span>
                          <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xs">
                            {match.opponent.slice(0, 3).toUpperCase()}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="font-medium" data-testid={`match-opponent-${match.id}`}>
                            vs {match.opponent}
                          </p>
                          <p className="text-sm text-gray-600" data-testid={`match-datetime-${match.id}`}>
                            {new Date(match.date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm text-gray-600" data-testid={`match-venue-${match.id}`}>
                            📍 {match.venue}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" data-testid={`match-competition-${match.id}`}>
                          {match.competition}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {match.status === 'scheduled' ? 'Programado' : match.status}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500">No hay partidos programados</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}