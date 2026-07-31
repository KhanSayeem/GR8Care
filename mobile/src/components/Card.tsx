import React from 'react';
import { View, ViewProps } from 'react-native';

type Variant = 'default' | 'highlight' | 'warning';

const VARIANT_STYLES: Record<Variant, string> = {
  default: 'bg-white border-border',
  highlight: 'bg-teal-light border-teal-mid',
  warning: 'bg-white border-warning',
};

interface CardProps extends ViewProps {
  variant?: Variant;
}

export function Card({ variant = 'default', className, style, ...rest }: CardProps & { className?: string }) {
  return (
    <View
      className={`rounded-md border p-4 ${VARIANT_STYLES[variant]} ${className ?? ''}`}
      style={[{ shadowColor: '#0A4F6B', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, style]}
      {...rest}
    />
  );
}
