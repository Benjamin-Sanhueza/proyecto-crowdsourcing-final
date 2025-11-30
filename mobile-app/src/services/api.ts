import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * CONFIGURACIÓN DE ENTORNO
 */
const BASE_URL_PRODUCTION = 'https://proyecto-crowdsourcing-final.onrender.com/api';

console.log('[API Service] Inicializando cliente HTTP con baseURL:', BASE_URL_PRODUCTION);

// Creación de la instancia de Axios
const api = axios.create({
  baseURL: BASE_URL_PRODUCTION,
  timeout: 10000, 
  // Ahora Axios detectará automáticamente si envías JSON o Fotos.
});

/**
 * INTERCEPTOR DE SOLICITUD (REQUEST)
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const rawToken = await SecureStore.getItemAsync('token');

      if (rawToken) {
        const cleanToken = rawToken.replace(/^"+|"+$/g, '');

        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }

        if (config.headers instanceof AxiosHeaders) {
          config.headers.set('Authorization', `Bearer ${cleanToken}`);
        } else {
          (config.headers as Record<string, string>)['Authorization'] = `Bearer ${cleanToken}`;
        }
      }
    } catch (error) {
      console.warn('[API Service] Error al recuperar token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * INTERCEPTOR DE RESPUESTA (RESPONSE)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.group('[API Service] Error en Petición');
    console.log('Mensaje:', error?.message);
    console.log('Status HTTP:', error?.response?.status);
    console.groupEnd();
    return Promise.reject(error);
  }
);

export default api;