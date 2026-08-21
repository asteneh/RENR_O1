import { io } from "socket.io-client";

import { CONFIG } from '../config';

// Socket URL usually is the base URL without /api/`
const SOCKET_URL = CONFIG.BASE_URL.replace('/api/', '');

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket'] // Often required for React Native
});
