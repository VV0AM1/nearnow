import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Constants from 'expo-constants';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextProps {
    showToast: (message: string, type?: ToastType) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');

    // Animation Config
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const showToast = useCallback((msg: string, t: ToastType = 'info') => {
        setMessage(msg);
        setType(t);
        setVisible(true);

        // Animate In
        Animated.parallel([
            Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();

        // Auto Hide
        setTimeout(() => {
            hideToast();
        }, 4000);
    }, []);

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setVisible(false));
    }, []);

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'warning';
            default: return 'information-circle';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#22c55e';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#3b82f6';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {visible && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        {
                            transform: [{ translateY }],
                            opacity
                        }
                    ]}
                >
                    <View style={[styles.card, { borderLeftColor: getColor() }]}>
                        <Ionicons name={getIcon() as any} size={24} color={getColor()} style={{ marginRight: 12 }} />
                        <Text style={styles.text}>{message}</Text>
                        <TouchableOpacity onPress={hideToast}>
                            <Ionicons name="close" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: Constants.statusBarHeight + 10,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center',
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b', // Dark Slate
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        borderLeftWidth: 4,
        width: '100%',
        maxWidth: 400,
    },
    text: {
        color: 'white',
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    }
});
