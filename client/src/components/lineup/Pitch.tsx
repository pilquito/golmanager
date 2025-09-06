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
      {/* Field Background */}
      <div className="relative bg-gradient-to-b from-green-400 to-green-500 rounded-lg p-6 shadow-lg min-h-[500px]">
        
        {/* Field Lines */}
        <div className="absolute inset-4 border-2 border-white/60 rounded">
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/60 rounded-full"></div>
          {/* Center Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/60"></div>
          {/* Penalty Areas */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-12 border-2 border-white/60 border-t-0"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-12 border-2 border-white/60 border-b-0"></div>
        </div>

        {/* Formation Layout - 4-4-2 */}
        <div className="relative h-full flex flex-col justify-between py-8">
          
          {/* Forwards (DEL) - Top */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-8">
              {lineup.DEL.map((slot, index) => (
                <LineSlot
                  key={`del-${index}`}
                  position="DEL"
                  slotIndex={index}
                  slot={slot}
                  size="md"
                />
              ))}
            </div>
          </div>

          {/* Midfielders (MED) */}
          <div className="flex justify-center">
            <div className="grid grid-cols-4 gap-4">
              {lineup.MED.map((slot, index) => (
                <LineSlot
                  key={`med-${index}`}
                  position="MED"
                  slotIndex={index}
                  slot={slot}
                  size="md"
                />
              ))}
            </div>
          </div>

          {/* Defenders (DEF) */}
          <div className="flex justify-center">
            <div className="grid grid-cols-4 gap-4">
              {lineup.DEF.map((slot, index) => (
                <LineSlot
                  key={`def-${index}`}
                  position="DEF"
                  slotIndex={index}
                  slot={slot}
                  size="md"
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
              size="lg"
            />
          </div>
        </div>

        {/* Position Statistics */}
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs">
          <div className="grid grid-cols-2 gap-1 text-center">
            <div className="text-red-600 font-medium">DEL: {getSlotOccupancy('DEL')}/4</div>
            <div className="text-green-600 font-medium">MED: {getSlotOccupancy('MED')}/8</div>
            <div className="text-blue-600 font-medium">DEF: {getSlotOccupancy('DEF')}/8</div>
            <div className="text-yellow-600 font-medium">POR: {getSlotOccupancy('POR')}/2</div>
          </div>
        </div>

        {/* Formation Label */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
          <span className="text-sm font-bold text-green-800">4-4-2</span>
        </div>
      </div>
    </div>
  );
}