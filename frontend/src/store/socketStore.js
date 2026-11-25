import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const SOCKET_URL = API_URL.replace(/\/api\/v1\/?$/, '');

export const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,

  connect: (token) => {
    const existing = get().socket;
    if (existing) {
      existing.disconnect();
    }
    if (!token) {
      set({ socket: null, isConnected: false });
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
    });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    set({ socket });
  },

  disconnect: () => {
    const existing = get().socket;
    if (existing) {
      existing.disconnect();
    }
    set({ socket: null, isConnected: false });
  },
}));
