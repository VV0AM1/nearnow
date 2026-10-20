import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import api from './api';

export const COMPANION_LOCATION_TASK = 'background-location-task';

TaskManager.defineTask(COMPANION_LOCATION_TASK, async ({ data, error }: any) => {
    if (error) {
        console.error("Background Location Task Error:", error);
        return;
    }
    if (data) {
        const { locations } = data;
        if (locations && locations.length > 0) {
            const loc = locations[0]; // Get the most recent location
            const { latitude, longitude } = loc.coords;

            // Send to Backend
            try {
                // We use our existing axios instance which handles the token from SecureStore automatically
                // NOTE: In headless JS (Android), SecureStore might not be available immediately or context might differ.
                // But for standard background fetch on iOS/Android foreground-service, this usually works.
                console.log(`[Background] Updating location: ${latitude}, ${longitude}`);
                await api.put('/notifications/me/location', { latitude, longitude });
            } catch (e) {
                console.log("[Background] API update failed (likely network or auth)", e);
            }
        }
    }
});

// Helper to start the task
export async function startBackgroundLocation() {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
        const isStarted = await Location.hasStartedLocationUpdatesAsync(COMPANION_LOCATION_TASK);
        if (!isStarted) {
            await Location.startLocationUpdatesAsync(COMPANION_LOCATION_TASK, {
                accuracy: Location.Accuracy.Balanced, // Balanced power usage
                timeInterval: 1000 * 60 * 5, // Update every 5 minutes (Android mostly)
                distanceInterval: 500, // Update every 500 meters
                showsBackgroundLocationIndicator: true, // iOS requirement for "Always" transparency
                foregroundService: {
                    notificationTitle: "NearNow Safety",
                    notificationBody: "Tracking your location for safety alerts.",
                },
                pausesUpdatesAutomatically: false
            });
        }
        return true;
    }
    return false;
}

export async function stopBackgroundLocation() {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(COMPANION_LOCATION_TASK);
    if (isStarted) {
        await Location.stopLocationUpdatesAsync(COMPANION_LOCATION_TASK);
    }
}
