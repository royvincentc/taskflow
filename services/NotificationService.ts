import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const NotificationService = {
    async requestPermissionsAsync() {
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Permission not granted for notifications');
            return;
        }
    },

    async scheduleReminder(title: string, body: string, triggerDate: Date) {
        console.log('Scheduling notification:', title, 'at', triggerDate);
        if (triggerDate.getTime() <= Date.now()) {
            console.log('Date is in past, skipping notification');
            return;
        }

        try {
            const id = await Notifications.scheduleNotificationAsync({
                content: {
                    title: title,
                    body: body,
                    sound: true,
                },
                trigger: {
                    type: SchedulableTriggerInputTypes.DATE,
                    date: triggerDate
                },
            });
            console.log('Notification scheduled, ID:', id);
            return id;
        } catch (error) {
            console.error("Error scheduling notification:", error);
            throw error;
        }
    },

    async cancelAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }
};
