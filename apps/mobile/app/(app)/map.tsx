
import { useRef, useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import * as Location from 'expo-location';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LEAFLET_ASSETS } from './map-assets';

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
    const [showLayersPanel, setShowLayersPanel] = useState(false);
    const [layers, setLayers] = useState({ safety: false, heatmap: false, traffic: false });

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

        // Dark Mode CSS Filter for OSM Tiles
        const tileFilter = isDark
            ? 'filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);'
            : '';

        const bgColor = isDark ? '#1a1a1a' : '#f9fafb';

        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            ${LEAFLET_ASSETS.css}
            ${LEAFLET_ASSETS.clusterCss}
            ${LEAFLET_ASSETS.clusterDefaultCss}
            
            html, body { height: 100%; width: 100%; margin: 0; padding: 0; background-color: ${bgColor}; }
            #map { height: 100%; width: 100%; background-color: ${bgColor}; }
            
            /* Zoom Controls - Move to bottom right or hide */
            .leaflet-control-zoom { display: none; }

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
                background: ${isDark ? 'rgba(20, 20, 20, 0.85)' : 'rgba(255, 255, 255, 0.9)'};
                backdrop-filter: blur(12px);
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.4);
                color: ${isDark ? '#fff' : '#000'};
                padding: 0;
                border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
            }
            .leaflet-popup-tip {
                background: ${isDark ? 'rgba(20, 20, 20, 0.85)' : 'rgba(255, 255, 255, 0.9)'};
            }
            .leaflet-popup-content { margin: 0 !important; width: auto !important; }
            
            /* Cluster Icons */
            .custom-cluster-icon div {
                display: flex; align-items: center; justify-content: center;
                width: 44px; height: 44px; border-radius: 50%;
                color: white; font-weight: 800; font-size: 14px;
                border: 3px solid rgba(255,255,255,0.3);
                background-color: ${isDark ? '#3b82f6' : '#3b82f6'};
                box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
            }
          </style>
          
          <script>
             ${LEAFLET_ASSETS.js}
             ${LEAFLET_ASSETS.clusterJs}
          </script>

        </head>
        <body>
          <div id="map"></div>
          <script>
            function handleNavigate(id) {
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'NAVIGATE', payload: id}));
            }

            function initMap() {
                try {
                    if (typeof L === 'undefined') {
                        setTimeout(initMap, 50); 
                        return;
                    }
                    
                    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lon}], 14);
                    
                    // Web Design: Use CARTO Dark Matter for Dark Mode
                    var tileUrl = '${isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}';
                    
                    L.tileLayer(tileUrl, {
                        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
                        maxZoom: 19,
                        subdomains: 'abcd'
                    }).addTo(map);
                    
                    function getColor(cat) {
                        // Matching Web Colors
                        if (cat.includes('DANGER')) return '#ef4444'; // red-500
                        if (cat.includes('CRIME')) return '#ef4444'; // red-500
                        if (cat.includes('SAFETY')) return '#22c55e'; // green-500
                        if (cat.includes('LOST')) return '#eab308'; // yellow-500
                        if (cat.includes('EVENT')) return '#a855f7'; // purple-500
                        if (cat.includes('RECOMMENDATION')) return '#ec4899'; // pink-500
                        return '#3b82f6'; // blue-500 fallback
                    }

                    function createIcon(category) {
                        var color = getColor(category);
                        if (category === 'DANGER') {
                            return L.divIcon({
                                className: "pulse-marker",
                                html: '<div style="position: relative; width: 20px; height: 20px;">' +
                                        '<div style="position: absolute; top:0; left:0; width: 100%; height: 100%; border-radius: 50%; background-color: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' +
                                        '<div style="position: absolute; top:5px; left:5px; width: 10px; height: 10px; background-color: #ef4444; border-radius: 50%; box-shadow: 0 0 10px #ef4444;"></div>' +
                                      '</div>',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10],
                                popupAnchor: [0, -10]
                            });
                        }
                        
                        // Web Design: Standard Dot
                        return L.divIcon({
                            className: "custom-marker",
                            html: '<div style="background-color: ' + color + '; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(0,0,0,0.3), 0 0 10px ' + color + ';"></div>',
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
                            
                            // Web Design: Cluster Color Logic
                            var bgColor = 'rgba(16, 185, 129, 0.2)'; // emerald-500/20
                            var borderColor = 'rgba(16, 185, 129, 0.5)';
                            
                            if (count > 5) { // yellow
                                bgColor = 'rgba(234, 179, 8, 0.2)';
                                borderColor = 'rgba(234, 179, 8, 0.5)';
                            }
                            if (count > 20) { // red
                                bgColor = 'rgba(220, 38, 38, 0.2)';
                                borderColor = 'rgba(220, 38, 38, 0.5)';
                            }

                            return L.divIcon({
                                html: '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 50%; background-color: ' + bgColor + '; border: 1px solid ' + borderColor + '; backdrop-filter: blur(4px); box-shadow: 0 0 15px rgba(0,0,0,0.3);">' +
                                        '<span style="font-size: 12px; font-weight: bold; color: white;">' + count + '</span>' +
                                      '</div>',
                                className: 'custom-cluster-icon',
                                iconSize: L.point(40, 40)
                            });
                        }
                    });

                    var posts = ${postsJson};
                    var showSafety = ${layers.safety};
                    var showHeatmap = ${layers.heatmap};

                    if (Array.isArray(posts)) {
                        posts.forEach(function(p) {
                            if (p.latitude && p.longitude) {
                                
                                // SAFETY LAYER LOGIC
                                if (showSafety && p.category === 'SAFETY') {
                                    L.circle([p.latitude, p.longitude], {
                                        color: '#22c55e',
                                        fillColor: '#22c55e',
                                        fillOpacity: 0.15,
                                        radius: 300,
                                        weight: 1
                                    }).addTo(map);
                                }

                                // HEATMAP LOGIC (Simulated)
                                if (showHeatmap && (p.category === 'DANGER' || p.category === 'CRIME')) {
                                    L.circle([p.latitude, p.longitude], {
                                        color: '#ef4444',
                                        fillColor: '#ef4444',
                                        fillOpacity: 0.2, // increased opacity for heatmap feel
                                        radius: 150,
                                        weight: 0
                                    }).addTo(map);
                                }

                                var marker = L.marker([p.latitude, p.longitude], {
                                    icon: createIcon(p.category)
                                });
                                var titleColor = '${isDark ? '#e5e7eb' : '#1f2937'}';
                                
                                var popupContent = '<div style="padding: 16px; min-width: 200px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">' +
                                    '<div style="font-weight: 800; font-size: 16px; margin-bottom: 6px; color: ' + titleColor + '; line-height: 1.3;">' + p.title + '</div>' +
                                    '<div style="margin-bottom: 12px; display: flex; align-items: center;"><span style="background-color: ' + getColor(p.category) + '20; color: ' + getColor(p.category) + '; font-size: 11px; padding: 4px 10px; border-radius: 999px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">' +
                                        p.category +
                                    '</span></div>' +
                                    '<button onclick="handleNavigate(\\\'' + p.id + '\\\')" style="background-color: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; width: 100%; transition: opacity 0.2s;">View Details</button>' +
                                    '</div>';
                                
                                marker.bindPopup(popupContent);
                                markers.addLayer(marker);
                            }
                        });
                    }
                    map.addLayer(markers);

                    L.circle([${lat}, ${lon}], {
                        color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, radius: 120, weight: 0
                    }).addTo(map);
                    
                    var currentLocationMarker = L.circleMarker([${lat}, ${lon}], {
                         radius: 8, fillColor: '#3b82f6', color: '#fff', weight: 3, fillOpacity: 1
                    }).addTo(map);

                    // Web Feature: "You are here" Popup
                    var youAreHereContent = '<div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 700; font-size: 13px; padding: 4px 8px; color: ${isDark ? '#fff' : '#000'};">You are here</div>';
                    
                    currentLocationMarker.bindPopup(youAreHereContent, { 
                        closeButton: false, 
                        offset: [0, -4], 
                        className: 'you-are-here-popup' // We can add custom CSS if needed
                    });

                } catch (e) {
                   // silent crash is okay now
                }
            }
            
            initMap();
          </script>
        </body>
      </html>
    `;
    };

    if (!location && loading) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="text-gray-400 mt-4 font-medium">Locating...</Text>
            </View>
        );
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
            }
        } catch (error) {
            // ignore
        }
    };

    return (
        <View className="flex-1 relative bg-black">
            <WebView
                key={location ? "located" : "loading"}
                originWhitelist={['*']}
                source={{ html: generateMapHtml(), baseUrl: '' }}
                style={{ flex: 1, backgroundColor: isDark ? '#1a1a1a' : '#f9fafb' }}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View className="absolute inset-0 bg-black justify-center items-center">
                        <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                )}
            />

            {/* Top Bar: Categories */}
            <View className="absolute top-14 left-0 right-0 z-50">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                >
                    {CATEGORIES.map((cat) => {
                        const isActive = selectedCategory === cat.id;
                        const activeColor = CATEGORY_COLORS[cat.id] || '#3b82f6';

                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2.5 rounded-full backdrop-blur-xl shadow-sm border transition-all flex-row items-center gap-2`}
                                style={{
                                    backgroundColor: isActive ? activeColor : (isDark ? 'rgba(30,30,30,0.75)' : 'rgba(255,255,255,0.85)'),
                                    borderColor: isActive ? activeColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'),
                                }}
                            >
                                {/* Dot indicator for inactive state */}
                                {!isActive && cat.id !== 'ALL' && (
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: CATEGORY_COLORS[cat.id] }} />
                                )}

                                <Text className={`font-bold text-xs ${isActive ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>

            {/* Layers Panel (Top Right - Independent, Slide Left of button) */}
            {showLayersPanel && (
                <View className="absolute top-28 right-16 z-[60] bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 w-48 shadow-2xl mr-2">
                    <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-3">Map Layers</Text>

                    {/* Safety Toggle */}
                    <TouchableOpacity
                        onPress={() => setLayers(prev => ({ ...prev, safety: !prev.safety }))}
                        className="flex-row items-center justify-between mb-4"
                    >
                        <Text className="text-gray-200 font-bold text-xs">Safety Zones</Text>
                        <View className={`w-8 h-5 rounded-full ${layers.safety ? 'bg-emerald-500' : 'bg-gray-700'} items-center flex-row px-0.5`}>
                            <View className={`w-4 h-4 rounded-full bg-white shadow-sm ${layers.safety ? 'ml-auto' : ''}`} />
                        </View>
                    </TouchableOpacity>

                    {/* Heatmap Toggle */}
                    <TouchableOpacity
                        onPress={() => setLayers(prev => ({ ...prev, heatmap: !prev.heatmap }))}
                        className="flex-row items-center justify-between mb-4"
                    >
                        <Text className="text-gray-200 font-bold text-xs">Heatmap (Beta)</Text>
                        <View className={`w-8 h-5 rounded-full ${layers.heatmap ? 'bg-orange-500' : 'bg-gray-700'} items-center flex-row px-0.5`}>
                            <View className={`w-4 h-4 rounded-full bg-white shadow-sm ${layers.heatmap ? 'ml-auto' : ''}`} />
                        </View>
                    </TouchableOpacity>

                    {/* Traffic (Disabled) */}
                    <View className="flex-row items-center justify-between opacity-50">
                        <Text className="text-gray-400 font-bold text-xs">Traffic</Text>
                        <View className="w-8 h-5 rounded-full bg-gray-800 items-center flex-row px-0.5">
                            <View className="w-4 h-4 rounded-full bg-gray-600 shadow-sm" />
                        </View>
                    </View>
                </View>
            )}

            {/* Top Right: Layers Toggle Button */}
            <View className="absolute top-28 right-4 z-50">
                <TouchableOpacity
                    onPress={() => { setShowLayersPanel(!showLayersPanel); setShowFilters(false); }}
                    className={`w-10 h-10 rounded-full items-center justify-center backdrop-blur-xl shadow-lg border ${showLayersPanel ? 'bg-white border-white' : (isDark ? 'bg-gray-800/90 border-white/10' : 'bg-white/90 border-gray-200')
                        }`}
                >
                    <Ionicons name="layers" size={20} color={showLayersPanel ? '#000' : (isDark ? '#fff' : '#000')} />
                </TouchableOpacity>
            </View>

            {/* Bottom Left: Current Location */}
            <View className="absolute bottom-8 left-4 z-50">
                <TouchableOpacity
                    onPress={() => {
                        if (location?.coords) {
                            (async () => {
                                const loc = await Location.getCurrentPositionAsync({});
                                setLocation(loc);
                            })();
                        }
                    }}
                    className={`w-12 h-12 rounded-full items-center justify-center backdrop-blur-xl shadow-xl border ${isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-500 border-blue-400'
                        }`}
                >
                    <Ionicons name="navigate" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Bottom Right: Filter & Time Range */}
            <View className="absolute bottom-8 right-4 items-end z-50">

                {/* Expanded Time Filter */}
                {showFilters && (
                    <View className="bg-black/80 border border-white/10 rounded-2xl p-4 gap-3 backdrop-blur-xl w-36 shadow-2xl mb-3">
                        <Text className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Time Range</Text>
                        {TIME_RANGES.map((r) => (
                            <TouchableOpacity
                                key={r.value}
                                onPress={() => { setTimeRange(r.value); setShowFilters(false); }}
                                className={`py-2.5 px-3 rounded-xl flex-row items-center justify-between ${timeRange === r.value ? 'bg-white/10' : 'active:bg-white/5'
                                    } `}
                            >
                                <Text className={`text-xs font-bold ${timeRange === r.value ? 'text-white' : 'text-gray-400'
                                    } `}>
                                    {r.label}
                                </Text>
                                {timeRange === r.value && <Ionicons name="checkmark" size={14} color="white" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Filter Toggle Button */}
                <TouchableOpacity
                    onPress={() => { setShowFilters(!showFilters); setShowLayersPanel(false); }}
                    className={`w-12 h-12 rounded-full items-center justify-center backdrop-blur-xl shadow-xl border ${showFilters ? 'bg-white text-black' : (isDark ? 'bg-gray-800/90 border-white/10' : 'bg-white/90 border-gray-200')
                        }`}
                >
                    <Ionicons name="filter" size={22} color={showFilters ? '#000' : (isDark ? '#fff' : '#000')} />
                </TouchableOpacity>

            </View>
        </View>
    );
}
