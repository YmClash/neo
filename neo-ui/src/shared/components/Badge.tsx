import React from 'react';

// ─── Badge Component ──────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-neo-surface text-neo-text-dim border border-neo-border',
  success: 'bg-neo-success/10 text-neo-success border border-neo-success/30',
  warning: 'bg-neo-warning/10 text-neo-warning border border-neo-warning/30',
  danger:  'bg-neo-danger/10 text-neo-danger border border-neo-danger/30',
  info:    'bg-neo-info/10 text-neo-info border border-neo-info/30',
  accent:  'bg-neo-accent/10 text-neo-accent border border-neo-accent/30',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neo-text-dim',
  success: 'bg-neo-success',
  warning: 'bg-neo-warning',
  danger:  'bg-neo-danger',
  info:    'bg-neo-info',
  accent:  'bg-neo-accent',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false,
  children,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-mono font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${dotColors[variant]}`}
          />
        </span>
      )}
      {children}
    </span>
  );
};
