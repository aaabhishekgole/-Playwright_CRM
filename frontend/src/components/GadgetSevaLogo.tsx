import { useId } from 'react';

type GadgetSevaLogoProps = {
  className?: string;
  title?: string;
};

export function GadgetSevaLogo({ className, title = 'Gadget Seva Hub logo' }: GadgetSevaLogoProps) {
  const gradientId = useId();
  const glowId = useId();

  return (
    <svg
      aria-label={title}
      className={className}
      role="img"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="16" x2="104" y1="14" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6ee7f9" />
          <stop offset="0.45" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientTransform="translate(78 24) rotate(128.216) scale(92.8863)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#67e8f9" stopOpacity="0.95" />
          <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="10" y="10" width="100" height="100" rx="30" fill="#071223" />
      <rect x="10" y="10" width="100" height="100" rx="30" fill={`url(#${glowId})`} />
      <rect x="15" y="15" width="90" height="90" rx="25" fill="none" opacity="0.6" stroke={`url(#${gradientId})`} strokeWidth="1.5" />

      <path d="M35 36H52" stroke="#7dd3fc" strokeLinecap="round" strokeWidth="5" />
      <path d="M68 36H85" stroke="#a78bfa" strokeLinecap="round" strokeWidth="5" />
      <path d="M35 84H52" stroke="#5eead4" strokeLinecap="round" strokeWidth="5" />
      <path d="M68 84H85" stroke="#34d399" strokeLinecap="round" strokeWidth="5" />
      <path d="M27 60H40" stroke="#1d4ed8" strokeLinecap="round" strokeWidth="5" />
      <path d="M80 60H93" stroke="#22c55e" strokeLinecap="round" strokeWidth="5" />

      <path
        d="M60 27L78 37.5V58.5L60 69L42 58.5V37.5L60 27Z"
        fill="none"
        opacity="0.8"
        stroke="#93c5fd"
        strokeWidth="3.5"
      />
      <path d="M60 44L69 49.2V59.8L60 65L51 59.8V49.2L60 44Z" fill={`url(#${gradientId})`} />
      <path d="M60 69V84" stroke="#93c5fd" strokeLinecap="round" strokeWidth="4" />
      <circle cx="60" cy="91" r="5.5" fill="#7dd3fc" />
    </svg>
  );
}
