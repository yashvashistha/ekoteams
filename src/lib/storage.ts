// // src/lib/storage.ts
// export const Storage = {
//   set<T>(key: string, value: T, ttlMinutes: number) {
//     const now = Date.now();
//     const item = {
//       value,
//       expiry: now + ttlMinutes * 60 * 1000,
//     };
//     localStorage.setItem(key, JSON.stringify(item));
//   },

//   get<T>(key: string): T | null {
//     const itemStr = localStorage.getItem(key);
//     if (!itemStr) return null;

//     try {
//       const item = JSON.parse(itemStr);
//       if (Date.now() > item.expiry) {
//         localStorage.removeItem(key); // expired
//         return null;
//       }
//       return item.value as T;
//     } catch {
//       return null;
//     }
//   },

//   remove(key: string) {
//     localStorage.removeItem(key);
//   },
// };

// src/lib/storage.ts
export const Storage = {
  set<T>(key: string, value: T, ttlMinutes: number) {
    const now = Date.now();
    const item = {
      value,
      expiry: now + ttlMinutes * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  get<T>(key: string): T | null {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;

    try {
      const item = JSON.parse(itemStr);
      if (Date.now() > item.expiry) {
        localStorage.removeItem(key); // expired
        return null;
      }
      return item.value as T;
    } catch {
      return null;
    }
  },

  remove(key: string) {
    localStorage.removeItem(key);
  },

  /**
   * Deletes an item explicitly, even if not expired
   * Example: Storage.deleteBeforeExpiry("refresh_token")
   */
  deleteBeforeExpiry(key: string) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return;

    try {
      const item = JSON.parse(itemStr);
      if (Date.now() < item.expiry) {
        localStorage.removeItem(key);
        console.log(`${key} deleted before expiry`);
      }
    } catch {
      localStorage.removeItem(key); // fallback cleanup
    }
  },
};
