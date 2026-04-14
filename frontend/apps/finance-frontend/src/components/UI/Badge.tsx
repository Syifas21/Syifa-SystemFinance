import React from 'react';
import { designSystem } from '../../styles/designSystem';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'info', size = 'md', className = '', children, ...props }, ref) => {
    const variantStyles = {
      success: {
        backgroundColor: designSystem.colors.success.lighter,
        color: designSystem.colors.success.dark,
      },
      warning: {
        backgroundColor: designSystem.colors.warning.lighter,
        color: designSystem.colors.warning.dark,
      },
      error: {
        backgroundColor: designSystem.colors.error.lighter,
        color: designSystem.colors.error.dark,
      },
      info: {
        backgroundColor: designSystem.colors.info.lighter,
        color: designSystem.colors.info.dark,
      },
      neutral: {
        backgroundColor: designSystem.colors.neutral[200],
        color: designSystem.colors.neutral[700],
      },
    };

    const sizeStyles = {
      sm: {
        padding: '0.25rem 0.5rem',
        fontSize: designSystem.typography.fontSize.xs,
        fontWeight: designSystem.typography.fontWeight.medium,
      },
      md: {
        padding: '0.375rem 0.75rem',
        fontSize: designSystem.typography.fontSize.sm,
        fontWeight: designSystem.typography.fontWeight.semibold,
      },
      lg: {
        padding: '0.5rem 1rem',
        fontSize: designSystem.typography.fontSize.base,
        fontWeight: designSystem.typography.fontWeight.semibold,
      },
    };

    return (
      <span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: designSystem.borderRadius.full,
          ...variantStyles[variant],
          ...sizeStyles[size],
        }}
        className={className}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
