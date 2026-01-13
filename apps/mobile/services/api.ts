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
        if (error.response && error.response.status === 401) {
            console.log('Session expired, logging out...');
            await SecureStore.deleteItemAsync('token');
            // Use router from expo-router to redirect
            // We need to dynamic import or use the router object if available
            // Note: In plain TS files, we might need to rely on the global router
            const { router } = require('expo-router');
            if (router) {
                router.replace('/login');
            }
        }
        return Promise.reject(error);
    }
);

export default api;
