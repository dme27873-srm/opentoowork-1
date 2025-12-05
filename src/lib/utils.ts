import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Wrap a promise with a timeout - rejects if the original promise doesn't settle in time
export function withTimeout<T>(promise: PromiseLike<T>, ms = 8000): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Request timed out after ${ms} ms`));
    }, ms);
  });

  return Promise.race([promise, timeout]);
}
