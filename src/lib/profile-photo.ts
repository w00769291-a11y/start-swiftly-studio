import { useSyncExternalStore } from "react";

const KEY = "sac-profile-photo";
const EVT = "sac-profile-photo-change";

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Current user's profile photo (data URL) or null. Null during SSR. */
export function useProfilePhoto() {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function saveProfilePhoto(dataUrl: string | null) {
  try {
    if (dataUrl) localStorage.setItem(KEY, dataUrl);
    else localStorage.removeItem(KEY);
  } catch {
    throw new Error("Could not save photo on this device");
  }
  window.dispatchEvent(new Event(EVT));
}

/** Center-crops an image file to a square and downsizes it to a compact JPEG data URL. */
export function cropImageFile(file: File, size = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unsupported"));
      ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}
