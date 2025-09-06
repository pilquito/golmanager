import { useDroppable } from '@dnd-kit/core';
import { PlayerCard } from './PlayerCard';
import { useMatchStore } from '@/stores/useMatchStore';
import { cn } from '@/lib/utils';

interface BenchProps {
  className?: string;
}

export function Bench({ className }: BenchProps) {
  const { lineup, attendances } = useMatchStore();
  const { isOver, setNodeRef } = useDroppable({
    id: 'BENCH',
    data: { position: 'BENCH' }
  });

  const benchPlayers = lineup.BENCH.players;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Banquillo</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {benchPlayers.length} jugadores
        </span>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 border-2 border-dashed rounded-lg p-4 min-h-[300px] transition-all",
          benchPlayers.length > 0 
            ? "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50" 
            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800",
          isOver && "border-blue-500 bg-blue-50/70 scale-[1.02]"
        )}
        data-testid="bench-drop-zone"
      >
        {benchPlayers.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-2">🪑</div>
              <p className="text-sm">Banquillo vacío</p>
              <p className="text-xs">Arrastra jugadores aquí</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {benchPlayers.map((player, index) => (
              <PlayerCard
                key={player.playerId}
                player={player}
                attendanceStatus={attendances[player.playerId] || 'pending'}
                size="sm"
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>

      {/* Bench Stats */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-100 rounded px-2 py-1">
            <div className="font-medium">Total</div>
            <div>{benchPlayers.length}</div>
          </div>
          <div className="bg-green-100 text-green-700 rounded px-2 py-1">
            <div className="font-medium">Listos</div>
            <div>
              {benchPlayers.filter(p => attendances[p.playerId] === 'confirmed').length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}