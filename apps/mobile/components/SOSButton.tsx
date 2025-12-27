import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import api from '@/services/api';
import { useRouter } from 'expo-router';

export function SOSButton() {
    const [isCountingDown, setIsCountingDown] = useState(false);
    const [count, setCount] = useState(3);
    const [sending, setSending] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(1));
    const router = useRouter();

    // Reset countdown when closed
    useEffect(() => {
        if (!isCountingDown) {
            setCount(3);
            setSending(false);
        }
    }, [isCountingDown]);

    useEffect(() => {
        let timer: any;
        if (isCountingDown && count > 0) {
            timer = setTimeout(() => {
                setCount((c) => c - 1);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 1000);
        } else if (isCountingDown && count === 0) {
            handleSOS();
        }
        return () => clearTimeout(timer);
    }, [isCountingDown, count]);

    // Animation for the button
    useEffect(() => {
        if (isCountingDown) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scaleAnim.setValue(1);
        }
    }, [isCountingDown]);

    const handleTrigger = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setIsCountingDown(true);
    };

    const handleSOS = async () => {
        setSending(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                setIsCountingDown(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            await api.post('/posts', {
                title: "SOS Signal",
                content: "EMERGENCY: I need immediate assistance at this location.",
                category: "DANGER",
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            alert('SOS SENT! Help is on the way.');
        } catch (error) {
            console.error(error);
            alert('Failed to send SOS. Please call emergency services directly.');
        } finally {
            setIsCountingDown(false);
        }
    };

    return (
        <>
            <TouchableOpacity
                onPress={handleTrigger}
                className="bg-red-100 p-2 rounded-full border border-red-200"
            >
                <Ionicons name="warning" size={24} color="#dc2626" />
            </TouchableOpacity>

            <Modal visible={isCountingDown} transparent animationType="fade">
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <Text style={styles.title}>SENDING SOS</Text>

                        <Animated.View style={[styles.circle, { transform: [{ scale: scaleAnim }] }]}>
                            <Text style={styles.count}>{count}</Text>
                        </Animated.View>

                        <Text style={styles.subtitle}>Broadcasting emergency alert...</Text>

                        <TouchableOpacity
                            onPress={() => setIsCountingDown(false)}
                            style={styles.cancelButton}
                        >
                            <Ionicons name="close" size={24} color="white" />
                            <Text style={styles.cancelText}>CANCEL</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        color: '#ef4444',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 40,
    },
    circle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#dc2626',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOpacity: 0.8,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 0 },
        elevation: 20,
        marginBottom: 40,
    },
    count: {
        color: 'white',
        fontSize: 80,
        fontWeight: 'bold',
    },
    subtitle: {
        color: '#a1a1aa',
        fontSize: 18,
        marginBottom: 40,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 50,
    },
    cancelText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 10,
    },
});
