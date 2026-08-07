import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function tabIcon(activeName: IoniconName, inactiveName: IoniconName) {
  return function TabIcon({ color, focused, size }: { color: string; focused: boolean; size: number }) {
    return <Ionicons name={focused ? activeName : inactiveName} color={color} size={size} />;
  };
}
