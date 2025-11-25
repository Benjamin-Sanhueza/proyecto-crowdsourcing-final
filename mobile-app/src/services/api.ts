import axios, { AxiosHeaders } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const USE_LAN = false;           
const LAN_IP  = '192.168.1.91';  

const HOST = USE_LAN
  ? LAN_IP
  : (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

const baseURL = `http://${HOST}:4000/api`;
console.log('[API] baseURL =', baseURL);

const api = axios.create({ baseURL });

api.interceptors.request.use(
  async (config) => {
    try {
      const raw = await SecureStore.getItemAsync('token');
      if (raw) {
        const clean = raw.replace(/^"+|"+$/g, '');
        if (!config.headers) config.headers = new AxiosHeaders();

        if (config.headers instanceof AxiosHeaders) {
          config.headers.set('Authorization', `Bearer ${clean}`);
          config.headers.set('Accept', 'application/json');
        } else {
          (config.headers as Record<string, string>)['Authorization'] = `Bearer ${clean}`;
          (config.headers as Record<string, string>)['Accept'] = 'application/json';
        }
      }
    } catch (e) {
      console.warn('No token in SecureStore:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (r) => r,
  (error) => {
    console.log('AXIOS ERR message:', error?.message);
    console.log('code:', error?.code);
    console.log('status:', error?.response?.status);
    try {
      console.log('data:', JSON.stringify(error?.response?.data));
    } catch { console.log('data:', error?.response?.data); }
    return Promise.reject(error);
  }
);

export default api;
