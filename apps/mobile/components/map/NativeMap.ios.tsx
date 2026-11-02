import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import MapView, { Circle, Marker, type Region } from 'react-native-maps';
import type { MapMarker } from '@/lib/map-bridge';
import { regionRadiusKm, zoomToDeltas } from '@/lib/geo';
import { clusterMarkers, zoomForSpan } from '@/lib/cluster';
import { useI18n } from '@/lib/i18n';
import { useTokens } from '@/design';
import { ClusterPin, MarkerPin } from './MarkerPin';
import type { NearMapHandle, NearMapProps } from './types';

export type { NearMapHandle, NearMapProps } from './types';

/** Apple Maps (MapKit) via react-native-maps. Works in Expo Go and development builds. */
export const NativeMap = forwardRef<NearMapHandle, NearMapProps>(function AppleMap({ initial, onMessage, pinMode = false, accessibilityLabel }, ref) {
  const { t } = useI18n();
  const tokens = useTokens();
  const window = useWindowDimensions();
  const map = useRef<MapView>(null);
  const size = useRef({ width: window.width, height: window.height * 0.7 });
  const region = useRef<Region | null>(null);
  // The first region change is the initial render, not a user gesture.
  const programmatic = useRef(true);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [area, setArea] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  const [zoom, setZoom] = useState(initial.zoom);
  const clusters = useMemo(() => clusterMarkers(markers, zoom), [markers, zoom]);

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
      setZoom(zoomForSpan(r.longitudeDelta, size.current.width));
      onMessage({ type: 'MOVE_END', lat: r.latitude, lng: r.longitude, radiusKm: regionRadiusKm(r), byUser: !programmatic.current });
      programmatic.current = false;
    },
    [onMessage],
  );

  const zoomInto = (lat: number, lng: number) => {
    programmatic.current = true;
    map.current?.animateToRegion({ latitude: lat, longitude: lng, ...zoomToDeltas(Math.min(18, zoom + 2), lat, size.current.width, size.current.height) }, tokens.reduceMotion ? 0 : 350);
  };

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
        {clusters.map((c) =>
          c.kind === 'single' ? (
            <Marker
              key={c.item.id}
              identifier={c.item.id}
              coordinate={{ latitude: c.item.lat, longitude: c.item.lng }}
              tracksViewChanges={false}
              accessibilityLabel={c.item.label}
              onPress={() => onMessage({ type: 'MARKER_PRESS', id: c.item.id })}
            >
              <MarkerPin color={c.item.color} shape={c.item.shape} dim={c.item.dim} />
            </Marker>
          ) : (
            <Marker
              key={c.key}
              coordinate={{ latitude: c.lat, longitude: c.lng }}
              tracksViewChanges={false}
              accessibilityLabel={t('map.cluster', { count: c.items.length })}
              onPress={() => zoomInto(c.lat, c.lng)}
            >
              <ClusterPin count={c.items.length} color={tokens.colors.accent} textColor={tokens.colors.onAccent} />
            </Marker>
          ),
        )}
      </MapView>
    </View>
  );
});
