
import React, { useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import * as Location from 'expo-location';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';

// Exact colors from Web
const CATEGORY_COLORS: Record<string, string> = {
    DANGER: '#dc2626', // red-600
    CRIME: '#ef4444', // red-500
    SAFETY: '#22c55e', // green-500
    LOST_FOUND: '#eab308', // yellow-500
    EVENT: '#a855f7', // purple-500
    RECOMMENDATION: '#ec4899', // pink-500
    GENERAL: '#3b82f6', // blue-500
    ALL: '#64748b', // slate-500
};

const CATEGORIES = [
    { id: 'ALL', label: 'All' },
    { id: 'DANGER', label: 'SOS' },
    { id: 'SAFETY', label: 'Safety' },
    { id: 'CRIME', label: 'Crime' },
    { id: 'LOST_FOUND', label: 'Lost' },
    { id: 'EVENT', label: 'Events' },
    { id: 'GENERAL', label: 'General' },
];

const TIME_RANGES = [
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
    { label: 'All', value: 'all' },
];

export default function MapScreen() {
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [timeRange, setTimeRange] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Params from FeedPost "See Location"
    const params = useLocalSearchParams<{ latitude?: string, longitude?: string, highlightPostId?: string }>();

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                // Default to NYC if denied
                setLocation({ coords: { latitude: 40.7128, longitude: -74.0060 } } as any);
                return;
            }

            // If params exist, use them
            if (params.latitude && params.longitude) {
                setLocation({
                    coords: {
                        latitude: parseFloat(params.latitude),
                        longitude: parseFloat(params.longitude),
                        altitude: null,
                        accuracy: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null
                    },
                    timestamp: Date.now()
                });
            } else {
                try {
                    // Try getting current position
                    let loc = await Location.getCurrentPositionAsync({});
                    setLocation(loc);
                } catch (error) {
                    console.log("Error getting current position:", error);
                    // Fallback to last known position
                    try {
                        let lastKnown = await Location.getLastKnownPositionAsync({});
                        if (lastKnown) {
                            setLocation(lastKnown);
                        } else {
                            throw new Error("No last known location");
                        }
                    } catch (fallbackError) {
                        console.log("Fallback location failed:", fallbackError);
                        // Default to New York City
                        setLocation({
                            coords: {
                                latitude: 40.7128,
                                longitude: -74.0060,
                                altitude: 0,
                                accuracy: 0,
                                altitudeAccuracy: 0,
                                heading: 0,
                                speed: 0
                            },
                            timestamp: Date.now()
                        } as any);
                    }
                }
            }
        })();
        fetchPosts();
    }, [params.latitude, params.longitude]);

    const fetchPosts = async () => {
        try {
            const response = await api.get('/posts');
            setPosts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error(error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = useMemo(() => {
        const now = new Date().getTime();

        return posts.filter(p => {
            // Category Filter
            if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

            // Time Filter
            if (timeRange !== 'all' && p.createdAt) {
                const postDate = new Date(p.createdAt).getTime();
                const hoursDiff = (now - postDate) / (1000 * 60 * 60);
                if (timeRange === '24h' && hoursDiff > 24) return false;
                if (timeRange === '7d' && hoursDiff > 24 * 7) return false;
            }
            return true;
        });
    }, [posts, selectedCategory, timeRange]);

    const generateMapHtml = () => {
        const lat = location?.coords.latitude || 40.7128;
        const lon = location?.coords.longitude || -74.0060;
        const postsJson = JSON.stringify(filteredPosts);

        // Standard OSM Tiles (Most reliable)
        const tileLayerUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
        const bgColor = isDark ? '#1a1a1a' : '#f9fafb';

        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
          <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
          
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
          <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
          
          <style>
            html, body { height: 100%; width: 100%; margin: 0; padding: 0; background-color: ${bgColor}; }
            #map { height: 100%; width: 100%; }
            
            #debug-log {
                position: absolute; top: 40px; left: 10px; right: 10px; z-index: 9999;
                background: rgba(0,0,0,0.6); color: #00ff00; font-family: monospace; font-size: 10px;
                padding: 5px; pointer-events: none; border-radius: 4px;
            }

            /* Animations */
            @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
            .pulse-marker .ping {
                position: absolute; top:0; left:0; width: 100%; height: 100%; 
                border-radius: 50%; background-color: rgba(220, 38, 38, 0.5); 
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            }
            .pulse-marker .dot {
                position: absolute; top:5px; left:5px; width: 10px; height: 10px; 
                background-color: #dc2626; border-radius: 50%; 
                box-shadow: 0 0 10px #dc2626;
            }

            /* Glass Popup */
            .leaflet-popup-content-wrapper {
                background: ${isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
                backdrop-filter: blur(10px);
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                color: ${isDark ? '#fff' : '#000'};
                padding: 0;
            }
            .leaflet-popup-tip {
                background: ${isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
            }
            .leaflet-popup-content { margin: 0 !important; width: auto !important; }
            
            /* Cluster Icons */
            .custom-cluster-icon div {
                display: flex; align-items: center; justify-content: center;
                width: 40px; height: 40px; border-radius: 50%;
                color: white; font-weight: bold; font-size: 12px;
                border: 2px solid rgba(255,255,255,0.2);
                background-color: ${isDark ? 'rgba(50,50,50,0.8)' : 'rgba(16, 185, 129, 0.8)'};
                backdrop-filter: blur(4px);
            }
          </style>
        </head>
        <body>
          <div id="debug-log">Log: Initializing...</div>
          <div id="map"></div>
          <script>
            function log(msg) {
                var el = document.getElementById('debug-log');
                if(el) el.innerHTML = msg;
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'LOG', payload: msg}));
            }

            // Global Error Handler
            window.onerror = function(msg, url, line) {
                log('Global Error: ' + msg);
            };

            function initMap() {
                try {
                    if (typeof L === 'undefined') {
                        log('Waiting for Leaflet...');
                        setTimeout(initMap, 500); // Retry in 500ms
                        return;
                    }
                    
                    log('Leaflet ready. Starting Map...');
                    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lon}], 14);
                    
                    L.tileLayer('${tileLayerUrl}', {
                        attribution: '&copy; OpenStreetMap',
                        maxZoom: 19
                    }).addTo(map);
                    
                    function getColor(cat) {
                        const colors = ${JSON.stringify(CATEGORY_COLORS)};
                        return colors[cat] || colors['ALL'];
                    }

                    function createIcon(category) {
                        var color = getColor(category);
                        if (category === 'DANGER') {
                            return L.divIcon({
                                className: "pulse-marker",
                                html: '<div style="position: relative; width: 20px; height: 20px;">' +
                                        '<div class="ping"></div><div class="dot"></div></div>',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10],
                                popupAnchor: [0, -10]
                            });
                        }
                        return L.divIcon({
                            className: "custom-marker",
                            html: '<div style="background-color: ' + color + '; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(255,255,255,0.2), 0 0 10px ' + color + ';"></div>',
                            iconSize: [12, 12],
                            iconAnchor: [6, 6],
                            popupAnchor: [0, -10]
                        });
                    }

                    var markers = L.markerClusterGroup({
                        showCoverageOnHover: false,
                        maxClusterRadius: 60,
                        iconCreateFunction: function(cluster) {
                            var count = cluster.getChildCount();
                            return L.divIcon({
                                html: '<div>' + count + '</div>',
                                className: 'custom-cluster-icon',
                                iconSize: L.point(40, 40)
                            });
                        }
                    });

                    var posts = ${postsJson};
                    if (Array.isArray(posts)) {
                        posts.forEach(function(p) {
                            if (p.latitude && p.longitude) {
                                var marker = L.marker([p.latitude, p.longitude], {
                                    icon: createIcon(p.category)
                                });
                                var titleColor = '${isDark ? '#e5e7eb' : '#1f2937'}';
                                var popupContent = '<div style="padding: 12px; min-width: 180px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">' +
                                    '<div style="font-weight: 700; font-size: 15px; margin-bottom: 4px; color: ' + titleColor + ';">' + p.title + '</div>' +
                                    '<div style="margin-bottom: 8px;"><span style="background-color: ' + getColor(p.category) + '30; color: ' + getColor(p.category) + '; font-size: 10px; padding: 2px 8px; border-radius: 999px; font-weight: 700; text-transform: uppercase;">' +
                                        p.category +
                                    '</span></div>' +
                                    '<button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: \'NAVIGATE\', payload: \'' + p.id + '\'}))" style="background-color: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; width: 100%;">View Details</button>' +
                                    '</div>';
                                
                                marker.bindPopup(popupContent);
                                markers.addLayer(marker);
                            }
                        });
                    }
                    map.addLayer(markers);

                    L.circle([${lat}, ${lon}], {
                        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, radius: 100, weight: 1
                    }).addTo(map);
                    
                    log('Map Loaded Successfully');
                    setTimeout(function() { 
                        var el = document.getElementById('debug-log'); 
                        if(el) el.style.display = 'none'; 
                    }, 2000);

                } catch (e) {
                    log('CRASH: ' + e.message);
                }
            }
            
            // Start immediately
            initMap();
          </script>
        </body>
      </html>
    `;
    };

    if (!location && loading) {
        // ...
    }

    const router = useRouter();

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'NAVIGATE') {
                router.push({
                    pathname: '/(app)/post/[id]',
                    params: { id: data.payload }
                } as any);
            } else if (data.type === 'LOG') {
                console.log("WebView Log:", data.payload);
            } else if (data.type === 'ERROR') {
                console.error("WebView JS Error:", data.payload);
            }
        } catch (error) {
            console.log("Map Message Error", error);
        }
    };

    return (
        <View className="flex-1 relative bg-black">
            <WebView
                key={location ? "located" : "loading"}
                originWhitelist={['*']}
                source={{ html: generateMapHtml(), baseUrl: '' }}
                style={{ flex: 1, backgroundColor: isDark ? '#000' : '#fff' }}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderError={(e) => (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-red-500">WebView Error: {e}</Text>
                    </View>
                )}
            />

            {/* Top Bar: Categories */}
            <View className="absolute top-12 left-0 right-0 z-50">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            className={`px - 4 py - 2 rounded - full border shadow - sm backdrop - blur - md ${selectedCategory === cat.id
                                ? 'bg-blue-600 border-blue-500' // Active
                                : 'bg-black/60 border-white/20' // Web Inactive Style (Dark Glass)
                                } `}
                        >
                            <Text className={`font - bold text - xs ${selectedCategory === cat.id ? 'text-white' : 'text-gray-300'
                                } `}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Bottom/Side Controls: Theme & Time */}
            <View className="absolute top-28 right-4 gap-4 items-end z-50">


                {/* Filter Toggle */}
                <TouchableOpacity
                    onPress={() => setShowFilters(!showFilters)}
                    className={`w - 10 h - 10 rounded - full border border - white / 20 items - center justify - center backdrop - blur - md shadow - lg transition - all ${showFilters ? 'bg-blue-600 border-blue-500' : 'bg-black/60'
                        } `}
                >
                    <Ionicons name="filter" size={20} color="white" />
                </TouchableOpacity>

                {/* Expanded Time Filter */}
                {showFilters && (
                    <View className="bg-black/80 border border-white/10 rounded-xl p-3 gap-2 backdrop-blur-md w-32 shadow-xl">
                        <Text className="text-gray-400 text-[10px] font-bold uppercase mb-1">Time Range</Text>
                        {TIME_RANGES.map((r) => (
                            <TouchableOpacity
                                key={r.value}
                                onPress={() => setTimeRange(r.value)}
                                className={`py - 2 px - 3 rounded - lg ${timeRange === r.value ? 'bg-blue-600' : 'hover:bg-white/10'
                                    } `}
                            >
                                <Text className={`text - xs font - bold text - center ${timeRange === r.value ? 'text-white' : 'text-gray-300'
                                    } `}>
                                    {r.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}
