import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export const CalendarService = {
    async requestPermissionsAsync() {
        const { status } = await Calendar.requestCalendarPermissionsAsync();
        if (status === 'granted') {
            if (Platform.OS === 'ios') {
                await Calendar.requestRemindersPermissionsAsync(); // iOS only
            }
            return true;
        }
        return false;
    },

    async getDefaultCalendarId() {
        try {
            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

            if (Platform.OS === 'ios') {
                const defaultCalendar = calendars.find(c => c.source.name === 'Default');
                return defaultCalendar?.id || calendars[0]?.id;
            } else {
                // Android: Find the primary Google calendar if possible
                const primary = calendars.find(c => c.isPrimary && c.allowsModifications);
                return primary?.id || calendars.find(c => c.allowsModifications)?.id;
            }
        } catch (e) {
            console.warn("Error getting calendars", e);
            return null;
        }
    },

    async createEvent(title: string, startDate: Date, notes?: string) {
        try {
            const hasPermission = await this.requestPermissionsAsync();
            if (!hasPermission) {
                console.log("Calendar permission denied");
                return null;
            }

            const calendarId = await this.getDefaultCalendarId();
            if (!calendarId) {
                console.log("No writable calendar found");
                return null;
            }

            // Create end date (1 hour duration by default)
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

            const eventId = await Calendar.createEventAsync(calendarId, {
                title,
                startDate,
                endDate,
                notes,
                alarms: [
                    { relativeOffset: 0, method: Calendar.AlarmMethod.ALERT }, // At time of event
                    { relativeOffset: -15, method: Calendar.AlarmMethod.ALERT } // 15 mins before
                ],
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            });

            console.log(`Event created: ${eventId}`);
            return eventId;
        } catch (e) {
            console.error("Error creating calendar event", e);
            return null;
        }
    }
};
