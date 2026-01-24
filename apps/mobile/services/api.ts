import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Production (Render)
export const API_URL = "https://nearnow.onrender.com";

// Local Development (Uncomment to use)
// export const API_URL = Platform.OS === 'ios' 
//   ? "http://localhost:3000/api" 
//   : "http://10.0.2.2:3000/api"; // AWS URL

const api = axios.create({
    baseURL: API_URL,
    timeout: 60000, // 60s timeout for cold starts
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        console.log(`[API Error] ${error.message} | URL: ${originalRequest?.url} | Status: ${error.response?.status}`);

        // Don't redirect if we are already doing auth
        if (
            originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register') ||
            originalRequest?.url?.includes('/auth/signup') ||
            originalRequest?.url?.includes('/auth/otp/verify')
        ) {
            return Promise.reject(error);
        }

        if (error.response && error.response.status === 401) {
            console.log('Session expired, logging out...');
            await SecureStore.deleteItemAsync('token');
            const { router } = require('expo-router');
            if (router) {
                // Check if we are already on login to avoid loop
                // Actually just replace is safe
                router.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
