import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Menu, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useMatchStore, PlayerRef } from '@/stores/useMatchStore';
import { PlayerCard } from './PlayerCard';
import { PlayerSelectionModal } from './PlayerSelectionModal';

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
  const [savedLineups, setSavedLineups] = useState<any[]>([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ type: string; slotIndex: number } | null>(null);
  const { lineup, assignPlayerToSlot, moveToBench, swapPlayerWithBench, getAvailableBenchPlayers, setFormation, attendances } = useMatchStore();

  // Aplicar formación cuando cambie la selección
  React.useEffect(() => {
    if (selectedFormation) {
      console.log('🔄 Cambiando formación a:', selectedFormation.name, selectedFormation.positions);
      setFormation(selectedFormation.positions);
    }
  }, [selectedFormation, setFormation]);

  // Funciones para gestionar alineaciones guardadas
  const saveCurrentLineup = () => {
    console.log('💾 Iniciando guardado de alineación...');
    const lineupName = prompt('Nombre de la alineación:');
    if (lineupName) {
      const newSavedLineup = {
        name: lineupName,
        formation: selectedFormation.name,
        lineup: JSON.parse(JSON.stringify(lineup)),
        formation_obj: selectedFormation
      };
      setSavedLineups(prev => [...prev, newSavedLineup]);
      console.log('✅ Alineación guardada:', lineupName);
    }
  };

  const loadLineup = (savedLineup: any) => {
    console.log('📂 Cargando alineación:', savedLineup.name);
    setSelectedFormation(savedLineup.formation_obj);
    // La alineación se cargará automáticamente con el efecto
  };

  const deleteSavedLineup = (index: number) => {
    setSavedLineups(prev => prev.filter((_, i) => i !== index));
  };

  // Generar posiciones del campo basadas en la formación (adaptado para perspectiva 3D)
  const generateFieldPositions = (formation: Formation) => {
    const positions = [];
    
    // Portero (siempre 1) - Más abajo por la perspectiva
    positions.push({
      type: 'POR',
      slotIndex: 0,
      style: { bottom: '8%', left: '50%' }
    });

    // Defensas - Ajustados para perspectiva
    const defCount = formation.positions.DEF;
    for (let i = 0; i < defCount; i++) {
      let leftOffset;
      if (defCount === 1) leftOffset = 50;
      else if (defCount === 2) leftOffset = 35 + (i * 30);
      else if (defCount === 3) leftOffset = 30 + (i * 20);
      else if (defCount === 4) leftOffset = 22 + (i * 18.5);
      else leftOffset = 20 + (i * (60 / (defCount - 1)));
      
      positions.push({
        type: 'DEF',
        slotIndex: i,
        style: { bottom: '25%', left: `${leftOffset}%` }
      });
    }

    // Mediocampistas - Centrados para perspectiva
    const medCount = formation.positions.MED;
    for (let i = 0; i < medCount; i++) {
      let leftOffset;
      if (medCount === 1) leftOffset = 50;
      else if (medCount === 2) leftOffset = 37 + (i * 26);
      else if (medCount === 3) leftOffset = 32 + (i * 18);
      else if (medCount === 4) leftOffset = 25 + (i * 16.7);
      else if (medCount === 5) leftOffset = 22 + (i * 13.5);
      else leftOffset = 20 + (i * (60 / (medCount - 1)));
      
      positions.push({
        type: 'MED',
        slotIndex: i,
        style: { bottom: '50%', left: `${leftOffset}%` }
      });
    }

    // Delanteros - Más arriba por la perspectiva
    const delCount = formation.positions.DEL;
    for (let i = 0; i < delCount; i++) {
      let leftOffset;
      if (delCount === 1) leftOffset = 50;
      else if (delCount === 2) leftOffset = 40 + (i * 20);
      else if (delCount === 3) leftOffset = 35 + (i * 15);
      else leftOffset = 30 + (i * (40 / (delCount - 1)));
      
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

      {/* Campo de fútbol 3D - Exacto como SportEasy */}
      <div className="relative mx-4 mb-4 rounded-lg overflow-hidden" style={{ height: '650px' }}>
        {/* Campo con perspectiva 3D */}
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `
              radial-gradient(ellipse 80% 100% at center 50%, #4ade80 0%, #22c55e 25%, #16a34a 50%, #15803d 75%, #166534 100%),
              linear-gradient(to bottom, #4ade80 0%, #22c55e 20%, #16a34a 40%, #15803d 70%, #166534 100%)
            `,
            transform: 'perspective(1000px) rotateX(25deg)',
            transformOrigin: 'center top',
            height: '120%',
            top: '-10%'
          }}
        >
          {/* Textura de hierba realista */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 8px,
                  rgba(255,255,255,0.03) 8px,
                  rgba(255,255,255,0.03) 9px
                ),
                repeating-linear-gradient(
                  90deg,
                  transparent 0px,
                  transparent 15px,
                  rgba(255,255,255,0.02) 15px,
                  rgba(255,255,255,0.02) 16px
                )
              `,
              opacity: 0.6
            }}
          />
          
          {/* Líneas del campo en perspectiva */}
          <svg 
            className="absolute inset-0 w-full h-full" 
            viewBox="0 0 400 700"
            style={{ 
              opacity: 0.9,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}
          >
            {/* Bordes del campo */}
            <rect x="50" y="50" width="300" height="600" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Línea central */}
            <line x1="50" y1="350" x2="350" y2="350" stroke="white" strokeWidth="3" />
            
            {/* Círculo central */}
            <circle cx="200" cy="350" r="60" fill="none" stroke="white" strokeWidth="3" />
            <circle cx="200" cy="350" r="2" fill="white" />
            
            {/* Área grande superior */}
            <rect x="120" y="50" width="160" height="100" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Área pequeña superior */}
            <rect x="150" y="50" width="100" height="60" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Semicírculo área superior */}
            <path d="M 150 150 A 50 50 0 0 1 250 150" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Área grande inferior */}
            <rect x="120" y="550" width="160" height="100" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Área pequeña inferior */}
            <rect x="150" y="590" width="100" height="60" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Semicírculo área inferior */}
            <path d="M 150 550 A 50 50 0 0 0 250 550" fill="none" stroke="white" strokeWidth="3" />
            
            {/* Puntos de penalti */}
            <circle cx="200" cy="540" r="2" fill="white" />
            <circle cx="200" cy="160" r="2" fill="white" />
          </svg>
        </div>

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
          
          // Solo mostrar jugadores confirmados en campo
          if (player && attendances[player.playerId] !== 'confirmed') {
            player = null;
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
                        console.log('👤 Moviendo jugador al banquillo:', player.playerName);
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
                  className="w-16 h-16 border-2 border-dashed border-white border-opacity-80 rounded-xl bg-white bg-opacity-10 flex items-center justify-center cursor-pointer hover:bg-opacity-20 transition-all backdrop-blur-sm"
                  onClick={() => {
                    console.log('🎯 Abriendo modal para seleccionar jugador en posición:', position.type, 'slot:', position.slotIndex);
                    // Abrir modal para seleccionar jugador manualmente
                    setSelectedPosition({ type: position.type, slotIndex: position.slotIndex });
                    setShowPlayerModal(true);
                  }}
                  style={{
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.2)'
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                    <span className="text-sm font-bold text-green-700">+</span>
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
            {lineup.BENCH.players
              .filter(player => attendances[player.playerId] === 'confirmed')
              .map((player) => (
              <div
                key={player.playerId}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  console.log('🚀 Asignando jugador desde banquillo:', player.playerName, player.playerPosition);
                  // Buscar primera posición disponible para asignar
                  const playerPos = player.playerPosition.toUpperCase();
                  const positionMap: Record<string, string> = {
                    'PORTERO': 'POR',
                    'DEFENSA': 'DEF',
                    'MEDIOCENTRO': 'MED', 
                    'DELANTERO': 'DEL'
                  };
                  const targetPosition = positionMap[playerPos] || 'DEF';
                  
                  // CUALQUIER JUGADOR EN CUALQUIER POSICIÓN - buscar CUALQUIER slot disponible
                  let assigned = false;
                  for (const pos of ['DEL', 'MED', 'DEF', 'POR']) {
                    const slots = lineup[pos as keyof Omit<typeof lineup, 'BENCH'>];
                    if (Array.isArray(slots)) {
                      for (let i = 0; i < slots.length; i++) {
                        const slotPlayer = slots[i].player;
                        const isSlotAvailable = !slotPlayer || attendances[slotPlayer.playerId] !== 'confirmed';
                        if (isSlotAvailable) {
                          console.log('✅ Asignando jugador a CUALQUIER posición:', pos, 'slot:', i, 'reemplazando:', slotPlayer?.playerName || 'vacío');
                          assignPlayerToSlot(player, pos, i);
                          assigned = true;
                          return;
                        }
                      }
                    }
                  }
                  if (!assigned) {
                    console.log('❌ No hay slots disponibles en TODO el campo');
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

      {/* Modal para seleccionar jugador */}
      {selectedPosition && (
        <PlayerSelectionModal
          isOpen={showPlayerModal}
          onClose={() => {
            setShowPlayerModal(false);
            setSelectedPosition(null);
          }}
          onSelectPlayer={(player: PlayerRef) => {
            console.log('🎯 Jugador seleccionado manualmente:', player.playerName, 'para posición:', selectedPosition.type);
            assignPlayerToSlot(player, selectedPosition.type, selectedPosition.slotIndex);
            setShowPlayerModal(false);
            setSelectedPosition(null);
          }}
          availablePlayers={lineup.BENCH.players.filter(player => attendances[player.playerId] === 'confirmed')}
          position={selectedPosition.type}
          title={`Seleccionar jugador para ${selectedPosition.type}`}
          overrideOutOfPosition={true}
        />
      )}

      {/* Sección Mis Alineaciones - Estilo SportEasy */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h3 className="text-lg font-medium mb-3 text-center">Mis alineaciones</h3>
        
        <Button 
          variant="outline" 
          className="w-full mb-4 border-green-400 text-green-600 hover:bg-green-50"
          onClick={saveCurrentLineup}
        >
          Guardar alineación actual
        </Button>
        
        <div className="space-y-2">
          {savedLineups.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">
                ¡Guarda tu primera alineación!
              </p>
            </div>
          ) : (
            savedLineups.map((savedLineup, index) => (
              <div 
                key={index}
                className="bg-white rounded-lg p-3 flex items-center justify-between border border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => loadLineup(savedLineup)}
              >
                <div>
                  <span className="text-gray-700 font-medium">{savedLineup.name}</span>
                  <div className="text-xs text-gray-500">{savedLineup.formation}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSavedLineup(index);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}