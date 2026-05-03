import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

// ─── Card Component ───────────────────────────────────────────────────────────

type CardVariant = 'default' | 'glass' | 'glow' | 'flat';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    'bg-neo-surface border border-neo-border rounded-neo',
  glass:
    'neo-glass',
  glow:
    'bg-neo-surface border border-neo-accent/30 rounded-neo neo-glow-border',
  flat:
    'bg-neo-bg-alt rounded-neo',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  header,
  footer,
  padding = 'md',
  hoverable = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={hoverable ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={`
        ${variantStyles[variant]}
        ${hoverable ? 'cursor-pointer hover:border-neo-accent/50 transition-colors' : ''}
        ${className}
      `}
      {...props}
    >
      {header && (
        <div className="px-4 py-3 border-b border-neo-border flex items-center justify-between">
          {header}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-neo-border">{footer}</div>
      )}
    </motion.div>
  );
};
