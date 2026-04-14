import React from 'react';
import { designSystem } from '../../styles/designSystem';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      header,
      footer,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const paddingMap = {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '2.5rem',
    };

    const variantStyles = {
      default: {
        backgroundColor: designSystem.colors.bg.secondary,
        border: `1px solid ${designSystem.colors.border.light}`,
        boxShadow: designSystem.shadows.sm,
      },
      elevated: {
        backgroundColor: designSystem.colors.bg.secondary,
        border: 'none',
        boxShadow: designSystem.shadows.md,
      },
      bordered: {
        backgroundColor: designSystem.colors.bg.primary,
        border: `2px solid ${designSystem.colors.border.DEFAULT}`,
        boxShadow: 'none',
      },
    };

    return (
      <div
        ref={ref}
        style={{
          ...variantStyles[variant],
          borderRadius: designSystem.borderRadius.lg,
          overflow: 'hidden',
        }}
        className={className}
        {...props}
      >
        {header && (
          <div
            style={{
              padding: paddingMap[padding],
              borderBottom: `1px solid ${designSystem.colors.border.light}`,
              backgroundColor: designSystem.colors.bg.tertiary,
            }}
          >
            {header}
          </div>
        )}

        <div style={{ padding: paddingMap[padding] }}>{children}</div>

        {footer && (
          <div
            style={{
              padding: paddingMap[padding],
              borderTop: `1px solid ${designSystem.colors.border.light}`,
              backgroundColor: designSystem.colors.bg.tertiary,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
