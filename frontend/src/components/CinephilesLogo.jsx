export function CinephilesLogo({ showText = true, size = 'md' }) {
  const boxSize = size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        fill="none"
        className={`${boxSize} shrink-0 drop-shadow-sm`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cinephiles-logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#cinephiles-logo-grad)" />
        <rect x="13" y="16" width="38" height="32" rx="6" stroke="#ffffff" strokeWidth="3.4" />
        <circle cx="20" cy="23" r="2.1" fill="#ffffff" />
        <circle cx="20" cy="41" r="2.1" fill="#ffffff" />
        <circle cx="44" cy="23" r="2.1" fill="#ffffff" />
        <circle cx="44" cy="41" r="2.1" fill="#ffffff" />
        <path d="M28 25.5L39 32L28 38.5V25.5Z" fill="#ffffff" />
      </svg>
      {showText && (
        <span className={`${textSize} font-bold tracking-tight text-white`}>
          Cine<span className="text-teal-400">philes</span>
        </span>
      )}
    </span>
  );
}
