export function SparkLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-11 w-11 rounded-2xl bg-primary-gradient shadow-float grid place-items-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7 text-sunny" fill="currentColor">
          <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-mint border-2 border-background" />
      </div>
      <div className="leading-none">
        <div className="font-display text-2xl font-bold tracking-tight">
          <span className="text-primary">SP</span>
          <span className="text-mint">ARK</span>
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
          Play · Think · Win
        </div>
      </div>
    </div>
  );
}
