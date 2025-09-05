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

  const { data: teamConfig, isLoading: configLoading } = useQuery({
    queryKey: ["/api/team-config"],
  });

  const activePlayersList = (players as any)?.filter((p: any) => p.isActive) || [];
  const upcomingMatches = (matches as any)?.filter((m: any) => m.status === 'scheduled') || [];

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundColor: '#2d5016',
        backgroundImage: "url('/attached_assets/file_00000000da1061f9901fd0696bb3bd94_1757108852263.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/15" />
      {/* Header */}
      <div className="relative bg-black/20 backdrop-blur-md border-b border-white/20 text-white p-4">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/')}
            className="text-white hover:bg-white/10"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold" data-testid="page-title">Equipo</h1>
        </div>
      </div>

      {/* Team Info */}
      <div className="relative bg-white/20 backdrop-blur-md border-b border-white/20 text-white p-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          {(teamConfig as any)?.logoUrl ? (
            <div className="w-20 h-20 aspect-square flex items-center justify-center">
              <img 
                src={(teamConfig as any).logoUrl} 
                alt={(teamConfig as any).teamName || "Team Logo"} 
                width={80}
                height={80}
                className="max-w-20 max-h-20 object-contain drop-shadow-lg"
                data-testid="team-logo"
              />
            </div>
          ) : (
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold text-xl border border-white/30">
              {(teamConfig as any)?.teamName?.substring(0, 3).toUpperCase() || "GFC"}
            </div>
          )}
          <h2 className="text-2xl font-bold" data-testid="team-name">
            {(teamConfig as any)?.teamName || "GOLMANAGER FC"}
          </h2>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative bg-white/10 backdrop-blur-sm border-b border-white/20 flex">
        <Button
          variant="ghost"
          className={`flex-1 py-4 text-white font-medium rounded-none ${
            activeTab === 'players' ? 'bg-white/20 backdrop-blur-sm border-t-2 border-white/50' : 'hover:bg-white/10'
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
            activeTab === 'matches' ? 'bg-white/20 backdrop-blur-sm border-t-2 border-white/50' : 'hover:bg-white/10'
          }`}
          onClick={() => setActiveTab('matches')}
          data-testid="tab-matches"
        >
          <Calendar className="w-5 h-5 mr-2" />
          Partidos
        </Button>
      </div>

      {/* Content */}
      <div className="relative container mx-auto p-4">
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
                    className="text-center cursor-pointer hover:bg-white/20 transition-colors bg-white/30 backdrop-blur-md border border-white/20 text-white"
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
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                              {player.jerseyNumber}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-white" data-testid={`player-name-${player.id}`}>
                            {player.name.split(' ').slice(0, 2).join(' ')}
                          </p>
                          <p className="text-xs text-white/70" data-testid={`player-position-${player.id}`}>
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
                <Card key={match.id} className="bg-white/30 backdrop-blur-md border border-white/20 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {(teamConfig as any)?.teamName?.substring(0, 3).toUpperCase() || "GFC"}
                          </div>
                          <span className="text-lg font-bold text-yellow-400">VS</span>
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg">
                            {match.opponent.slice(0, 3).toUpperCase()}
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="font-medium text-white" data-testid={`match-opponent-${match.id}`}>
                            vs {match.opponent}
                          </p>
                          <p className="text-sm text-white/70" data-testid={`match-datetime-${match.id}`}>
                            {new Date(match.date).toLocaleDateString('es-ES', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <p className="text-sm text-white/70" data-testid={`match-venue-${match.id}`}>
                            📍 {match.venue}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-gradient-to-r from-blue-500/20 to-pink-500/20 text-white border-blue-300/30" data-testid={`match-competition-${match.id}`}>
                          {match.competition}
                        </Badge>
                        <p className="text-xs text-orange-300 mt-1 font-medium">
                          {match.status === 'scheduled' ? 'Programado' : match.status}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-white/30 backdrop-blur-md border border-white/20">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-white/50" />
                  <p className="text-white/70">No hay partidos programados</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}