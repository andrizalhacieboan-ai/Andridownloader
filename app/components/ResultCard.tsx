import { Download, User, Clock } from 'lucide-react';

export default function ResultCard({ data }: { data: any }) {
  return (
    <div className="neu-card p-6 mt-6 flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
        {data.thumbnail ? (
          <img src={data.thumbnail} alt={data.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600">No Preview</div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-500 bg-orange-500/10 rounded-full">
            {data.platform}
          </span>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{data.title}</h3>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
          {data.author && (
            <div className="flex items-center gap-1">
              <User size={14} className="icon-smooth" /> {data.author}
            </div>
          )}
          {data.duration && (
            <div className="flex items-center gap-1">
              <Clock size={14} className="icon-smooth" /> {Math.round(data.duration)}s
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {data.media.map((m: any, i: number) => (
            <a 
              key={i} 
              href={m.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="neu-button-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            >
              <Download size={16} className="icon-smooth" />
              {data.media.length > 1 ? `Download ${i + 1}` : 'Download'} ({m.format.toUpperCase()})
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
