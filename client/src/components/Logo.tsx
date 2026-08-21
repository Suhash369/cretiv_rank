import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showSubtitle = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Infinity Network Mesh SVG Logo (Cretivra Brand) */}
      <svg
        className={`${iconSizes[size]} shrink-0`}
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="cretivraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0059FF" />
            <stop offset="50%" stopColor="#00A3FF" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Infinity Outer Mesh Loops */}
        <path
          d="M 60 60 C 20 20, 20 100, 60 60 C 100 20, 140 20, 140 60 C 140 100, 100 100, 60 60 Z"
          stroke="url(#cretivraGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter="url(#glow)"
        />

        {/* Inner Geometric Mesh Lines */}
        <path
          d="M 35 40 L 85 80 M 35 80 L 85 40 M 115 40 L 165 80 M 115 80 L 165 40 M 60 20 L 140 100 M 60 100 L 140 20"
          stroke="url(#cretivraGradient)"
          strokeWidth="2.5"
          strokeOpacity="0.7"
        />

        {/* Network Nodes (Dots) */}
        <circle cx="60" cy="20" r="5" fill="#00E5FF" />
        <circle cx="140" cy="20" r="5" fill="#00E5FF" />
        <circle cx="60" cy="100" r="5" fill="#0059FF" />
        <circle cx="140" cy="100" r="5" fill="#0059FF" />
        <circle cx="100" cy="60" r="6" fill="#00A3FF" />
        <circle cx="35" cy="40" r="4.5" fill="#00A3FF" />
        <circle cx="35" cy="80" r="4.5" fill="#0059FF" />
        <circle cx="165" cy="40" r="4.5" fill="#00E5FF" />
        <circle cx="165" cy="80" r="4.5" fill="#00A3FF" />
      </svg>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <span className={`font-black text-white leading-none tracking-tight ${textSizes[size]}`}>
          CretivRank
        </span>
        {showSubtitle && (
          <span className="text-[10px] font-extrabold text-brand-400 tracking-widest uppercase mt-0.5">
            by Cretivra
          </span>
        )}
      </div>
    </div>
  );
};
