import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Menu, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useMatchStore, PlayerRef } from '@/stores/useMatchStore';
import { PlayerCard } from './PlayerCard';

interface Formation {
  id: string;
  name: string;
  display: string;
  positions: {
    DEF: number;
    MED: number;
    DEL: number;
  };
}

const formations: Formation[] = [
  { id: '2-2-2-2-2', name: '2-2-2-2-2', display: '2-2-2-2-2', positions: { DEF: 2, MED: 2, DEL: 2 } },
  { id: '3-2-3-2', name: '3-2-3-2', display: '3-2-3-2', positions: { DEF: 3, MED: 2, DEL: 3 } },
  { id: '3-3-2-2', name: '3-3-2-2', display: '3-3-2-2', positions: { DEF: 3, MED: 3, DEL: 2 } },
  { id: '3-3-3-1', name: '3-3-3-1', display: '3-3-3-1', positions: { DEF: 3, MED: 3, DEL: 3 } },
  { id: '3-4-1-2', name: '3-4-1-2', display: '3-4-1-2', positions: { DEF: 3, MED: 4, DEL: 1 } },
  { id: '3-4-2-1', name: '3-4-2-1', display: '3-4-2-1', positions: { DEF: 3, MED: 4, DEL: 2 } },
  { id: '3-4-3', name: '3-4-3', display: '3-4-3', positions: { DEF: 3, MED: 4, DEL: 3 } },
  { id: '3-4-3-diamond', name: '3-4-3 sistema (de diamante)', display: '3-4-3 sistema (de diamante)', positions: { DEF: 3, MED: 4, DEL: 3 } },
  { id: '3-5-2', name: '3-5-2', display: '3-5-2', positions: { DEF: 3, MED: 5, DEL: 2 } },
  { id: '4-1-3-2', name: '4-1-3-2', display: '4-1-3-2', positions: { DEF: 4, MED: 1, DEL: 3 } },
  { id: '4-1-4-1', name: '4-1-4-1', display: '4-1-4-1', positions: { DEF: 4, MED: 1, DEL: 4 } },
  { id: '4-2-2-2', name: '4-2-2-2', display: '4-2-2-2', positions: { DEF: 4, MED: 2, DEL: 2 } },
  { id: '4-4-2', name: '4-4-2', display: '4-4-2', positions: { DEF: 4, MED: 4, DEL: 2 } },
  { id: '4-3-3', name: '4-3-3', display: '4-3-3', positions: { DEF: 4, MED: 3, DEL: 3 } },
];

interface SportEasyFieldProps {
  players?: any[];
}

export function SportEasyField({ players = [] }: SportEasyFieldProps) {
  const [selectedFormation, setSelectedFormation] = useState(formations[12]); // 4-4-2 por defecto
  const { lineup, assignPlayerToSlot, moveToBench, swapPlayerWithBench, getAvailableBenchPlayers, setFormation } = useMatchStore();

  // Aplicar formación cuando cambie la selección
  React.useEffect(() => {
    if (selectedFormation) {
      setFormation(selectedFormation.positions);
    }
  }, [selectedFormation, setFormation]);

  // Generar posiciones del campo basadas en la formación
  const generateFieldPositions = (formation: Formation) => {
    const positions = [];
    
    // Portero (siempre 1)
    positions.push({
      type: 'POR',
      slotIndex: 0,
      style: { bottom: '5%', left: '47%' }
    });

    // Defensas
    const defCount = formation.positions.DEF;
    for (let i = 0; i < defCount; i++) {
      const leftOffset = 15 + (i * (70 / (defCount - 1 || 1)));
      positions.push({
        type: 'DEF',
        slotIndex: i,
        style: { bottom: '20%', left: `${leftOffset}%` }
      });
    }

    // Mediocampistas
    const medCount = formation.positions.MED;
    for (let i = 0; i < medCount; i++) {
      const leftOffset = 15 + (i * (70 / (medCount - 1 || 1)));
      positions.push({
        type: 'MED',
        slotIndex: i,
        style: { bottom: '50%', left: `${leftOffset}%` }
      });
    }

    // Delanteros
    const delCount = formation.positions.DEL;
    for (let i = 0; i < delCount; i++) {
      const leftOffset = 25 + (i * (50 / (delCount - 1 || 1)));
      positions.push({
        type: 'DEL',
        slotIndex: i,
        style: { bottom: '75%', left: `${leftOffset}%` }
      });
    }

    return positions;
  };

  const fieldPositions = generateFieldPositions(selectedFormation);

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Header SportEasy Style */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-medium">Alineación</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-white">
          GUARDAR
        </Button>
      </div>

      {/* Controls - SportEasy Style */}
      <div className="p-4 bg-gray-50 flex items-center justify-between">
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 bg-green-100 border-green-300 hover:bg-green-200"
        >
          <Menu className="w-4 h-4" />
          <span>Nombrar la alineaci...</span>
        </Button>
        
        <Select value={selectedFormation.id} onValueChange={(value) => {
          const formation = formations.find(f => f.id === value);
          if (formation) setSelectedFormation(formation);
        }}>
          <SelectTrigger className="w-32 bg-white border-green-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            {formations.map((formation) => (
              <SelectItem key={formation.id} value={formation.id}>
                {formation.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campo de fútbol - Estilo SportEasy */}
      <div className="relative bg-gradient-to-b from-green-400 to-green-600 min-h-[600px] mx-4 mb-4 rounded-lg overflow-hidden">
        {/* Textura de hierba */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.1) 20px,
              rgba(255,255,255,0.1) 22px
            )`
          }}
        />
        
        {/* Líneas del campo */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
          {/* Línea central */}
          <line x1="0" y1="300" x2="400" y2="300" stroke="white" strokeWidth="2" opacity="0.8" />
          
          {/* Círculo central */}
          <circle cx="200" cy="300" r="40" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
          
          {/* Área grande superior */}
          <rect x="120" y="520" width="160" height="60" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
          
          {/* Área pequeña superior */}
          <rect x="160" y="540" width="80" height="40" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
          
          {/* Área grande inferior */}
          <rect x="120" y="20" width="160" height="60" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
          
          {/* Área pequeña inferior */}
          <rect x="160" y="20" width="80" height="40" fill="none" stroke="white" strokeWidth="2" opacity="0.8" />
        </svg>

        {/* Posiciones de jugadores */}
        {fieldPositions.map((position, index) => {
          // Manejar diferentes tipos de slots
          let player = null;
          if (position.type === 'BENCH') {
            // El banquillo tiene un formato diferente
            const benchData = lineup.BENCH;
            player = benchData.players[position.slotIndex] || null;
          } else {
            // Las posiciones de campo son arrays de slots
            const fieldSlots = lineup[position.type as keyof Omit<typeof lineup, 'BENCH'>];
            if (Array.isArray(fieldSlots) && fieldSlots[position.slotIndex]) {
              player = fieldSlots[position.slotIndex].player;
            }
          }
          
          return (
            <div
              key={`${position.type}-${position.slotIndex}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={position.style}
            >
              {player ? (
                <div className="relative">
                  <div 
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      // Abrir menú de jugador o mover al banquillo
                      if (player) {
                        moveToBench(player.playerId);
                      }
                    }}
                  >
                    <PlayerCard
                      player={player}
                      size="lineup11"
                    />
                  </div>
                </div>
              ) : (
                <div 
                  className="w-16 h-16 border-2 border-dashed border-white border-opacity-60 rounded-lg bg-black bg-opacity-20 flex items-center justify-center cursor-pointer hover:bg-opacity-30 transition-all"
                  onClick={() => {
                    // Buscar jugador disponible en el banquillo
                    const benchPlayers = getAvailableBenchPlayers();
                    if (benchPlayers.length > 0) {
                      assignPlayerToSlot(benchPlayers[0], position.type, position.slotIndex);
                    }
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-white bg-opacity-60 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">+</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sección de suplentes */}
      <div className="px-4 pb-4">
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-3">SUPLENTE</h3>
          <div className="flex flex-wrap gap-2">
            {lineup.BENCH.players.map((player) => (
              <div
                key={player.playerId}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  // Buscar primera posición disponible para asignar
                  const playerPos = player.playerPosition.toUpperCase();
                  const positionMap: Record<string, string> = {
                    'PORTERO': 'POR',
                    'DEFENSA': 'DEF',
                    'MEDIOCENTRO': 'MED', 
                    'DELANTERO': 'DEL'
                  };
                  const targetPosition = positionMap[playerPos] || 'DEF';
                  
                  // Buscar slot disponible
                  const slots = lineup[targetPosition as keyof Omit<typeof lineup, 'BENCH'>];
                  if (Array.isArray(slots)) {
                    for (let i = 0; i < slots.length; i++) {
                      if (!slots[i].player) {
                        assignPlayerToSlot(player, targetPosition, i);
                        return;
                      }
                    }
                  }
                }}
              >
                <PlayerCard
                  player={player}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección Mis Alineaciones - Estilo SportEasy */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-3 text-center">Mis alineaciones</h3>
        
        <Button 
          variant="outline" 
          className="w-full mb-4 border-green-400 text-green-600 hover:bg-green-50"
        >
          Crear una nueva alineación
        </Button>
        
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3 flex items-center justify-between border border-gray-200">
            <span className="text-gray-700">Alineación 1</span>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}