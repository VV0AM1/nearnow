import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';

export type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Ionicons name → SF Symbol. On iOS the native SF Symbol is drawn (matches system
 * apps, scales with Dynamic Type weight); everywhere else, or for unmapped names,
 * the Ionicon is used. Outline/filled pairs map to the plain and `.fill` symbols.
 */
const SF: Partial<Record<IoniconName, SFSymbol>> = {
  add: 'plus',
  'add-circle': 'plus.circle.fill',
  'add-circle-outline': 'plus.circle',
  'alert-circle': 'exclamationmark.circle.fill',
  'alert-circle-outline': 'exclamationmark.circle',
  'arrow-back': 'chevron.backward',
  ban: 'nosign',
  bookmark: 'bookmark.fill',
  'bookmark-outline': 'bookmark',
  business: 'building.2.fill',
  'business-outline': 'building.2',
  calendar: 'calendar',
  call: 'phone.fill',
  camera: 'camera.fill',
  'camera-outline': 'camera',
  'chatbubble-ellipses': 'ellipsis.bubble.fill',
  'chatbubble-outline': 'bubble.left',
  checkmark: 'checkmark',
  'checkmark-done': 'checkmark.circle.fill',
  'chevron-down': 'chevron.down',
  'chevron-forward': 'chevron.forward',
  close: 'xmark',
  'close-circle': 'xmark.circle.fill',
  'cloud-offline-outline': 'icloud.slash',
  create: 'square.and.pencil',
  'create-outline': 'square.and.pencil',
  'document-text-outline': 'doc.text',
  'eye-off-outline': 'eye.slash',
  'eye-outline': 'eye',
  flag: 'flag.fill',
  'flag-outline': 'flag',
  'git-compare-outline': 'arrow.left.arrow.right',
  'hand-left-outline': 'hand.raised',
  'happy-outline': 'face.smiling',
  heart: 'heart.fill',
  'heart-outline': 'heart',
  'help-circle-outline': 'questionmark.circle',
  home: 'house.fill',
  'hourglass-outline': 'hourglass',
  'images-outline': 'photo.on.rectangle',
  'information-circle-outline': 'info.circle',
  'leaf-outline': 'leaf',
  'list-outline': 'list.bullet',
  locate: 'location.circle',
  location: 'mappin.circle.fill',
  'location-outline': 'mappin.and.ellipse',
  'log-out-outline': 'rectangle.portrait.and.arrow.right',
  'mail-outline': 'envelope',
  map: 'map.fill',
  'map-outline': 'map',
  'megaphone-outline': 'megaphone',
  navigate: 'location.fill',
  newspaper: 'newspaper.fill',
  'newspaper-outline': 'newspaper',
  notifications: 'bell.fill',
  'notifications-off-outline': 'bell.slash',
  'notifications-outline': 'bell',
  people: 'person.2.fill',
  'person-circle': 'person.crop.circle.fill',
  'person-circle-outline': 'person.crop.circle',
  'refresh-outline': 'arrow.clockwise',
  'remove-circle-outline': 'minus.circle',
  search: 'magnifyingglass',
  'search-circle': 'magnifyingglass.circle.fill',
  'search-circle-outline': 'magnifyingglass.circle',
  'search-outline': 'magnifyingglass',
  send: 'paperplane.fill',
  'share-outline': 'square.and.arrow.up',
  'shield-checkmark': 'checkmark.shield.fill',
  'stats-chart-outline': 'chart.bar',
  'thumbs-up': 'hand.thumbsup.fill',
  'thumbs-up-outline': 'hand.thumbsup',
  'time-outline': 'clock',
  'trash-outline': 'trash',
  warning: 'exclamationmark.triangle.fill',
  'swap-horizontal': 'arrow.left.arrow.right',
  'ellipsis-horizontal': 'ellipsis',
  sunny: 'sun.max.fill',
  moon: 'moon.fill',
  'phone-portrait-outline': 'iphone',
  'color-palette-outline': 'paintpalette',
  language: 'globe',
  pencil: 'pencil',
  mail: 'envelope.fill',
  'document-text': 'doc.text.fill',
  'help-circle': 'questionmark.circle.fill',
  'color-palette': 'paintpalette.fill',
  'calendar-outline': 'calendar',
  'arrow-up-circle': 'arrow.up.circle.fill',
  trash: 'trash.fill',
  key: 'key.fill',
  wallet: 'creditcard.fill',
  'phone-portrait': 'iphone',
  card: 'person.text.rectangle.fill',
  paw: 'pawprint.fill',
  shirt: 'tshirt.fill',
  cube: 'shippingbox.fill',
};

export interface IconProps {
  name: IoniconName;
  size?: number;
  color: string;
  /** SF Symbol weight on iOS. */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
}

/** Decorative by default: give the surrounding control the accessibility label. */
export function Icon({ name, size = 22, color, weight = 'regular' }: IconProps) {
  const fallback = <Ionicons name={name} size={size} color={color} />;
  const sf = SF[name];
  if (Platform.OS !== 'ios' || !sf) return fallback;
  return <SymbolView name={sf} size={size} tintColor={color} weight={weight} fallback={fallback} />;
}

/** Exposed for tests: every mapped Ionicon must exist in the Ionicons font. */
export const SF_SYMBOL_MAP = SF;
