import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { LEAFLET_ASSETS } from './map-assets'; // Reusing map assets
import api from '@/services/api';
import { useCallback } from 'react';

const CATEGORIES = [
    { id: 'DANGER', label: 'SOS / Danger', color: '#ef4444', icon: 'alert-circle' },
    { id: 'CRIME', label: 'Crime', color: '#dc2626', icon: 'skull' },
    { id: 'SAFETY', label: 'Safety Check', color: '#22c55e', icon: 'shield-checkmark' },
    { id: 'LOST_FOUND', label: 'Lost & Found', color: '#eab308', icon: 'search' },
    { id: 'EVENT', label: 'Event', color: '#a855f7', icon: 'calendar' },
    { id: 'RECOMMENDATION', label: 'Recommendation', color: '#ec4899', icon: 'heart' },
    { id: 'GENERAL', label: 'General', color: '#3b82f6', icon: 'chatbubble' },
];

export default function CreateScreen() {
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);

    // State
    const [step, setStep] = useState<1 | 2>(1); // 1 = Location, 2 = Details
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form Data
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState(CATEGORIES[6].id); // Default General
    const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    // Reset State on Focus
    useFocusEffect(
        useCallback(() => {
            // Reset logic
            return () => {
                setStep(1);
                setTitle('');
                setContent('');
                setImage(null);
                setCategory(CATEGORIES[6].id);
                // Don't reset location to null to avoid re-fetching GPS delay if possible, but stepping back to 1 is key.
            };
        }, [])
    );

    // Initial Location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                // Default NYC
                setLocation({ lat: 40.7128, lng: -74.0060 });
                setLoadingLocation(false);
                return;
            }
            try {
                let loc = await Location.getCurrentPositionAsync({});
                setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            } catch (e) {
                // Fallback
                setLocation({ lat: 40.7128, lng: -74.0060 });
            } finally {
                setLoadingLocation(false);
            }
        })();
    }, []);

    // --- MAP LOGIC (Step 1) ---
    const generateMapHtml = () => {
        const lat = location?.lat || 40.7128;
        const lng = location?.lng || -74.0060;
        const bgColor = isDark ? '#1a1a1a' : '#f9fafb';

        // Carto Tiles
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <style>
                    ${LEAFLET_ASSETS.css}
                    body, html, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: ${bgColor}; }
                    .leaflet-control-zoom { display: none; }
                </style>
                <script>${LEAFLET_ASSETS.js}</script>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 16);
                    L.tileLayer('${tileUrl}', {
                        attribution: 'CartoDB',
                        maxZoom: 19
                    }).addTo(map);

                    // Report center on request
                    window.addEventListener('message', function(event) {
                        try {
                            var data = JSON.parse(event.data);
                            if (data.type === 'GET_CENTER') {
                                var center = map.getCenter();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                                    type: 'CENTER_RESULT', 
                                    payload: { lat: center.lat, lng: center.lng } 
                                }));
                            }
                        } catch (e) {}
                    });
                </script>
            </body>
            </html>
        `;
    };

    const handleConfirmLocation = () => {
        // Ask WebView for center
        webViewRef.current?.injectJavaScript(`
            window.postMessage(JSON.stringify({ type: 'GET_CENTER' }));
        `);
    };

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'CENTER_RESULT') {
                setLocation(data.payload);
                setStep(2);
            }
        } catch (e) { }
    };

    // --- FORM LOGIC (Step 2) ---
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
            Alert.alert('Permission needed', 'Camera access is required to take photos.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert("Missing Fields", "Please add a title and description.");
            return;
        }
        if (!location) return;

        setSubmitting(true);
        try {
            // 1. Reverse Geocode (OSM Nominatim for better Neighborhood precision)
            let addressDetails = {
                neighborhood: '',
                city: '',
                country: ''
            };

            try {
                // Force English to align with Web/Consolidated stats (Santa Eulalia instead of Localized name)
                const langCode = 'en';
                console.log(`[Geocoding] Using language: ${langCode}`);

                // Using Nominatim for detailed neighborhood data
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&accept-language=${langCode}`,
                    {
                        headers: {
                            'User-Agent': 'NearNowApp/1.0'
                        }
                    }
                );
                const data = await response.json();

                if (data && data.address) {
                    const addr = data.address;
                    console.log("OSM Address:", addr); // Debug log

                    // Priority: Neighbourhood -> Suburb -> Quarter -> City District
                    const hood = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || addr.district;
                    const city = addr.city || addr.town || addr.municipality || 'Unknown';
                    const country = addr.country || 'Unknown';

                    addressDetails = {
                        neighborhood: (hood || city || 'Unknown').trim(),
                        city: city.trim(),
                        country: country.trim()
                    };
                }
            } catch (e) {
                console.log("OSM Geocoding failed", e);
                // Fallback to Native if OSM fails/timeout (Optional, but keeping it simple for now)
            }

            const payload = {
                title,
                content,
                category,
                latitude: location.lat,
                longitude: location.lng,
                neighborhood: addressDetails.neighborhood,
                city: addressDetails.city,
                country: addressDetails.country
            };

            await api.post('/posts', payload);

            Alert.alert("Success", "Alert posted successfully!", [
                { text: "OK", onPress: () => router.replace('/(app)/home') }
            ]);

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to create post. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- RENDER ---

    if (loadingLocation && !location) {
        return (
            <View className="flex-1 bg-black justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (step === 1) {
        return (
            <View className="flex-1 bg-black relative">
                {/* Header */}
                <View className="absolute top-12 left-4 z-50">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-black/60 rounded-full items-center justify-center border border-white/10"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Map */}
                <WebView
                    ref={webViewRef}
                    source={{ html: generateMapHtml(), baseUrl: '' }}
                    style={{ flex: 1 }}
                    onMessage={handleWebViewMessage}
                />

                {/* Center Pin Overlay */}
                <View className="absolute inset-0 items-center justify-center pointer-events-none" style={{ marginTop: -35 }}>
                    <Ionicons name="location" size={48} color="#ef4444" />
                    <View className="w-4 h-4 bg-black/20 rounded-full blur-sm mt-[-5px]" />
                </View>

                {/* Instruction */}
                <View className="absolute top-12 self-center bg-black/70 px-4 py-2 rounded-full border border-white/10">
                    <Text className="text-white font-bold text-sm">Drag to position pin</Text>
                </View>

                {/* Confirm Button */}
                <View className="absolute bottom-12 left-4 right-4">
                    <TouchableOpacity
                        onPress={handleConfirmLocation}
                        className="bg-blue-600 py-4 rounded-xl items-center shadow-lg active:bg-blue-700"
                    >
                        <Text className="text-white font-bold text-lg">Confirm Location</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Step 2: Form
    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center p-4 pt-14 border-b border-white/10 bg-black">
                    <TouchableOpacity onPress={() => setStep(1)} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-bold">Create Alert</Text>
                </View>

                <ScrollView className="flex-1 p-4">

                    {/* Category Selector */}
                    <Text className="text-gray-400 font-bold mb-3 uppercase text-xs tracking-wider">Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4 px-4 pb-2">
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setCategory(cat.id)}
                                className={`mr-3 px-4 py-3 rounded-xl border flex-row items-center gap-2 ${category === cat.id
                                    ? `bg-[${cat.color}]/20 border-[${cat.color}]`
                                    : 'bg-white/5 border-white/10'
                                    }`}
                                style={category === cat.id ? { backgroundColor: cat.color + '30', borderColor: cat.color } : {}}
                            >
                                <Ionicons
                                    name={cat.icon as any}
                                    size={18}
                                    color={category === cat.id ? cat.color : '#9ca3af'}
                                />
                                <Text className={`font-bold ${category === cat.id ? 'text-white' : 'text-gray-400'}`}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Inputs */}
                    <Text className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">Title</Text>
                    <TextInput
                        value={title}
                        onChangeText={setTitle}
                        placeholder="What's happening?"
                        placeholderTextColor="#6b7280"
                        className="bg-white/5 text-white p-4 rounded-xl border border-white/10 mb-6 font-semibold text-lg"
                    />

                    <Text className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">Description</Text>
                    <TextInput
                        value={content}
                        onChangeText={setContent}
                        placeholder="Add more details..."
                        placeholderTextColor="#6b7280"
                        multiline
                        textAlignVertical="top"
                        className="bg-white/5 text-white p-4 rounded-xl border border-white/10 mb-6 h-32"
                    />

                    {/* Image Picker */}
                    <Text className="text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">Photo (Optional)</Text>

                    {image ? (
                        <View className="mb-8">
                            <Image source={{ uri: image.uri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
                            <TouchableOpacity
                                onPress={() => setImage(null)}
                                className="absolute top-2 right-2 bg-black/60 p-2 rounded-full"
                            >
                                <Ionicons name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="flex-row gap-4 mb-8">
                            <TouchableOpacity
                                onPress={takePhoto}
                                className="flex-1 bg-white/5 border border-white/10 border-dashed rounded-xl h-32 items-center justify-center active:bg-white/10"
                            >
                                <Ionicons name="camera" size={32} color="#4b5563" />
                                <Text className="text-gray-500 mt-2 font-bold">Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={pickImage}
                                className="flex-1 bg-white/5 border border-white/10 border-dashed rounded-xl h-32 items-center justify-center active:bg-white/10"
                            >
                                <Ionicons name="images" size={32} color="#4b5563" />
                                <Text className="text-gray-500 mt-2 font-bold">Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>

                {/* Footer */}
                <View className="p-4 border-t border-white/10 bg-black safe-area-bottom">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        className={`py-4 rounded-xl items-center shadow-lg ${submitting ? 'bg-blue-900' : 'bg-blue-600 active:bg-blue-700'}`}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Post Alert</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
