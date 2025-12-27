import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const PROD_API_URL = 'https://51.21.193.118.nip.io/api';

const api = axios.create({
    baseURL: PROD_API_URL,
});

api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
