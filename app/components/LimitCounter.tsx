import { LimitDial } from 'lucide-react';

export default function LimitCounter({ used, limit, resetAt }: { used: number; limit: number; resetAt: string }) {
  const remaining = limit - used;
  const resetHours = Math.ceil((new Date(resetAt).getTime() - Date.now()) / (1000 * 60 * 60));
  
  return (
    <div className="neu-card p-4 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="text-orange-500"><LimitDial className="icon-smooth" size={24} /></div>
        <div>
          <p className="text-sm font-bold">Daily Limit</p>
          <p className="text-xs text-gray-400">
            {remaining > 0 ? `${remaining} download tersisa` : 'Limit harian habis'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex gap-1 mb-1">
          {Array.from({ length: limit }).map((_, i) => (
            <div 
              key={i} 
              className={`w-2 h-4 rounded-sm ${i < used ? 'bg-orange-500' : 'bg-gray-700'}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">{used}/{limit} • Reset dalam {resetHours}h</p>
      </div>
    </div>
  );
}
