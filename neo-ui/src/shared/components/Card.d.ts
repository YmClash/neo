import React from 'react';
import { type HTMLMotionProps } from 'framer-motion';
type CardVariant = 'default' | 'glass' | 'glow' | 'flat';
interface CardProps extends HTMLMotionProps<'div'> {
    variant?: CardVariant;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hoverable?: boolean;
    children: React.ReactNode;
}
export declare const Card: React.FC<CardProps>;
export {};
//# sourceMappingURL=Card.d.ts.map