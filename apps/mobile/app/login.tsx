import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        setLoading(true);
        try {
            // Step 1: Request OTP
            await api.post('/auth/login', { email, password });
            setShowOtp(true);
            Alert.alert('OTP Sent', 'Check your email for the code.');
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setLoading(true);
        try {
            // Step 2: Verify OTP
            const response = await api.post('/auth/otp/verify', { email, otp });
            const { accessToken } = response.data;
            signIn(accessToken);
        } catch (error: any) {
            Alert.alert('Verification Failed', 'Invalid OTP code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white p-6 justify-center">
            <View className="items-center mb-10">
                <Text className="text-3xl font-bold text-blue-600">NearNow</Text>
                <Text className="text-gray-500 mt-2">Local insights, right now.</Text>
            </View>

            {!showOtp ? (
                <>
                    <Text className="text-xl font-semibold mb-6">Welcome Back</Text>
                    <TextInput
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
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
                        onPress={handleLogin}
                        disabled={loading}
                        className="w-full bg-blue-600 p-4 rounded-lg items-center"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Send OTP Code</Text>
                        )}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <TouchableOpacity onPress={() => setShowOtp(false)} className="mb-6 flex-row items-center">
                        <Ionicons name="arrow-back" size={24} color="black" />
                        <Text className="ml-2 text-gray-600">Back to Login</Text>
                    </TouchableOpacity>

                    <Text className="text-xl font-semibold mb-2">Enter OTP</Text>
                    <Text className="text-gray-500 mb-6">We sent a code to {email}</Text>

                    <TextInput
                        placeholder="123456"
                        value={otp}
                        onChangeText={setOtp}
                        keyboardType="number-pad"
                        className="w-full bg-gray-100 p-4 rounded-lg mb-6 border border-gray-200 text-center text-2xl tracking-widest"
                    />
                    <TouchableOpacity
                        onPress={handleVerifyOtp}
                        disabled={loading}
                        className="w-full bg-blue-600 p-4 rounded-lg items-center"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Verify & Login</Text>
                        )}
                    </TouchableOpacity>
                </>
            )}

            <TouchableOpacity onPress={() => router.push('/signup' as any)} className="mt-8 items-center">
                <Text className="text-gray-600">
                    Don't have an account? <Text className="text-blue-600 font-bold">Sign Up</Text>
                </Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}
