import React from 'react';
import { useNavigate } from 'react-router-dom';
import { designSystem } from '../../styles/designSystem';

interface QuickActionButtonProps {
  label: string;
  description: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  path: string;
  color: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  description,
  icon: Icon,
  path,
  color,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      onClick={() => {
        console.log('🔗 Navigating to:', path);
        navigate(path);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        backgroundColor: isHovered ? `${color}20` : `${color}10`,
        border: `1px solid ${color}20`,
        borderRadius: designSystem.borderRadius.md,
        cursor: 'pointer',
        transition: 'all 200ms ease-in-out',
        textAlign: 'left',
        fontSize: 'inherit',
        fontFamily: 'inherit',
      }}
    >
      <Icon
        style={{
          width: '1.25rem',
          height: '1.25rem',
          color: color,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: designSystem.typography.fontSize.sm,
            fontWeight: designSystem.typography.fontWeight.semibold,
            color: designSystem.colors.text.primary,
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: 0,
            marginTop: '0.25rem',
            fontSize: designSystem.typography.fontSize.xs,
            color: designSystem.colors.text.secondary,
          }}
        >
          {description}
        </p>
      </div>
    </button>
  );
};

export default QuickActionButton;
