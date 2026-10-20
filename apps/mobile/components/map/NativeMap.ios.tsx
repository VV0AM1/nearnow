import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import type { MapMarker } from '@/lib/map-bridge';
import { regionRadiusKm, zoomToDeltas } from '@/lib/geo';
import { useTokens } from '@/design';
import { MarkerPin } from './MarkerPin';
import type { NearMapHandle, NearMapProps } from './types';

export type { NearMapHandle, NearMapProps } from './types';

/** Apple Maps (MapKit) via react-native-maps. Works in Expo Go and development builds. */
export const NativeMap = forwardRef<NearMapHandle, NearMapProps>(function AppleMap({ initial, onMessage, pinMode = false, accessibilityLabel }, ref) {
  const tokens = useTokens();
  const window = useWindowDimensions();
  const map = useRef<MapView>(null);
  const size = useRef({ width: window.width, height: window.height * 0.7 });
  const region = useRef<Region | null>(null);
  // The first region change is the initial render, not a user gesture.
  const programmatic = useRef(true);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [area, setArea] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);

  const [initialRegion] = useState<Region>(() => ({
    latitude: initial.lat,
    longitude: initial.lng,
    ...zoomToDeltas(initial.zoom, initial.lat, size.current.width, size.current.height),
  }));

  useImperativeHandle(
    ref,
    () => ({
      send: (msg) => {
        if (msg.type === 'SET_MARKERS') setMarkers(pinMode ? [] : msg.markers);
        else if (msg.type === 'SET_AREA') setArea({ lat: msg.lat, lng: msg.lng, radiusKm: msg.radiusKm });
        else if (msg.type === 'SET_VIEW') {
          const deltas =
            typeof msg.zoom === 'number'
              ? zoomToDeltas(msg.zoom, msg.lat, size.current.width, size.current.height)
              : { latitudeDelta: region.current?.latitudeDelta ?? initialRegion.latitudeDelta, longitudeDelta: region.current?.longitudeDelta ?? initialRegion.longitudeDelta };
          programmatic.current = true;
          map.current?.animateToRegion({ latitude: msg.lat, longitude: msg.lng, ...deltas }, tokens.reduceMotion ? 0 : 350);
        }
      },
    }),
    [pinMode, initialRegion, tokens.reduceMotion],
  );

  const onRegionChangeComplete = useCallback(
    (r: Region) => {
      region.current = r;
      onMessage({ type: 'MOVE_END', lat: r.latitude, lng: r.longitude, radiusKm: regionRadiusKm(r), byUser: !programmatic.current });
      programmatic.current = false;
    },
    [onMessage],
  );

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) => {
        size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
      }}
    >
      <MapView
        ref={map}
        style={{ flex: 1 }}
        accessibilityLabel={accessibilityLabel}
        initialRegion={initialRegion}
        userInterfaceStyle={tokens.dark ? 'dark' : 'light'}
        showsUserLocation={false}
        showsPointsOfInterest
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        onMapReady={() => onMessage({ type: 'READY' })}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {area && !pinMode ? (
          <Circle center={{ latitude: area.lat, longitude: area.lng }} radius={area.radiusKm * 1000} strokeColor={tokens.colors.accent} strokeWidth={1.5} fillColor={tokens.colors.accentSoft} />
        ) : null}
        {markers.map((m) => (
          <Marker
            key={m.id}
            identifier={m.id}
            coordinate={{ latitude: m.lat, longitude: m.lng }}
            tracksViewChanges={false}
            accessibilityLabel={m.label}
            onPress={() => onMessage({ type: 'MARKER_PRESS', id: m.id })}
          >
            <MarkerPin color={m.color} shape={m.shape} dim={m.dim} />
          </Marker>
        ))}
      </MapView>
    </View>
  );
});
