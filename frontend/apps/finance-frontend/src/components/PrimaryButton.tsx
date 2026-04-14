import React from 'react';
import THEME from '../config/theme';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const PrimaryButton: React.FC<Props> = ({ children, style, className = '', ...rest }) => {
  const baseStyle: React.CSSProperties = {
    backgroundColor: THEME.accent,
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1rem',
    borderRadius: 8,
  };

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center font-medium transition ${className}`}
      style={{ ...baseStyle, ...style }}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
