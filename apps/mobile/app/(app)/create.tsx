import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { LEAFLET_ASSETS } from './map-assets';
import api from '@/services/api';
import { useToast } from '@/context/ToastContext';
import { GlassView } from '@/components/GlassView';

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
    const { showToast } = useToast();
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
            return () => {
                setStep(1);
                setTitle('');
                setContent('');
                setImage(null);
                setCategory(CATEGORIES[6].id);
            };
        }, [])
    );

    // Initial Location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLocation({ lat: 40.7128, lng: -74.0060 });
                setLoadingLocation(false);
                return;
            }
            try {
                let loc = await Location.getCurrentPositionAsync({});
                setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            } catch (e) {
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
        const bgColor = isDark ? '#020817' : '#f9fafb';
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
                    L.tileLayer('${tileUrl}', { attribution: 'CartoDB', maxZoom: 19 }).addTo(map);
                    window.addEventListener('message', function(event) {
                        try {
                            var data = JSON.parse(event.data);
                            if (data.type === 'GET_CENTER') {
                                var center = map.getCenter();
                                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CENTER_RESULT', payload: { lat: center.lat, lng: center.lng } }));
                            }
                        } catch (e) {}
                    });
                </script>
            </body>
            </html>
        `;
    };

    const handleConfirmLocation = () => {
        webViewRef.current?.injectJavaScript(`window.postMessage(JSON.stringify({ type: 'GET_CENTER' }));`);
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
        if (!result.canceled) setImage(result.assets[0]);
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
            showToast('Camera permission needed', 'error');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });
        if (!result.canceled) setImage(result.assets[0]);
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            showToast("Add a title and description", "warning");
            return;
        }
        if (!location) return;

        setSubmitting(true);
        try {
            // Reverse Geocode
            let addressDetails = { neighborhood: '', city: '', country: '' };
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&accept-language=en`,
                    { headers: { 'User-Agent': 'NearNowApp/1.0' } }
                );
                const data = await response.json();
                if (data && data.address) {
                    const addr = data.address;
                    const hood = addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || addr.district;
                    const city = addr.city || addr.town || addr.municipality || 'Unknown';
                    const country = addr.country || 'Unknown';
                    addressDetails = { neighborhood: (hood || city || 'Unknown').trim(), city: city.trim(), country: country.trim() };
                }
            } catch (e) { console.log("Geocoding failed", e); }

            const payload = {
                title, content, category,
                latitude: location.lat, longitude: location.lng,
                neighborhood: addressDetails.neighborhood,
                city: addressDetails.city,
                country: addressDetails.country
            };

            await api.post('/posts', payload);
            showToast("Alert posted successfully!", "success");
            router.replace('/(app)/home');

        } catch (error) {
            console.error(error);
            showToast("Failed to post alert", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingLocation && !location) {
        return (
            <View className="flex-1 bg-[#020817] justify-center items-center">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (step === 1) {
        return (
            <View className="flex-1 bg-[#020817] relative">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-4 z-50 w-10 h-10 bg-black/60 rounded-full items-center justify-center border border-white/10"
                >
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>

                <WebView
                    ref={webViewRef}
                    source={{ html: generateMapHtml(), baseUrl: '' }}
                    style={{ flex: 1 }}
                    onMessage={handleWebViewMessage}
                />

                <View className="absolute inset-0 items-center justify-center pointer-events-none" style={{ marginTop: -35 }}>
                    <Ionicons name="location" size={48} color="#ef4444" />
                    <View className="w-4 h-4 bg-black/20 rounded-full blur-sm mt-[-5px]" />
                </View>

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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#f9fafb] dark:bg-[#020817]">
            <View className="flex-1">
                {/* Header */}
                <View className="flex-row items-center p-4 pt-14 border-b border-gray-200 dark:border-white/10">
                    <TouchableOpacity onPress={() => setStep(1)} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color={isDark ? "white" : "black"} />
                    </TouchableOpacity>
                    <Text className="text-gray-900 dark:text-white text-xl font-bold">Create Alert</Text>
                </View>

                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>

                    {/* Category Selector */}
                    <Text className="text-gray-500 dark:text-gray-400 font-bold mb-3 uppercase text-xs tracking-wider">Category</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6 -mx-4 px-4 pb-2">
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setCategory(cat.id)}
                                className={`mr-3 px-4 py-3 rounded-xl border flex-row items-center gap-2 ${category === cat.id
                                    ? `bg-[${cat.color}]/20 border-transparent` // Tailwind might struggle with dynamic values, simplify in style
                                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'
                                    }`}
                                style={category === cat.id ? { backgroundColor: cat.color + (isDark ? '40' : '20'), borderColor: cat.color, borderWidth: 1 } : {}}
                            >
                                <Ionicons
                                    name={cat.icon as any}
                                    size={18}
                                    color={category === cat.id ? (isDark ? '#fff' : cat.color) : (isDark ? '#9ca3af' : '#6b7280')}
                                />
                                <Text className={`font-bold ${category === cat.id ? (isDark ? 'text-white' : 'text-gray-900') : 'text-gray-500 dark:text-gray-400'}`}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Inputs */}
                    <GlassView style={{ borderRadius: 16, marginBottom: 24, padding: 4 }}>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder="What's happening?"
                            placeholderTextColor="#9ca3af"
                            className="text-gray-900 dark:text-white p-4 font-bold text-lg border-b border-gray-100 dark:border-white/5"
                        />
                        <TextInput
                            value={content}
                            onChangeText={setContent}
                            placeholder="Add more details... (Time, Suspect description, etc.)"
                            placeholderTextColor="#9ca3af"
                            multiline
                            textAlignVertical="top"
                            className="text-gray-900 dark:text-white p-4 h-32 text-base leading-6"
                        />
                    </GlassView>

                    {/* Image Picker */}
                    <Text className="text-gray-500 dark:text-gray-400 font-bold mb-2 uppercase text-xs tracking-wider">Photo (Optional)</Text>

                    {image ? (
                        <View className="mb-8 relative">
                            <Image source={{ uri: image.uri }} className="w-full h-48 rounded-xl bg-gray-100 dark:bg-white/5" resizeMode="cover" />
                            <TouchableOpacity
                                onPress={() => setImage(null)}
                                className="absolute top-2 right-2 bg-black/60 p-2 rounded-full border border-white/20 shadow-sm"
                            >
                                <Ionicons name="close" size={20} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="flex-row gap-3 mb-8">
                            <TouchableOpacity
                                onPress={takePhoto}
                                className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 border-dashed rounded-xl h-24 items-center justify-center active:bg-gray-100 dark:active:bg-white/10"
                            >
                                <Ionicons name="camera" size={28} color="#6b7280" />
                                <Text className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-xs">Camera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={pickImage}
                                className="flex-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 border-dashed rounded-xl h-24 items-center justify-center active:bg-gray-100 dark:active:bg-white/10"
                            >
                                <Ionicons name="images" size={28} color="#6b7280" />
                                <Text className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-xs">Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                </ScrollView>

                {/* Footer */}
                <View className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#020817] safe-area-bottom">
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        className={`py-4 rounded-xl items-center shadow-lg ${submitting ? 'bg-blue-800' : 'bg-blue-600 active:bg-blue-700'}`}
                    >
                        {submitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg tracking-wide">Post Alert</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
