import React from 'react';
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}

const VARIANT_CONTAINER: Record<Variant, string> = {
  primary: 'bg-teal-dark',
  secondary: 'bg-coral',
  outline: 'bg-transparent border border-teal-dark',
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: 'text-cream',
  secondary: 'text-cream',
  outline: 'text-teal-dark',
};

export function Button({ label, variant = 'primary', loading, disabled, className, ...rest }: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      className={`h-14 w-full flex-row items-center justify-center rounded-md px-4 ${VARIANT_CONTAINER[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#0B4F6C' : '#F7F3EE'} />
      ) : (
        <Text className={`font-subheading text-h3 ${VARIANT_TEXT[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
