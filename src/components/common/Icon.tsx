import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps {
  name: keyof typeof LucideIcons;
  size?: number | string;
  className?: string;
  color?: string;
  onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className = '',
  color,
  onClick
}) => {
  const IconComponent = LucideIcons[name] as React.ComponentType<any>;

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Lucide icons`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      color={color}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'inherit' }}
    />
  );
};

export default Icon;