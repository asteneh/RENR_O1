import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Push / local notification helpers for the mobile app.
 *
 * Wraps `expo-notifications` so the rest of the app can trigger OS-level
 * notifications (with sound) without worrying about platform quirks,
 * permission handling, or Android notification channels.
 *
 * Only depends on `expo-notifications` (already installed) so it works without
 * any additional native packages.
 */

// Android requires an explicit channel for notifications to play a sound and
// show as heads-up. This id is reused whenever we present a local notification.
export const ANDROID_CHANNEL_ID = 'default';

// Configure how notifications behave when received while the app is foregrounded.
// Without this, foreground notifications are silently swallowed by the OS.
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        // iOS 14+ granular presentation flags (safe to include on all platforms).
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Create the Android notification channel used for all local notifications.
 * Safe to call multiple times; it is a no-op on iOS/web.
 */
export async function ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
        await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            // 'default' => play the device's default notification sound on this channel.
            sound: 'default',
            vibrationPattern: [0, 250, 250, 250],
            enableVibrate: true,
            lightColor: '#FF8C00',
            // Show full content on the lock screen.
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        });
    } catch (e) {
        console.warn('Failed to create Android notification channel:', e);
    }
}


/**
 * Request notification permissions from the user if not already granted.
 * Returns true when notifications are allowed.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } catch (e) {
        console.warn('Failed to request notification permissions:', e);
        return false;
    }
}

/**
 * Full setup routine: ensure the Android channel exists and permissions are
 * granted. Call once on app start (or after login). Returns whether
 * notifications are permitted.
 */
export async function setupNotifications(): Promise<boolean> {
    await ensureAndroidChannel();
    return requestNotificationPermissions();
}

/**
 * Immediately present a local notification with sound. Used to surface
 * real-time socket events (new messages / notifications) at the OS level so
 * the user is alerted with a sound even when the app is backgrounded.
 */
export async function presentLocalNotification(
    title: string,
    body: string,
    data: Record<string, any> = {}
): Promise<void> {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: 'default',
            },
            // On Android, route through our high-importance channel so the sound
            // plays; `null` on iOS delivers immediately.
            trigger:
                Platform.OS === 'android'
                    ? ({ channelId: ANDROID_CHANNEL_ID } as any)
                    : null,
        });
    } catch (e) {
        console.warn('Failed to present local notification:', e);
    }
}

/**
 * Diagnostic helper: returns the current permission status so we can surface it
 * in the UI while verifying the notification pipeline on a real device.
 */
export async function getNotificationPermissionStatus(): Promise<string> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status;
    } catch (e) {
        return `error: ${String(e)}`;
    }
}

/**
 * Fire a test notification (after ensuring channel + permissions). Returns a
 * human-readable result string useful for debugging on-device.
 */
export async function sendTestNotification(): Promise<string> {
    const granted = await setupNotifications();
    if (!granted) {
        return 'Permission NOT granted. Enable notifications for this app in system settings.';
    }
    await presentLocalNotification('Test Notification 🔔', 'If you see and hear this, notifications work!', {
        type: 'test',
    });
    return 'Test notification sent. You should see & hear it now.';
}


