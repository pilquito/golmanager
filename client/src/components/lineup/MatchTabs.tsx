import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Trophy, Edit, Users, MessageCircle, Grid3X3, Settings } from 'lucide-react';
import { SportEasyField } from './SportEasyField';
import { CallupList } from './CallupList';
import { useAuth } from '@/hooks/useAuth';
import { useMatchStore } from '@/stores/useMatchStore';

interface Match {
  id: string;
  date: Date;
  opponent: string;
  venue: string;
  competition: string;
  ourScore?: number;
  opponentScore?: number;
  status: string;
  notes?: string;
}

interface MatchTabsProps {
  match: Match;
  players?: any[];
  onPlayersUpdate?: () => void;
  onAttendanceChange?: (playerId: string, status: 'confirmed' | 'absent' | 'pending') => void;
  isConfirming?: boolean;
}

export function MatchTabs({ match, players = [], onPlayersUpdate, onAttendanceChange, isConfirming }: MatchTabsProps) {
  const [activeTab, setActiveTab] = useState('information');
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const tabs = [
    { id: 'information', label: 'INFORMACIÓN', icon: Clock },
    { id: 'players', label: 'JUGADORES', icon: Users },
    { id: 'forum', label: 'FORO', icon: MessageCircle },
    { id: 'lineup', label: 'ALINEACIÓN', icon: Grid3X3 },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header con información del partido - Estilo SportEasy */}
      <div className="bg-gray-800 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-medium capitalize">
            {formatDate(match.date)}
          </h1>
          <Button variant="ghost" size="sm" className="text-white">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <p className="text-lg font-medium">AF. Sobradillo</p>
          </div>
          <div className="text-gray-300 font-bold text-lg">VS</div>
          <div className="text-center">
            <h2 className="text-lg font-medium">{match.opponent}</h2>
          </div>
        </div>

      </div>

      {/* Pestañas - Estilo SportEasy */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <IconComponent className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="p-6">
        {activeTab === 'information' && (
          <div className="space-y-6">
            {/* Información del partido */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Partido</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span>Inicio a las {formatTime(match.date)}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{match.venue}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-5 h-5 text-gray-400" />
                    <span>{match.competition}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descripción */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Descripción</h3>
                <p className="text-gray-600">{match.notes || 'Partido'}</p>
              </CardContent>
            </Card>

            {/* Live Stats */}
          </div>
        )}

        {activeTab === 'players' && (
          <div>
            <CallupList 
              players={players}
              showAttendanceControls={true}
              onAttendanceChange={onAttendanceChange}
              isConfirming={isConfirming}
            />
          </div>
        )}

        {activeTab === 'forum' && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Foro del partido</h3>
            <p className="text-gray-600 mb-4">
              Comunícate con tu equipo sobre este partido
            </p>
            <Button variant="outline">
              Crear conversación
            </Button>
          </div>
        )}

        {activeTab === 'lineup' && (
          <div className="-m-6">
            <SportEasyField players={players} />
          </div>
        )}
      </div>
    </div>
  );
}