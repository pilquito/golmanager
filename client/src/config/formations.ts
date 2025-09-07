export interface Formation {
  id: string;
  name: string;
  display: string;
  footballType: '11' | '7';
  positions: {
    DEF: number;
    MED: number;
    DEL: number;
  };
  description?: string;
}

// FORMACIONES DE FÚTBOL 11
export const formations11: Formation[] = [
  { 
    id: '2-2-2-2-2', 
    name: '2-2-2-2-2', 
    display: '2-2-2-2-2', 
    footballType: '11',
    positions: { DEF: 2, MED: 2, DEL: 2 },
    description: 'Formación juvenil con líneas equilibradas'
  },
  { 
    id: '3-2-3-2', 
    name: '3-2-3-2', 
    display: '3-2-3-2', 
    footballType: '11',
    positions: { DEF: 3, MED: 2, DEL: 3 },
    description: 'Sistema ofensivo con 3 defensores'
  },
  { 
    id: '3-3-2-2', 
    name: '3-3-2-2', 
    display: '3-3-2-2', 
    footballType: '11',
    positions: { DEF: 3, MED: 3, DEL: 2 },
    description: 'Equilibrio con medio campo fuerte'
  },
  { 
    id: '3-3-3-1', 
    name: '3-3-3-1', 
    display: '3-3-3-1', 
    footballType: '11',
    positions: { DEF: 3, MED: 3, DEL: 1 },
    description: 'Un delantero de referencia con apoyo desde atrás'
  },
  { 
    id: '3-4-1-2', 
    name: '3-4-1-2', 
    display: '3-4-1-2', 
    footballType: '11',
    positions: { DEF: 3, MED: 4, DEL: 1 },
    description: 'Medio campo poblado con un delantero'
  },
  { 
    id: '3-4-2-1', 
    name: '3-4-2-1', 
    display: '3-4-2-1', 
    footballType: '11',
    positions: { DEF: 3, MED: 4, DEL: 1 },
    description: 'Sistema con mediapunta y delantero'
  },
  { 
    id: '3-4-3', 
    name: '3-4-3', 
    display: '3-4-3', 
    footballType: '11',
    positions: { DEF: 3, MED: 4, DEL: 3 },
    description: 'Sistema ofensivo clásico'
  },
  { 
    id: '3-4-3-diamond', 
    name: '3-4-3 sistema (de diamante)', 
    display: '3-4-3 sistema (de diamante)', 
    footballType: '11',
    positions: { DEF: 3, MED: 4, DEL: 3 },
    description: 'Variante con medio campo en rombo'
  },
  { 
    id: '3-5-2', 
    name: '3-5-2', 
    display: '3-5-2', 
    footballType: '11',
    positions: { DEF: 3, MED: 5, DEL: 2 },
    description: 'Control del centro del campo'
  },
  { 
    id: '4-1-3-2', 
    name: '4-1-3-2', 
    display: '4-1-3-2', 
    footballType: '11',
    positions: { DEF: 4, MED: 1, DEL: 3 },
    description: 'Pivote defensivo con creativos arriba'
  },
  { 
    id: '4-1-4-1', 
    name: '4-1-4-1', 
    display: '4-1-4-1', 
    footballType: '11',
    positions: { DEF: 4, MED: 1, DEL: 4 },
    description: 'Línea defensiva sólida con banda'
  },
  { 
    id: '4-2-2-2', 
    name: '4-2-2-2', 
    display: '4-2-2-2', 
    footballType: '11',
    positions: { DEF: 4, MED: 2, DEL: 2 },
    description: 'Sistema equilibrado línea por línea'
  },
  { 
    id: '4-4-2', 
    name: '4-4-2', 
    display: '4-4-2', 
    footballType: '11',
    positions: { DEF: 4, MED: 4, DEL: 2 },
    description: 'Formación clásica y equilibrada'
  },
  { 
    id: '4-3-3', 
    name: '4-3-3', 
    display: '4-3-3', 
    footballType: '11',
    positions: { DEF: 4, MED: 3, DEL: 3 },
    description: 'Sistema ofensivo moderno'
  },
];

// FORMACIONES DE FÚTBOL 7
export const formations7: Formation[] = [
  { 
    id: '2-3-1', 
    name: '2-3-1', 
    display: '2-3-1', 
    footballType: '7',
    positions: { DEF: 2, MED: 3, DEL: 1 },
    description: 'Sistema equilibrado - Más control del medio campo'
  },
  { 
    id: '3-2-1', 
    name: '3-2-1', 
    display: '3-2-1', 
    footballType: '7',
    positions: { DEF: 3, MED: 2, DEL: 1 },
    description: 'Sistema defensivo - Mayor presencia atrás'
  },
  { 
    id: '1-3-2', 
    name: '1-3-2', 
    display: '1-3-2', 
    footballType: '7',
    positions: { DEF: 1, MED: 3, DEL: 2 },
    description: 'Sistema versátil - Equilibrio defensivo-ofensivo'
  },
  { 
    id: '2-1-2-1', 
    name: '2-1-2-1', 
    display: '2-1-2-1', 
    footballType: '7',
    positions: { DEF: 2, MED: 1, DEL: 2 },
    description: 'Sistema dinámico - Transiciones rápidas'
  },
  { 
    id: '1-1-3-1', 
    name: '1-1-3-1', 
    display: '1-1-3-1', 
    footballType: '7',
    positions: { DEF: 1, MED: 1, DEL: 3 },
    description: 'Sistema arriesgado - Contraataques rápidos'
  },
  { 
    id: '2-2-2', 
    name: '2-2-2', 
    display: '2-2-2', 
    footballType: '7',
    positions: { DEF: 2, MED: 2, DEL: 2 },
    description: 'Sistema ofensivo - Juego dinámico y divertido'
  },
];

// Función helper para obtener formaciones según el tipo de fútbol
export function getFormationsByType(footballType: '11' | '7'): Formation[] {
  return footballType === '11' ? formations11 : formations7;
}

// Todas las formaciones combinadas
export const FORMATIONS: Formation[] = [...formations11, ...formations7];

export default FORMATIONS;