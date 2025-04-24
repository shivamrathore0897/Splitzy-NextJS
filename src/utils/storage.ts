// utils/storage.ts
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

export const storage = {
  async set(key: string, value: any) {
    const stringValue = JSON.stringify(value);
    if (isNative) {
      await Preferences.set({ key, value: stringValue });
    } else {
      localStorage.setItem(key, stringValue);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    if (isNative) {
      const { value } = await Preferences.get({ key });
      return value ? JSON.parse(value) : null;
    } else {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  },

  async remove(key: string) {
    if (isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  },
};
