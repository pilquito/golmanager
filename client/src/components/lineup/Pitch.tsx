import { LineSlot } from './LineSlot';
import { useMatchStore } from '@/stores/useMatchStore';
import { cn } from '@/lib/utils';

interface PitchProps {
  className?: string;
}

export function Pitch({ className }: PitchProps) {
  const { lineup, getSlotOccupancy } = useMatchStore();

  return (
    <div className={cn("relative", className)}>
      {/* LINEUP11 Style Field Background */}
      <div className="relative min-h-[600px] bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Grass Pattern Overlay */}
        <div className="absolute inset-0 opacity-30" 
             style={{
               background: `linear-gradient(90deg, transparent 48%, rgba(255,255,255,0.1) 49%, rgba(255,255,255,0.1) 51%, transparent 52%)`,
               backgroundSize: '100px 100px'
             }}>
        </div>

        {/* Field Branding - Top Corners */}
        <div className="absolute top-4 left-4 text-white/80 font-bold text-sm">
          Alineación
        </div>
        <div className="absolute top-4 right-4 text-white/80 font-bold text-sm">
          Alineación
        </div>

        {/* Field Lines - More realistic like LINEUP11 */}
        <div className="absolute inset-6 border-2 border-white/70 rounded-lg">
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/70 rounded-full"></div>
          {/* Center Dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/70"></div>
          
          {/* Top Goal Area */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-16 border-2 border-white/70 border-t-0 rounded-b-sm"></div>
          {/* Top Small Box */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-8 border-2 border-white/70 border-t-0"></div>
          
          {/* Bottom Goal Area */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-16 border-2 border-white/70 border-b-0 rounded-t-sm"></div>
          {/* Bottom Small Box */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-8 border-2 border-white/70 border-b-0"></div>
        </div>

        {/* Formation Layout - 4-4-2 LINEUP11 Style */}
        <div className="relative h-full flex flex-col justify-between py-12">
          
          {/* Forwards (DEL) - Top */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-12">
              {lineup.DEL.map((slot, index) => (
                <LineSlot
                  key={`del-${index}`}
                  position="DEL"
                  slotIndex={index}
                  slot={slot}
                  size="lineup11"
                />
              ))}
            </div>
          </div>

          {/* Midfielders (MED) */}
          <div className="flex justify-center">
            <div className="grid grid-cols-4 gap-6">
              {lineup.MED.map((slot, index) => (
                <LineSlot
                  key={`med-${index}`}
                  position="MED"
                  slotIndex={index}
                  slot={slot}
                  size="lineup11"
                />
              ))}
            </div>
          </div>

          {/* Defenders (DEF) */}
          <div className="flex justify-center">
            <div className="grid grid-cols-4 gap-6">
              {lineup.DEF.map((slot, index) => (
                <LineSlot
                  key={`def-${index}`}
                  position="DEF"
                  slotIndex={index}
                  slot={slot}
                  size="lineup11"
                />
              ))}
            </div>
          </div>

          {/* Goalkeeper (POR) - Bottom */}
          <div className="flex justify-center">
            <LineSlot
              key="por-0"
              position="POR"
              slotIndex={0}
              slot={lineup.POR[0]}
              size="lineup11-gk"
            />
          </div>
        </div>

        {/* Formation Label - Bottom Right */}
        <div className="absolute bottom-4 right-4">
          <span className="text-white font-bold text-lg">#Alineación</span>
        </div>
      </div>
    </div>
  );
}