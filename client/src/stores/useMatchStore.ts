import { create } from 'zustand';
import { apiRequest } from '@/lib/queryClient';

export interface PlayerRef {
  playerId: string;
  playerName: string;
  playerNumber: string;
  playerPosition: string;
}

export interface Slot {
  players: PlayerRef[];
}

export interface LineupState {
  POR: [Slot];
  DEF: [Slot, Slot, Slot, Slot];
  MED: [Slot, Slot, Slot, Slot];
  DEL: [Slot, Slot];
  BENCH: Slot;
}

export interface MatchState {
  matchId: string | null;
  lineup: LineupState;
  overrideOutOfPosition: boolean;
  attendances: Record<string, 'pending' | 'confirmed' | 'absent'>;
}

interface MatchStore extends MatchState {
  // Actions
  setMatch: (matchId: string) => void;
  setOverrideOutOfPosition: (enabled: boolean) => void;
  placePlayer: (playerId: string, fromPosition: string, toPosition: string, slotIndex?: number) => void;
  removePlayerFromSlot: (playerId: string) => void;
  updateAttendance: (playerId: string, status: 'pending' | 'confirmed' | 'absent') => void;
  autoAssignPlayer: (playerRef: PlayerRef) => void;
  resetLineup: () => void;
  
  // Helpers
  findPlayerPosition: (playerId: string) => { position: string; slotIndex?: number } | null;
  canDropInSlot: (position: string, slotIndex?: number) => boolean;
  getSlotOccupancy: (position: string) => number;
}

const createEmptySlot = (): Slot => ({ players: [] });

const createInitialLineup = (): LineupState => ({
  POR: [createEmptySlot()],
  DEF: [createEmptySlot(), createEmptySlot(), createEmptySlot(), createEmptySlot()],
  MED: [createEmptySlot(), createEmptySlot(), createEmptySlot(), createEmptySlot()],
  DEL: [createEmptySlot(), createEmptySlot()],
  BENCH: createEmptySlot()
});

export const useMatchStore = create<MatchStore>((set, get) => ({
  matchId: null,
  lineup: createInitialLineup(),
  overrideOutOfPosition: false,
  attendances: {},

  setMatch: (matchId: string) => {
    set({ 
      matchId,
      lineup: createInitialLineup(),
      attendances: {},
      overrideOutOfPosition: false
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
        if (slots[i].players.some(p => p.playerId === playerId)) {
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

  canDropInSlot: (position: string, slotIndex = 0, playerPosition?: string) => {
    const { lineup, overrideOutOfPosition } = get();
    
    if (position === 'BENCH') {
      return true; // Bench always accepts players
    }
    
    const slots = lineup[position as keyof Omit<LineupState, 'BENCH'>];
    if (!slots || !slots[slotIndex]) return false;
    
    // Check capacity first
    if (slots[slotIndex].players.length >= 2) return false;
    
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
    
    return slots.reduce((total, slot) => total + slot.players.length, 0);
  },

  placePlayer: (playerId: string, fromPosition: string, toPosition: string, slotIndex = 0) => {
    const { lineup, canDropInSlot } = get();
    
    // Can't drop in full slot
    if (!canDropInSlot(toPosition, slotIndex)) {
      return;
    }
    
    set(state => {
      const newLineup = { ...state.lineup };
      
      // Remove player from current position
      const currentPos = state.findPlayerPosition(playerId);
      if (currentPos) {
        if (currentPos.position === 'BENCH') {
          newLineup.BENCH.players = newLineup.BENCH.players.filter(p => p.playerId !== playerId);
        } else {
          const slots = newLineup[currentPos.position as keyof Omit<LineupState, 'BENCH'>];
          if (slots && currentPos.slotIndex !== undefined) {
            slots[currentPos.slotIndex].players = slots[currentPos.slotIndex].players.filter(p => p.playerId !== playerId);
          }
        }
      }
      
      // Find player reference (assuming it exists somewhere in the lineup)
      let playerRef: PlayerRef | null = null;
      for (const position of ['POR', 'DEF', 'MED', 'DEL'] as const) {
        const slots = newLineup[position];
        for (const slot of slots) {
          const found = slot.players.find(p => p.playerId === playerId);
          if (found) {
            playerRef = found;
            break;
          }
        }
        if (playerRef) break;
      }
      
      if (!playerRef) {
        playerRef = newLineup.BENCH.players.find(p => p.playerId === playerId) || null;
      }
      
      if (!playerRef) return state; // Player not found
      
      // Add player to new position
      if (toPosition === 'BENCH') {
        newLineup.BENCH.players.push(playerRef);
        // Sort bench by player number
        newLineup.BENCH.players.sort((a, b) => parseInt(a.playerNumber) - parseInt(b.playerNumber));
      } else {
        const slots = newLineup[toPosition as keyof Omit<LineupState, 'BENCH'>];
        if (slots && slots[slotIndex]) {
          slots[slotIndex].players.push(playerRef);
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
          slots[i].players = slots[i].players.filter(p => p.playerId !== playerId);
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
    const { lineup, canDropInSlot } = get();
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
        if (canDropInSlot(lineupPosition, i)) {
          set(state => {
            const newLineup = { ...state.lineup };
            newLineup[lineupPosition][i].players.push(playerRef);
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
      lineup: createInitialLineup(),
      attendances: {}
    }));
  }
}));