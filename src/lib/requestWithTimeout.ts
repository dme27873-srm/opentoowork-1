export async function withTimeout<T>(promise: Promise<T>, ms = 7000): Promise<T> {
  let timeoutId: any;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
  });

  try {
    return await Promise.race([promise, timeout]) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
