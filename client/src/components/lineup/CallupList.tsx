import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlayerCard } from './PlayerCard';
import { useMatchStore } from '@/stores/useMatchStore';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallupListProps {
  players: any[];
  className?: string;
  showAttendanceControls?: boolean;
  onAttendanceChange?: (playerId: string, status: 'confirmed' | 'absent' | 'pending') => void;
  isConfirming?: boolean;
}

export function CallupList({ 
  players = [], 
  className,
  showAttendanceControls = false,
  onAttendanceChange,
  isConfirming = false
}: CallupListProps) {
  const { attendances } = useMatchStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter and categorize players
  const categorizedPlayers = useMemo(() => {
    const filtered = players.filter(player =>
      player.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.number && player.number.toString().includes(searchTerm))
    );

    return {
      confirmed: filtered.filter(p => attendances[p.id] === 'confirmed'),
      pending: filtered.filter(p => attendances[p.id] === 'pending' || !attendances[p.id]),
      absent: filtered.filter(p => attendances[p.id] === 'absent'),
      all: filtered
    };
  }, [players, attendances, searchTerm]);

  const getStatusCounts = () => {
    return {
      confirmed: categorizedPlayers.confirmed.length,
      pending: categorizedPlayers.pending.length,
      absent: categorizedPlayers.absent.length,
      total: players.length
    };
  };

  const counts = getStatusCounts();

  const renderPlayerList = (playerList: any[], status: 'confirmed' | 'pending' | 'absent') => (
    <div className="space-y-2">
      {playerList.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No hay jugadores en esta categoría</p>
        </div>
      ) : (
        playerList.map(player => (
          <PlayerCard
            key={player.id}
            player={{
              playerId: player.id,
              playerName: player.name || 'Sin nombre',
              playerNumber: (player.number || '0').toString(),
              playerPosition: (player.position || 'DEFENSA').toUpperCase()
            }}
            attendanceStatus={attendances[player.id] || 'pending'}
            size="sm"
            className="w-full cursor-default"
            showAttendanceControls={showAttendanceControls}
            onAttendanceChange={onAttendanceChange}
            isConfirming={isConfirming}
          />
        ))
      )}
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with Search */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Lista de Convocados</h3>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-48"
              data-testid="search-players"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs with Counts */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center space-x-1">
            <span>Todos</span>
            <span className="bg-gray-200 text-gray-700 text-xs px-1.5 py-0.5 rounded-full">
              {counts.total}
            </span>
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex items-center space-x-1">
            <span>Confirmados</span>
            <span className="bg-green-200 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
              {counts.confirmed}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center space-x-1">
            <span>Pendientes</span>
            <span className="bg-yellow-200 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full">
              {counts.pending}
            </span>
          </TabsTrigger>
          <TabsTrigger value="absent" className="flex items-center space-x-1">
            <span>Ausentes</span>
            <span className="bg-red-200 text-red-700 text-xs px-1.5 py-0.5 rounded-full">
              {counts.absent}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {renderPlayerList(categorizedPlayers.all, 'pending')}
        </TabsContent>

        <TabsContent value="confirmed" className="mt-4">
          {renderPlayerList(categorizedPlayers.confirmed, 'confirmed')}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          {renderPlayerList(categorizedPlayers.pending, 'pending')}
        </TabsContent>

        <TabsContent value="absent" className="mt-4">
          {renderPlayerList(categorizedPlayers.absent, 'absent')}
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{counts.confirmed}</div>
            <div className="text-xs text-gray-600">Confirmados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <div className="text-xs text-gray-600">Pendientes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{counts.absent}</div>
            <div className="text-xs text-gray-600">Ausentes</div>
          </div>
        </div>
      </div>
    </div>
  );
}