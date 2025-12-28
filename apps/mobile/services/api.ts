import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_URL = 'https://51.21.193.118.nip.io/api'; // AWS URL
// const API_URL = 'https://stupid-cooks-stand.loca.lt'; // Local Debug

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

export default api;
