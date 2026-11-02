import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Camera, GeoJSONSource, Layer, Map, Marker, type CameraRef, type ViewStateChangeEvent } from '@maplibre/maplibre-react-native';
import { View, type NativeSyntheticEvent } from 'react-native';
import { config } from '@/lib/config';
import { circleRing, haversineKm } from '@/lib/geo';
import { clusterMarkers } from '@/lib/cluster';
import { useI18n } from '@/lib/i18n';
import type { MapMarker } from '@/lib/map-bridge';
import { useTokens } from '@/design';
import { ClusterPin, MarkerPin } from './MarkerPin';
import type { NearMapHandle, NearMapProps } from './types';

/** MapLibre Native with OpenFreeMap vector tiles (free, no API key). Android development/release builds. */
export const MapLibreMap = forwardRef<NearMapHandle, NearMapProps>(function MapLibreMap({ initial, onMessage, pinMode = false, accessibilityLabel }, ref) {
  const { t } = useI18n();
  const tokens = useTokens();
  const camera = useRef<CameraRef>(null);
  // The first region change is the initial render, not a user gesture.
  const programmatic = useRef(true);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [area, setArea] = useState<{ lat: number; lng: number; radiusKm: number } | null>(null);
  const [zoom, setZoom] = useState(initial.zoom);
  const clusters = useMemo(() => clusterMarkers(markers, zoom), [markers, zoom]);
  const [initialViewState] = useState(() => ({ center: [initial.lng, initial.lat] as [number, number], zoom: initial.zoom }));

  useImperativeHandle(
    ref,
    () => ({
      send: (msg) => {
        if (msg.type === 'SET_MARKERS') setMarkers(pinMode ? [] : msg.markers);
        else if (msg.type === 'SET_AREA') setArea({ lat: msg.lat, lng: msg.lng, radiusKm: msg.radiusKm });
        else if (msg.type === 'SET_VIEW') {
          programmatic.current = true;
          camera.current?.easeTo({ center: [msg.lng, msg.lat], zoom: msg.zoom, duration: tokens.reduceMotion ? 0 : 350 });
        }
      },
    }),
    [pinMode, tokens.reduceMotion],
  );

  const areaShape = useMemo<GeoJSON.Feature | null>(
    () => (area && !pinMode ? { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [circleRing(area.lat, area.lng, area.radiusKm)] } } : null),
    [area, pinMode],
  );

  const onRegionDidChange = (e: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { center, bounds, userInteraction, zoom: z } = e.nativeEvent;
    setZoom(z);
    const [lng, lat] = center;
    const [, , east, north] = bounds;
    onMessage({ type: 'MOVE_END', lat, lng, radiusKm: Math.max(haversineKm(lat, lng, north, east), 0.001), byUser: userInteraction && !programmatic.current });
    programmatic.current = false;
  };

  return (
    <Map
      style={{ flex: 1 }}
      accessibilityLabel={accessibilityLabel}
      mapStyle={tokens.dark ? config.mapStyleDark : config.mapStyleLight}
      attribution
      logo={false}
      compass={false}
      touchPitch={false}
      touchRotate={false}
      onDidFinishLoadingMap={() => onMessage({ type: 'READY' })}
      onDidFailLoadingMap={() => onMessage({ type: 'TILE_ERROR' })}
      onRegionDidChange={onRegionDidChange}
    >
      <Camera ref={camera} initialViewState={initialViewState} />
      {areaShape ? (
        <GeoJSONSource id="nn-area" data={areaShape}>
          <Layer id="nn-area-fill" type="fill" style={{ fillColor: tokens.colors.accent, fillOpacity: 0.08 }} />
          <Layer id="nn-area-line" type="line" style={{ lineColor: tokens.colors.accent, lineWidth: 1.5 }} />
        </GeoJSONSource>
      ) : null}
      {clusters.map((c) =>
        c.kind === 'single' ? (
          <Marker key={c.item.id} id={c.item.id} lngLat={[c.item.lng, c.item.lat]} onPress={() => onMessage({ type: 'MARKER_PRESS', id: c.item.id })}>
            <View accessible accessibilityRole="button" accessibilityLabel={c.item.label}>
              <MarkerPin color={c.item.color} shape={c.item.shape} dim={c.item.dim} />
            </View>
          </Marker>
        ) : (
          <Marker
            key={c.key}
            id={c.key}
            lngLat={[c.lng, c.lat]}
            onPress={() => {
              programmatic.current = true;
              camera.current?.easeTo({ center: [c.lng, c.lat], zoom: Math.min(18, zoom + 2), duration: tokens.reduceMotion ? 0 : 350 });
            }}
          >
            <View accessible accessibilityRole="button" accessibilityLabel={t('map.cluster', { count: c.items.length })}>
              <ClusterPin count={c.items.length} color={tokens.colors.accent} textColor={tokens.colors.onAccent} />
            </View>
          </Marker>
        ),
      )}
    </Map>
  );
});
