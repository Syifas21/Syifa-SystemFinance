import React from 'react';
import { designSystem } from '../../styles/designSystem';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      isLoading = false,
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      font-family: ${designSystem.typography.fontFamily.base};
      font-weight: ${designSystem.typography.fontWeight.semibold};
      border-radius: ${designSystem.borderRadius.md};
      transition: ${designSystem.transitions.fast};
      cursor: ${disabled || isLoading ? 'not-allowed' : 'pointer'};
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: none;
      font-size: ${designSystem.typography.fontSize.base};
    `;

    const variantStyles = {
      primary: `
        background-color: ${designSystem.colors.primary.DEFAULT};
        color: ${designSystem.colors.text.inverse};
        &:hover:not(:disabled) {
          background-color: ${designSystem.colors.primary.light};
        }
      `,
      secondary: `
        background-color: ${designSystem.colors.secondary.DEFAULT};
        color: ${designSystem.colors.text.inverse};
        &:hover:not(:disabled) {
          background-color: ${designSystem.colors.secondary.light};
        }
      `,
      success: `
        background-color: ${designSystem.colors.success.DEFAULT};
        color: ${designSystem.colors.text.inverse};
        &:hover:not(:disabled) {
          background-color: ${designSystem.colors.success.dark};
        }
      `,
      danger: `
        background-color: ${designSystem.colors.error.DEFAULT};
        color: ${designSystem.colors.text.inverse};
        &:hover:not(:disabled) {
          background-color: ${designSystem.colors.error.dark};
        }
      `,
      outline: `
        background-color: transparent;
        color: ${designSystem.colors.primary.DEFAULT};
        border: 2px solid ${designSystem.colors.primary.DEFAULT};
        &:hover:not(:disabled) {
          background-color: ${designSystem.colors.primary.lightest};
        }
      `,
      ghost: `
        background-color: transparent;
        color: ${designSystem.colors.primary.DEFAULT};
        &:hover:not(:disabled) {
          background-color: ${designSystem.colors.neutral[100]};
        }
      `,
    };

    const sizeStyles = {
      xs: `
        padding: 0.375rem 0.75rem;
        font-size: ${designSystem.typography.fontSize.xs};
        min-height: 1.75rem;
      `,
      sm: `
        padding: 0.5rem 1rem;
        font-size: ${designSystem.typography.fontSize.sm};
        min-height: 2rem;
      `,
      md: `
        padding: 0.625rem 1.25rem;
        font-size: ${designSystem.typography.fontSize.base};
        min-height: 2.5rem;
      `,
      lg: `
        padding: 0.75rem 1.5rem;
        font-size: ${designSystem.typography.fontSize.lg};
        min-height: 3rem;
      `,
      xl: `
        padding: 1rem 2rem;
        font-size: ${designSystem.typography.fontSize.xl};
        min-height: 3.5rem;
      `,
    };

    const disabledStyles = disabled
      ? `
        opacity: 0.6;
        pointer-events: none;
      `
      : '';

    const fullWidthStyles = fullWidth ? 'width: 100%;' : '';

    const combinedStyles = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${disabledStyles}
      ${fullWidthStyles}
      ${className}
    `.replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        style={{
          fontFamily: designSystem.typography.fontFamily.base,
          fontWeight: designSystem.typography.fontWeight.semibold,
          borderRadius: designSystem.borderRadius.md,
          transition: designSystem.transitions.fast,
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          border: 'none',
          ...(variant === 'primary' && {
            backgroundColor: designSystem.colors.primary.DEFAULT,
            color: designSystem.colors.text.inverse,
          }),
          ...(variant === 'secondary' && {
            backgroundColor: designSystem.colors.secondary.DEFAULT,
            color: designSystem.colors.text.inverse,
          }),
          ...(variant === 'success' && {
            backgroundColor: designSystem.colors.success.DEFAULT,
            color: designSystem.colors.text.inverse,
          }),
          ...(variant === 'danger' && {
            backgroundColor: designSystem.colors.error.DEFAULT,
            color: designSystem.colors.text.inverse,
          }),
          ...(variant === 'outline' && {
            backgroundColor: 'transparent',
            color: designSystem.colors.primary.DEFAULT,
            border: `2px solid ${designSystem.colors.primary.DEFAULT}`,
          }),
          ...(variant === 'ghost' && {
            backgroundColor: 'transparent',
            color: designSystem.colors.primary.DEFAULT,
          }),
          ...(variant === 'xs' && {
            padding: '0.375rem 0.75rem',
            fontSize: designSystem.typography.fontSize.xs,
            minHeight: '1.75rem',
          }),
          ...(size === 'sm' && {
            padding: '0.5rem 1rem',
            fontSize: designSystem.typography.fontSize.sm,
            minHeight: '2rem',
          }),
          ...(size === 'md' && {
            padding: '0.625rem 1.25rem',
            fontSize: designSystem.typography.fontSize.base,
            minHeight: '2.5rem',
          }),
          ...(size === 'lg' && {
            padding: '0.75rem 1.5rem',
            fontSize: designSystem.typography.fontSize.lg,
            minHeight: '3rem',
          }),
          ...(size === 'xl' && {
            padding: '1rem 2rem',
            fontSize: designSystem.typography.fontSize.xl,
            minHeight: '3.5rem',
          }),
          ...(disabled && {
            opacity: 0.6,
            pointerEvents: 'none',
          }),
          ...(fullWidth && {
            width: '100%',
          }),
        }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            {children}
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
