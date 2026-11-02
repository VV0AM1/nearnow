import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { buildMapHtml } from '@/lib/map-html';
import { parseMapMessage, toMapScript, type FromMap, type ToMap } from '@/lib/map-bridge';
import { useColors } from './ui';

export interface LeafletMapHandle {
  send: (msg: ToMap) => void;
}

interface Props {
  initial: { lat: number; lng: number; zoom: number };
  onMessage: (msg: FromMap) => void;
  pinMode?: boolean;
  accessibilityLabel: string;
}

/**
 * Encapsulates the WebView bridge. The HTML is generated once per theme so state
 * changes never reload the map; updates are sent as validated messages.
 */
export const LeafletMap = forwardRef<LeafletMapHandle, Props>(function LeafletMap({ initial, onMessage, pinMode = false, accessibilityLabel }, ref) {
  const c = useColors();
  const web = useRef<WebView>(null);
  const ready = useRef(false);
  const queue = useRef<ToMap[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Intentionally only depends on theme: the initial view is applied once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const html = useMemo(() => buildMapHtml({ dark: c.dark, lat: initial.lat, lng: initial.lng, zoom: initial.zoom, pinMode }), [c.dark, pinMode]);

  const send = useCallback((msg: ToMap) => {
    if (!ready.current) {
      // Keep only the latest message of each type until the page is ready.
      queue.current = [...queue.current.filter((m) => m.type !== msg.type), msg];
      return;
    }
    web.current?.injectJavaScript(toMapScript(msg));
  }, []);

  useImperativeHandle(ref, () => ({ send }), [send]);

  const handle = (e: WebViewMessageEvent) => {
    const msg = parseMapMessage(e.nativeEvent.data);
    if (!msg) return;
    if (msg.type === 'READY') {
      ready.current = true;
      setLoaded(true);
      for (const m of queue.current) web.current?.injectJavaScript(toMapScript(m));
      queue.current = [];
    }
    onMessage(msg);
  };

  return (
    <View style={{ flex: 1 }} accessibilityLabel={accessibilityLabel}>
      <WebView
        key={c.dark ? 'dark' : 'light'}
        ref={web}
        originWhitelist={['*']}
        source={{ html }}
        onMessage={handle}
        onLoadStart={() => {
          ready.current = false;
          setLoaded(false);
        }}
        javaScriptEnabled
        domStorageEnabled={false}
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        // Links inside the page (e.g. attribution) must not navigate the WebView away.
        onShouldStartLoadWithRequest={(req) => req.url === 'about:blank' || req.url.startsWith('data:')}
        style={{ flex: 1, backgroundColor: c.bg }}
      />
      {!loaded ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }]}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : null}
    </View>
  );
});
