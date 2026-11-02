import { Stack } from 'expo-router';
import { useLargeTitleOptions } from '@/design';

export default function TabStack() {
  return <Stack screenOptions={useLargeTitleOptions()} />;
}
