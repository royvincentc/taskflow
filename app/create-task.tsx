import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Card, IconButton, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { REMINDER_TEMPLATES, ReminderTemplate } from '../constants/templates';
import { useAuth } from '../context/AuthContext';
import { TaskService } from '../services/TaskService';

import { CalendarService } from '../services/CalendarService';
import { NotificationService } from '../services/NotificationService';

export default function CreateTaskScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const theme = useTheme();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [customReminders, setCustomReminders] = useState<Date[]>([]);

    // UI States
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [syncToCalendar, setSyncToCalendar] = useState(false);
    const [loading, setLoading] = useState(false);
    const [previewDates, setPreviewDates] = useState<Date[]>([]);

    useEffect(() => {
        NotificationService.requestPermissionsAsync();
        // Check calendar permissions initially? Not strictly needed until toggle is pressed
    }, []);

    useEffect(() => {
        if (selectedTemplate && selectedTemplate !== 'custom') {
            const template = REMINDER_TEMPLATES.find(t => t.id === selectedTemplate);
            if (template) {
                const dates = template.offsets.map(offset => {
                    const d = new Date(startDate);
                    d.setDate(d.getDate() + offset);
                    // Keep the time from startDate
                    d.setHours(startDate.getHours(), startDate.getMinutes());
                    return d;
                });
                setPreviewDates(dates);
            }
        } else if (selectedTemplate === 'custom') {
            setPreviewDates(customReminders);
        } else {
            setPreviewDates([]);
        }
    }, [selectedTemplate, startDate, customReminders]);

    // Helper for timeout
    const timeout = (ms: number) => {
        return new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out. Please check your connection.")), ms));
    };

    const handleCreate = async () => {
        if (!title.trim()) {
            Alert.alert("Required", "Please enter a task name.");
            return;
        }

        setLoading(true);
        console.log("Starting task creation process...");

        try {
            const reminders = previewDates.map(date => ({
                id: date.getTime().toString(),
                date: date.toISOString(),
                isCompleted: false
            }));

            // Race the create task against a 3s timeout
            const createPromise = TaskService.createTask({
                userId: user?.uid || 'anonymous',
                title,
                description,
                category: 'Microbiology',
                reminders,
                createdAt: new Date().toISOString(),
                isCompleted: false
            });

            const timeoutPromise = new Promise<{ timeout: boolean }>((resolve) =>
                setTimeout(() => resolve({ timeout: true }), 3000)
            );

            // @ts-ignore
            const result = await Promise.race([createPromise, timeoutPromise]);

            if ((result as any)?.timeout) {
                console.log("Task creation taking a while, assuming offline queue...");
                Alert.alert("Saved Offline", "Your task has been queued and will sync when online.");
            } else {
                console.log("Task created in DB directly.");
            }

            // Schedule Notifications
            try {
                const notificationPromises = previewDates.map(date =>
                    NotificationService.scheduleReminder(
                        `Reminder: ${title}`,
                        `Time to check your ${title} task!`,
                        date
                    )
                );
                await Promise.all(notificationPromises);
            } catch (notifError) {
                console.error("Failed to schedule notifications:", notifError);
            }

            // Sync to Calendar
            if (syncToCalendar) {
                try {
                    console.log("Syncing to calendar...");
                    const calendarPromises = previewDates.map(date =>
                        CalendarService.createEvent(title, date, description)
                    );
                    await Promise.all(calendarPromises);
                    console.log("Synced to calendar successfully.");
                } catch (calError) {
                    console.error("Failed to sync to calendar:", calError);
                    Alert.alert("Calendar Error", "Could not sync events to calendar.");
                }
            }

            setLoading(false);
            router.replace('/');

        } catch (error: any) {
            console.error("Creation failed:", error);
            setLoading(false);
            Alert.alert("Error", "Failed to create task: " + error.message);
        }
    };

    const addCustomReminder = (date: Date) => {
        setCustomReminders([...customReminders, date]);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const newDate = new Date(startDate);
            newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

            if (selectedTemplate === 'custom') {
                addCustomReminder(selectedDate);
            } else {
                setStartDate(newDate);
            }
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(false);
        if (selectedTime) {
            const newDate = new Date(startDate);
            newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
            setStartDate(newDate);
        }
    };

    const TemplateCard = ({ template }: { template: ReminderTemplate }) => {
        const isSelected = selectedTemplate === template.id;
        return (
            <TouchableOpacity onPress={() => setSelectedTemplate(template.id)} style={{ width: '48%', marginBottom: 12 }}>
                <Card mode="outlined" style={[styles.templateCard, isSelected && { borderColor: theme.colors.primary, borderWidth: 2, backgroundColor: theme.colors.secondaryContainer }]}>
                    <Card.Content style={{ padding: 12 }}>
                        <Avatar.Icon
                            size={32}
                            icon={template.icon}
                            style={{
                                backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
                                marginBottom: 12
                            }}
                            color={isSelected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                        />
                        <Text variant="labelLarge" style={{ fontWeight: 'bold', marginBottom: 4 }}>{template.name}</Text>
                        <Text variant="bodySmall" style={{ opacity: 0.7, lineHeight: 16 }}>{template.description}</Text>
                    </Card.Content>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Create New Task</Text>
                <IconButton icon="close" onPress={() => router.back()} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.inputGroup}>
                    <Text variant="titleSmall" style={styles.label}>Task Name</Text>
                    <TextInput
                        placeholder="e.g., Kitchen swab test"
                        value={title}
                        onChangeText={setTitle}
                        mode="outlined"
                        style={styles.input}
                        dense
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="titleSmall" style={styles.label}>Description (optional)</Text>
                    <TextInput
                        placeholder="Add any notes..."
                        value={description}
                        onChangeText={setDescription}
                        mode="outlined"
                        style={styles.input}
                        dense
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text variant="titleSmall" style={styles.label}>Start Date & Time</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flex: 1 }}>
                            <TextInput
                                value={startDate.toLocaleDateString()}
                                mode="outlined"
                                editable={false}
                                right={<TextInput.Icon icon="calendar" onPress={() => setShowDatePicker(true)} />}
                                style={styles.input}
                                dense
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ flex: 1 }}>
                            <TextInput
                                value={startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                mode="outlined"
                                editable={false}
                                right={<TextInput.Icon icon="clock-outline" onPress={() => setShowTimePicker(true)} />}
                                style={styles.input}
                                dense
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Sync Toggle */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, backgroundColor: theme.colors.surfaceVariant, padding: 12, borderRadius: 12 }}>
                    <View>
                        <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>Sync to Google Calendar</Text>
                        <Text variant="bodySmall" style={{ opacity: 0.7 }}>Add an event with alarm for each reminder</Text>
                    </View>
                    <Switch value={syncToCalendar} onValueChange={setSyncToCalendar} />
                </View>

                <Text variant="titleSmall" style={[styles.label, { marginTop: 8 }]}>Reminder Template</Text>
                <View style={styles.templateGrid}>
                    {REMINDER_TEMPLATES.map(t => <TemplateCard key={t.id} template={t} />)}
                </View>

                {(previewDates.length > 0 || selectedTemplate === 'custom') && (
                    <Card style={[styles.previewCard, { backgroundColor: theme.colors.surfaceVariant }]} mode="contained">
                        <Card.Content>
                            <Text variant="titleSmall" style={{ marginBottom: 12 }}>Reminder Preview</Text>

                            {previewDates.map((d, i) => (
                                <View key={i} style={styles.previewRow}>
                                    <Text variant="bodyMedium" style={{ opacity: 0.7 }}>
                                        {Math.abs(d.getTime() - startDate.getTime()) < 3600000 ? 'Starting Now' :
                                            `Day ${Math.round((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}`}
                                        {' - '}
                                        {selectedTemplate === 'custom' ? 'Custom Reminder' : 'Read results'}
                                    </Text>
                                    <Text variant="bodyMedium" style={{ fontWeight: 'bold', fontFamily: Platform.select({ android: 'monospace', ios: 'Courier', default: 'monospace' }) }}>
                                        {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} @ {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            ))}

                            {selectedTemplate === 'custom' && (
                                <Button mode="text" onPress={() => setShowDatePicker(true)} style={{ marginTop: 8 }} icon="plus">
                                    Add Date
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                )}

                <View style={styles.footer}>
                    <Button mode="outlined" onPress={() => router.back()} style={{ flex: 1, marginRight: 8 }} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        mode="contained"
                        onPress={handleCreate}
                        loading={loading}
                        style={{ flex: 1, marginLeft: 8 }}
                    >
                        Create Task
                    </Button>
                </View>
            </ScrollView>

            {showDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    onChange={onDateChange}
                />
            )}

            {showTimePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="time"
                    onChange={onTimeChange}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    content: {
        padding: 20,
        paddingTop: 0,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: 'transparent',
    },
    templateGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    templateCard: {
        height: 150,
    },
    previewCard: {
        marginTop: 16,
        marginBottom: 20,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 20,
        marginBottom: 40,
    }
});
