import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/signup', { name, email, password });
            Alert.alert('Success', 'Account created! Please login.');
            router.back();
        } catch (error: any) {
            Alert.alert('Signup Failed', error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6 justify-center">
            <TouchableOpacity onPress={() => router.back()} className="mb-6 flex-row items-center absolute top-12 left-6 z-10">
                <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>

            <View className="items-center mb-10 mt-10">
                <Text className="text-3xl font-bold text-blue-600">Create Account</Text>
                <Text className="text-gray-500 mt-2">Join your neighborhood today.</Text>
            </View>

            <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                className="w-full bg-gray-100 p-4 rounded-lg mb-4 border border-gray-200"
            />
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                className="w-full bg-gray-100 p-4 rounded-lg mb-4 border border-gray-200"
            />
            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="w-full bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200"
            />

            <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                className="w-full bg-blue-600 p-4 rounded-lg items-center"
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-white font-bold text-lg">Sign Up</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} className="mt-8 items-center">
                <Text className="text-gray-600">
                    Already have an account? <Text className="text-blue-600 font-bold">Login</Text>
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
