/**
 * Session Storage Backup & Restore
 * Backs up Supabase auth tokens to localStorage so we can recover from session loss on refresh.
 * If loading stalls, we restore the backed-up session and redirect user to dashboard.
 */

const SESSION_BACKUP_KEY = "open_to_work_session_backup";

interface SessionBackup {
  session: any;
  timestamp: number;
  expiresAt?: number;
}

/**
 * Save the current session to localStorage as a backup
 * Call this after successful login to preserve tokens
 */
export function backupCurrentSession() {
  try {
    const backup: SessionBackup = {
      session: null,
      timestamp: Date.now(),
    };

    // Try to get the session from Supabase auth (it's stored in localStorage)
    const authKey = "open_to_work_auth"; // matches Supabase persistSession key
    const authData = localStorage.getItem(authKey);

    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        backup.session = parsed;
        if (parsed.expires_at) {
          backup.expiresAt = parsed.expires_at * 1000; // convert to ms
        }
      } catch (e) {
        console.warn("Failed to parse auth data:", e);
        return false;
      }
    }

    localStorage.setItem(SESSION_BACKUP_KEY, JSON.stringify(backup));
    console.log("[SessionBackup] Session backed up at", new Date(backup.timestamp).toISOString());
    return true;
  } catch (e) {
    console.error("[SessionBackup] Error backing up session:", e);
    return false;
  }
}

/**
 * Restore a previously backed-up session to localStorage
 * Returns true if restore was successful, false otherwise
 */
export function restoreSessionFromBackup(): boolean {
  try {
    const backupData = localStorage.getItem(SESSION_BACKUP_KEY);
    if (!backupData) {
      console.warn("[SessionRestore] No backup found");
      return false;
    }

    const backup: SessionBackup = JSON.parse(backupData);

    // Check if backup has expired
    if (backup.expiresAt && backup.expiresAt < Date.now()) {
      console.warn("[SessionRestore] Backup session has expired");
      return false;
    }

    // If we have a valid session, restore it to Supabase auth storage
    if (backup.session) {
      const authKey = "open_to_work_auth";
      localStorage.setItem(authKey, JSON.stringify(backup.session));
      console.log("[SessionRestore] Session restored from backup");
      return true;
    }

    return false;
  } catch (e) {
    console.error("[SessionRestore] Error restoring session:", e);
    return false;
  }
}

/**
 * Clear the session backup (e.g., on logout)
 */
export function clearSessionBackup() {
  try {
    localStorage.removeItem(SESSION_BACKUP_KEY);
    console.log("[SessionBackup] Session backup cleared");
  } catch (e) {
    console.error("[SessionBackup] Error clearing backup:", e);
  }
}

/**
 * Get info about the current backup (for debugging)
 */
export function getSessionBackupInfo(): SessionBackup | null {
  try {
    const backupData = localStorage.getItem(SESSION_BACKUP_KEY);
    if (!backupData) return null;
    return JSON.parse(backupData);
  } catch (e) {
    console.error("[SessionBackup] Error reading backup info:", e);
    return null;
  }
}
