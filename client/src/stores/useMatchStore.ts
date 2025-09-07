import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

export interface PlayerRef {
  playerId: string;
  playerName: string;
  playerNumber: string;
  playerPosition: string;
  profileImageUrl?: string;
}

export interface Slot {
  player: PlayerRef | null; // Solo un jugador por slot
}

export interface LineupState {
  POR: Slot[];
  DEF: Slot[];
  MED: Slot[];
  DEL: Slot[];
  BENCH: { players: PlayerRef[] }; // El banquillo sí puede tener múltiples jugadores
}

export interface MatchState {
  matchId: string | null;
  lineup: LineupState;
  overrideOutOfPosition: boolean;
  attendances: Record<string, 'pending' | 'confirmed' | 'absent'>;
  currentFormation: { DEF: number; MED: number; DEL: number };
}

interface MatchStore extends MatchState {
  // Actions
  setMatch: (matchId: string) => void;
  setOverrideOutOfPosition: (enabled: boolean) => void;
  assignPlayerToSlot: (playerRef: PlayerRef, position: string, slotIndex?: number) => void;
  removePlayerFromSlot: (playerId: string) => void;
  updateAttendance: (playerId: string, status: 'pending' | 'confirmed' | 'absent') => void;
  autoAssignPlayer: (playerRef: PlayerRef) => void;
  resetLineup: () => void;
  
  // New methods for click system
  getAvailableBenchPlayers: () => PlayerRef[];
  swapPlayerWithBench: (fieldPlayerId: string, benchPlayerId: string) => boolean;
  moveToBench: (playerId: string) => void;
  
  // Helpers
  findPlayerPosition: (playerId: string) => { position: string; slotIndex?: number } | null;
  canPlaceInSlot: (position: string, slotIndex?: number, playerPosition?: string) => boolean;
  getSlotOccupancy: (position: string) => number;
  
  // Formation management
  setFormation: (formation: { DEF: number; MED: number; DEL: number }) => void;
}

const createEmptySlot = (): Slot => ({ player: null });

const createLineupForFormation = (formation = { DEF: 4, MED: 4, DEL: 2 }): LineupState => ({
  POR: [createEmptySlot()],
  DEF: Array.from({ length: formation.DEF }, () => createEmptySlot()),
  MED: Array.from({ length: formation.MED }, () => createEmptySlot()),  
  DEL: Array.from({ length: formation.DEL }, () => createEmptySlot()),
  BENCH: { players: [] }
});

const createInitialLineup = (): LineupState => createLineupForFormation();

export const useMatchStore = create<MatchStore>((set, get) => ({
  matchId: null,
  lineup: createInitialLineup(),
  overrideOutOfPosition: false,
  attendances: {},
  currentFormation: { DEF: 4, MED: 4, DEL: 2 },

  // New methods for click system
  getAvailableBenchPlayers: () => {
    const { lineup, attendances } = get();
    // Solo devolver jugadores confirmados del banquillo
    return lineup.BENCH.players.filter(player => 
      attendances[player.playerId] === 'confirmed'
    );
  },

  swapPlayerWithBench: (fieldPlayerId: string, benchPlayerId: string) => {
    const { findPlayerPosition, lineup, overrideOutOfPosition } = get();
    
    const fieldPosition = findPlayerPosition(fieldPlayerId);
    if (!fieldPosition || fieldPosition.position === 'BENCH') return false;
    
    const benchPlayer = lineup.BENCH.players.find(p => p.playerId === benchPlayerId);
    if (!benchPlayer) return false;
    
    // Check position compatibility unless override is enabled
    if (!overrideOutOfPosition) {
      const positionMap: Record<string, string> = {
        'PORTERO': 'POR',
        'DEFENSA': 'DEF',
        'MEDIOCENTRO': 'MED',
        'DELANTERO': 'DEL'
      };
      
      const benchPlayerLineupPosition = positionMap[benchPlayer.playerPosition.toUpperCase()];
      if (benchPlayerLineupPosition !== fieldPosition.position) {
        return false; // Incompatible position
      }
    }
    
    set(state => {
      const newLineup = { ...state.lineup };
      
      // Remove field player from their slot
      const fieldSlots = newLineup[fieldPosition.position as keyof Omit<LineupState, 'BENCH'>];
      const fieldPlayerRef = fieldSlots[fieldPosition.slotIndex!].player;
      if (fieldPlayerRef) {
        fieldSlots[fieldPosition.slotIndex!].player = benchPlayer;
        
        // Remove bench player from bench and add field player
        newLineup.BENCH.players = newLineup.BENCH.players.filter(p => p.playerId !== benchPlayerId);
        newLineup.BENCH.players.push(fieldPlayerRef);
        newLineup.BENCH.players.sort((a, b) => parseInt(a.playerNumber) - parseInt(b.playerNumber));
      }
      
      return { ...state, lineup: newLineup };
    });
    
    return true; // Success
  },

  setMatch: (matchId: string) => {
    set({ 
      matchId,
      lineup: createInitialLineup(),
      attendances: {},
      overrideOutOfPosition: false,
      currentFormation: { DEF: 4, MED: 4, DEL: 2 }
    });
  },

  setOverrideOutOfPosition: (enabled: boolean) => {
    set({ overrideOutOfPosition: enabled });
  },

  findPlayerPosition: (playerId: string) => {
    const { lineup } = get();
    
    // Check field positions
    for (const position of ['POR', 'DEF', 'MED', 'DEL'] as const) {
      const slots = lineup[position];
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].player?.playerId === playerId) {
          return { position, slotIndex: i };
        }
      }
    }
    
    // Check bench
    if (lineup.BENCH.players.some(p => p.playerId === playerId)) {
      return { position: 'BENCH' };
    }
    
    return null;
  },

  canPlaceInSlot: (position: string, slotIndex = 0, playerPosition?: string) => {
    const { lineup, overrideOutOfPosition } = get();
    
    if (position === 'BENCH') {
      return true; // Bench always accepts players
    }
    
    const slots = lineup[position as keyof Omit<LineupState, 'BENCH'>];
    if (!slots || !slots[slotIndex]) return false;
    
    // Check capacity first - now single player per slot
    if (slots[slotIndex].player !== null) return false;
    
    // Check position compatibility unless override is enabled
    if (!overrideOutOfPosition && playerPosition) {
      const positionMap: Record<string, string> = {
        'PORTERO': 'POR',
        'DEFENSA': 'DEF', 
        'MEDIOCENTRO': 'MED',
        'DELANTERO': 'DEL'
      };
      
      const expectedPosition = positionMap[playerPosition.toUpperCase()];
      if (expectedPosition !== position) {
        return false;
      }
    }
    
    return true;
  },

  getSlotOccupancy: (position: string) => {
    const { lineup } = get();
    
    if (position === 'BENCH') {
      return lineup.BENCH.players.length;
    }
    
    const slots = lineup[position as keyof Omit<LineupState, 'BENCH'>];
    if (!slots) return 0;
    
    return slots.reduce((total, slot) => total + (slot.player ? 1 : 0), 0);
  },

  assignPlayerToSlot: (playerRef: PlayerRef, position: string, slotIndex = 0) => {
    const { canPlaceInSlot } = get();
    
    // Check if we can place the player
    if (!canPlaceInSlot(position, slotIndex, playerRef.playerPosition)) {
      return;
    }
    
    set(state => {
      const newLineup = { ...state.lineup };
      
      // Remove player from current position first
      const currentPos = state.findPlayerPosition(playerRef.playerId);
      if (currentPos) {
        if (currentPos.position === 'BENCH') {
          newLineup.BENCH.players = newLineup.BENCH.players.filter(p => p.playerId !== playerRef.playerId);
        } else {
          const slots = newLineup[currentPos.position as keyof Omit<LineupState, 'BENCH'>];
          if (slots && currentPos.slotIndex !== undefined) {
            slots[currentPos.slotIndex].player = null;
          }
        }
      }
      
      // Add player to new position
      if (position === 'BENCH') {
        newLineup.BENCH.players.push(playerRef);
        // Sort bench by player number
        newLineup.BENCH.players.sort((a, b) => parseInt(a.playerNumber) - parseInt(b.playerNumber));
      } else {
        const slots = newLineup[position as keyof Omit<LineupState, 'BENCH'>];
        if (slots && slots[slotIndex]) {
          slots[slotIndex].player = playerRef;
        }
      }
      
      return { ...state, lineup: newLineup };
    });
  },

  removePlayerFromSlot: (playerId: string) => {
    set(state => {
      const newLineup = { ...state.lineup };
      
      // Remove from field positions
      for (const position of ['POR', 'DEF', 'MED', 'DEL'] as const) {
        const slots = newLineup[position];
        for (let i = 0; i < slots.length; i++) {
          if (slots[i].player?.playerId === playerId) {
            slots[i].player = null;
          }
        }
      }
      
      // Remove from bench
      newLineup.BENCH.players = newLineup.BENCH.players.filter(p => p.playerId !== playerId);
      
      return { ...state, lineup: newLineup };
    });
  },

  updateAttendance: (playerId: string, status: 'pending' | 'confirmed' | 'absent') => {
    set(state => ({
      ...state,
      attendances: {
        ...state.attendances,
        [playerId]: status
      }
    }));
    
    // If player is absent, remove from lineup
    if (status === 'absent') {
      get().removePlayerFromSlot(playerId);
    }
  },

  autoAssignPlayer: (playerRef: PlayerRef) => {
    const { lineup, canPlaceInSlot } = get();
    const position = playerRef.playerPosition.toUpperCase();
    
    // Map player positions to lineup positions
    const positionMap: Record<string, keyof Omit<LineupState, 'BENCH'>> = {
      'PORTERO': 'POR',
      'DEFENSA': 'DEF', 
      'MEDIOCENTRO': 'MED',
      'DELANTERO': 'DEL'
    };
    
    const lineupPosition = positionMap[position];
    
    if (lineupPosition) {
      // Try to place in first available slot of player's position
      const slots = lineup[lineupPosition];
      for (let i = 0; i < slots.length; i++) {
        if (canPlaceInSlot(lineupPosition, i)) {
          set(state => {
            const newLineup = { ...state.lineup };
            newLineup[lineupPosition][i].player = playerRef;
            return { ...state, lineup: newLineup };
          });
          return;
        }
      }
    }
    
    // If no slot available, place on bench
    set(state => {
      const newLineup = { ...state.lineup };
      newLineup.BENCH.players.push(playerRef);
      // Sort bench by player number
      newLineup.BENCH.players.sort((a, b) => parseInt(a.playerNumber) - parseInt(b.playerNumber));
      return { ...state, lineup: newLineup };
    });
  },

  resetLineup: () => {
    set(state => ({
      ...state,
      lineup: createLineupForFormation(state.currentFormation),
      attendances: {}
    }));
  },

  moveToBench: (playerId: string) => {
    set(state => {
      const newLineup = { ...state.lineup };
      
      // Find and remove player from field
      let playerToMove: PlayerRef | null = null;
      
      for (const position of ['POR', 'DEF', 'MED', 'DEL'] as const) {
        const slots = newLineup[position];
        for (let i = 0; i < slots.length; i++) {
          if (slots[i].player?.playerId === playerId) {
            playerToMove = slots[i].player;
            slots[i].player = null; // Clear the slot
            break;
          }
        }
        if (playerToMove) break;
      }
      
      // Add to bench if found
      if (playerToMove) {
        newLineup.BENCH.players.push(playerToMove);
        newLineup.BENCH.players.sort((a, b) => parseInt(a.playerNumber) - parseInt(b.playerNumber));
      }
      
      return { ...state, lineup: newLineup };
    });
  },

  setFormation: (formation: { DEF: number; MED: number; DEL: number }) => {
    set(state => {
      // Preserve existing players
      const currentPlayers: PlayerRef[] = [];
      
      // Collect all current field players
      ['POR', 'DEF', 'MED', 'DEL'].forEach(pos => {
        const slots = state.lineup[pos as keyof Omit<LineupState, 'BENCH'>];
        if (Array.isArray(slots)) {
          slots.forEach(slot => {
            if (slot.player) {
              currentPlayers.push(slot.player);
            }
          });
        }
      });
      
      // Create new lineup with new formation
      const newLineup = createLineupForFormation(formation);
      
      // Add bench players back
      newLineup.BENCH.players = [...state.lineup.BENCH.players];
      
      // Try to redistribute field players based on their positions
      currentPlayers.forEach(player => {
        const playerPos = player.playerPosition.toUpperCase();
        const positionMap: Record<string, keyof Omit<LineupState, 'BENCH'>> = {
          'PORTERO': 'POR',
          'DEFENSA': 'DEF',
          'MEDIOCENTRO': 'MED',
          'DELANTERO': 'DEL'
        };
        
        const targetPosition = positionMap[playerPos];
        if (targetPosition && targetPosition !== 'POR') {
          // Find first available slot in target position
          const slots = newLineup[targetPosition];
          for (let i = 0; i < slots.length; i++) {
            if (!slots[i].player) {
              slots[i].player = player;
              return;
            }
          }
        } else if (targetPosition === 'POR' && !newLineup.POR[0].player) {
          newLineup.POR[0].player = player;
          return;
        }
        
        // If no space in preferred position, add to bench
        newLineup.BENCH.players.push(player);
      });
      
      // Sort bench
      newLineup.BENCH.players.sort((a, b) => parseInt(a.playerNumber) - parseInt(b.playerNumber));
      
      return { 
        ...state, 
        lineup: newLineup, 
        currentFormation: formation 
      };
    });
  }
}));