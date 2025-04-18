import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { ArrowRight, ChevronRight, ExternalLink, Play } from 'lucide-react';
import './ButtonAnimations.css';

type AnimationType = 'glow' | 'lift' | 'gradient' | 'icon-slide' | 'shimmer' | 'cta-primary' | 'cta-secondary' | 'ghost' | 'danger';

interface AnimatedButtonProps extends ButtonProps {
  animation: AnimationType;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  animation,
  icon,
  iconPosition = 'right',
  className = '',
  ...props
}) => {
  // Determine animation class
  const getAnimationClass = () => {
    switch (animation) {
      case 'glow':
        return 'btn-animated btn-glow';
      case 'lift':
        return 'btn-animated btn-lift';
      case 'gradient':
        return 'btn-animated btn-gradient-sweep btn-primary';
      case 'icon-slide':
        return 'btn-animated btn-icon-slide';
      case 'shimmer':
        return 'btn-animated btn-shimmer';
      case 'cta-primary':
        return 'btn-animated btn-cta-primary';
      case 'cta-secondary':
        return 'btn-animated btn-cta-secondary';
      case 'ghost':
        return 'btn-animated btn-ghost';
      case 'danger':
        return 'btn-animated btn-danger';
      default:
        return '';
    }
  };

  // Default icons based on animation type if none provided
  const getDefaultIcon = () => {
    if (icon) return icon;
    
    switch (animation) {
      case 'icon-slide':
      case 'cta-secondary':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const buttonIcon = getDefaultIcon();

  // For icon-slide and cta-secondary animations
  if (animation === 'icon-slide' || animation === 'cta-secondary') {
    return (
      <Button className={`${getAnimationClass()} ${className}`} {...props}>
        {iconPosition === 'left' && buttonIcon && (
          <span className="icon">{buttonIcon}</span>
        )}
        <span className="text">{children}</span>
        {iconPosition === 'right' && buttonIcon && (
          <span className="icon">{buttonIcon}</span>
        )}
      </Button>
    );
  }

  // For all other animations
  return (
    <Button className={`${getAnimationClass()} ${className}`} {...props}>
      {iconPosition === 'left' && buttonIcon && buttonIcon}
      {children}
      {iconPosition === 'right' && buttonIcon && buttonIcon}
    </Button>
  );
};

// Specialized button variants
export const PrimaryButton: React.FC<Omit<AnimatedButtonProps, 'animation'>> = (props) => (
  <AnimatedButton animation="cta-primary" {...props} />
);

export const SecondaryButton: React.FC<Omit<AnimatedButtonProps, 'animation'>> = (props) => (
  <AnimatedButton animation="cta-secondary" icon={props.icon || <ChevronRight className="h-4 w-4" />} {...props} />
);

export const GhostButton: React.FC<Omit<AnimatedButtonProps, 'animation'>> = (props) => (
  <AnimatedButton animation="ghost" {...props} />
);

export const DangerButton: React.FC<Omit<AnimatedButtonProps, 'animation'>> = (props) => (
  <AnimatedButton animation="danger" {...props} />
);

export const PlayButton: React.FC<Omit<AnimatedButtonProps, 'animation' | 'icon'>> = (props) => (
  <AnimatedButton animation="lift" icon={<Play className="h-4 w-4" />} iconPosition="left" {...props} />
);

export const ExternalLinkButton: React.FC<Omit<AnimatedButtonProps, 'animation' | 'icon'>> = (props) => (
  <AnimatedButton animation="icon-slide" icon={<ExternalLink className="h-4 w-4" />} {...props} />
);

export default AnimatedButton;
