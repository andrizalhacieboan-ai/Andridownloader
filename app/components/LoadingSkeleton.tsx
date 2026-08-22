export default function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="flex gap-3">
        <span className="dot animate-bounce-smooth" style={{ animationDelay: '-0.32s' }}></span>
        <span className="dot animate-bounce-smooth" style={{ animationDelay: '-0.16s' }}></span>
        <span className="dot animate-bounce-smooth"></span>
      </div>
      <p className="text-gray-400 text-sm font-medium tracking-wide animate-pulse">
        Wait memproses...
      </p>
    </div>
  );
}
