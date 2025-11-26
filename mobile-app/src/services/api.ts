import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * CONFIGURACIÓN DE ENTORNO
 * ------------------------------------------------------------------
 * Define la URL base para todas las peticiones HTTP de la aplicación.
 * Actualmente apunta al entorno de producción desplegado en Render.
 */
const BASE_URL_PRODUCTION = 'https://proyecto-crowdsourcing-final.onrender.com/api';

console.log('[API Service] Inicializando cliente HTTP con baseURL:', BASE_URL_PRODUCTION);

// Creación de la instancia de Axios con la configuración base
const api = axios.create({
  baseURL: BASE_URL_PRODUCTION,
  timeout: 10000, // Tiempo de espera máximo de 10s para evitar bloqueos
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * INTERCEPTOR DE SOLICITUD (REQUEST)
 * ------------------------------------------------------------------
 * Se ejecuta antes de que cualquier petición sea enviada al servidor.
 * Su función principal es recuperar el token JWT del almacenamiento seguro
 * (SecureStore) e inyectarlo en el encabezado Authorization.
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Recuperar token almacenado de forma segura en el dispositivo
      const rawToken = await SecureStore.getItemAsync('token');

      if (rawToken) {
        // Limpieza del token (eliminar comillas extra si existen por serialización)
        const cleanToken = rawToken.replace(/^"+|"+$/g, '');

        // Asegurar que exista el objeto headers
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }

        // Inyección del Token Bearer
        if (config.headers instanceof AxiosHeaders) {
          config.headers.set('Authorization', `Bearer ${cleanToken}`);
        } else {
          (config.headers as Record<string, string>)['Authorization'] = `Bearer ${cleanToken}`;
        }
      }
    } catch (error) {
      console.warn('[API Service] Error al recuperar el token de SecureStore:', error);
      // No bloqueamos la petición, permitimos que continúe (el backend rechazará si es necesario)
    }
    return config;
  },
  (error) => {
    // Manejo de errores previos al envío de la solicitud
    return Promise.reject(error);
  }
);

/**
 * INTERCEPTOR DE RESPUESTA (RESPONSE)
 * ------------------------------------------------------------------
 * Se ejecuta cuando el servidor responde. Permite centralizar el manejo
 * de errores (logging) y procesar respuestas globales.
 */
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa (2xx), se retorna directamente
    return response;
  },
  (error) => {
    // Logging estructurado para depuración en consola
    console.group('[API Service] Error en Petición');
    console.log('Mensaje:', error?.message);
    console.log('Código:', error?.code);
    console.log('Status HTTP:', error?.response?.status);
    
    try {
      // Intentar parsear el cuerpo del error si está disponible
      console.log('Detalle del servidor:', JSON.stringify(error?.response?.data, null, 2));
    } catch {
      console.log('Detalle del servidor (raw):', error?.response?.data);
    }
    console.groupEnd();

    return Promise.reject(error);
  }
);

export default api;