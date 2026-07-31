import React from 'react';
import { View, Text, Image } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

const SIZE_STYLES: Record<Size, { box: string; text: string }> = {
  sm: { box: 'h-8 w-8', text: 'text-caption' },
  md: { box: 'h-12 w-12', text: 'text-h3' },
  lg: { box: 'h-16 w-16', text: 'text-h1' },
};

interface AvatarProps {
  name: string;
  imageUri?: string;
  size?: Size;
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Avatar({ name, imageUri, size = 'md' }: AvatarProps) {
  const { box, text } = SIZE_STYLES[size];

  if (imageUri) {
    return <Image source={{ uri: imageUri }} className={`${box} rounded-full`} accessibilityLabel={name} />;
  }

  return (
    <View className={`${box} items-center justify-center rounded-full bg-teal-light`}>
      <Text className={`font-subheading ${text} text-teal-dark`}>{initialsFromName(name)}</Text>
    </View>
  );
}
