import { useAuth } from '@/context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { TaskService } from '@/services/TaskService';
import { Task } from '@/types/Task';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { LayoutAnimation, Platform, SafeAreaView, SectionList, StatusBar, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { AnimatedFAB, Avatar, Card, Divider, IconButton, Text, useTheme } from 'react-native-paper';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const UpcomingRemindersWidget = ({ tasks }: { tasks: Task[] }) => {
    const theme = useTheme();

    // Flatten, filter, and sort reminders
    const upcoming = tasks
        .flatMap(task => (task.reminders || []).map(r => ({ ...r, taskTitle: task.title, taskId: task.id })))
        .filter(r => !r.isCompleted && new Date(r.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 2);

    if (upcoming.length === 0) return null;

    return (
        <Card style={[styles.upcomingCard, { backgroundColor: theme.colors.elevation.level1 }]} mode="contained">
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ backgroundColor: theme.colors.surfaceVariant, padding: 8, borderRadius: 20, marginRight: 12 }}>
                    <MaterialCommunityIcons name="bell" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Upcoming Reminders</Text>
            </View>

            {upcoming.map((r, i) => {
                const date = new Date(r.date);
                const now = new Date();
                const diffTime = date.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return (
                    <View key={`${r.taskId}-${i}`} style={[styles.upcomingRow, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.onSurfaceVariant, marginRight: 12 }} />
                            <View>
                                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{r.taskTitle}</Text>
                                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                                    Day {Math.ceil(diffDays)} - Read results
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="labelSmall" style={{ fontWeight: 'bold' }}>In {diffDays}d</Text>
                            <Text variant="bodySmall" style={{ opacity: 0.7 }}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                        </View>
                    </View>
                );
            })}
        </Card>
    );
};

const TaskItem = ({ item, onToggleComplete, onToggleReminder, onDelete }: {
    item: Task,
    onToggleComplete: (task: Task) => void,
    onToggleReminder: (task: Task, reminderIndex: number) => void,
    onDelete: (id: string) => void
}) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    const nextReminder = item.reminders?.find(r => !r.isCompleted);
    const reminderCount = item.reminders?.length || 0;

    return (
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated" elevation={1} onPress={toggleExpand}>
            <View style={styles.cardInner}>

                {/* Row 1: Checkbox | Title | Trash */}
                <View style={styles.cardHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); onToggleComplete(item); }} style={{ padding: 4, marginRight: 8 }}>
                            <MaterialCommunityIcons
                                name={item.isCompleted ? "check-circle" : "checkbox-blank-circle-outline"}
                                size={28}
                                color={item.isCompleted ? theme.colors.primary : theme.colors.onSurfaceVariant}
                            />
                        </TouchableOpacity>
                        <Text variant="titleMedium" style={[styles.taskTitle, item.isCompleted && styles.completedText]}>
                            {item.title}
                        </Text>
                    </View>
                    <IconButton
                        icon="trash-can-outline"
                        size={18}
                        onPress={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        style={{ margin: 0, opacity: 0.5 }}
                    />
                </View>

                {/* Row 2: Next Info (Pill + Text) */}
                {nextReminder && !item.isCompleted && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingLeft: 40 }}>
                        <View style={[styles.pill, { backgroundColor: theme.colors.surfaceVariant, marginRight: 8 }]}>
                            <Text variant="labelSmall" style={{ fontWeight: 'bold' }}>
                                {new Date(nextReminder.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Text>
                        </View>
                        <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                            Day {Math.max(1, Math.round((new Date(nextReminder.date).getTime() - new Date(item.createdAt).getTime()) / 86400000))} - Read results
                        </Text>
                    </View>
                )}

                {/* Row 3: Bell + Count + Chevron (Toggle) */}
                <TouchableOpacity onPress={toggleExpand} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingLeft: 40, opacity: 0.7 }}>
                    <MaterialCommunityIcons name="bell-outline" size={16} color={theme.colors.onSurface} style={{ marginRight: 6 }} />
                    <Text variant="bodyMedium" style={{ marginRight: 4 }}>
                        {reminderCount} {reminderCount === 1 ? 'reminder' : 'reminders'}
                    </Text>
                    <MaterialCommunityIcons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={theme.colors.onSurface}
                    />
                </TouchableOpacity>

            </View>

            {expanded && (
                <View style={styles.expandedContent}>
                    <Divider style={{ marginVertical: 12, opacity: 0.1 }} />
                    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>

                        {item.reminders && item.reminders.length > 0 ? (
                            item.reminders.map((r, i) => {
                                const rDate = new Date(r.date);
                                const createdDate = new Date(item.createdAt);
                                const diffTime = rDate.getTime() - createdDate.getTime();
                                const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

                                return (
                                    <View key={i} style={styles.reminderRow}>
                                        {/* Left: Checkbox + Text */}
                                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                            <TouchableOpacity onPress={() => onToggleReminder(item, i)}>
                                                <MaterialCommunityIcons
                                                    name={r.isCompleted ? "check-circle" : "checkbox-blank-circle-outline"}
                                                    size={22}
                                                    color={r.isCompleted ? theme.colors.onSurface : theme.colors.outline}
                                                />
                                            </TouchableOpacity>
                                            <Text variant="bodyMedium" style={{ marginLeft: 12, flex: 1, textDecorationLine: r.isCompleted ? 'line-through' : 'none', opacity: r.isCompleted ? 0.5 : 1 }}>
                                                Day {diffDays} - Read results
                                            </Text>
                                        </View>

                                        {/* Right: Date Pill */}
                                        <View style={[styles.pill, {
                                            backgroundColor: r.isCompleted ? '#E6F4EA' : theme.colors.surfaceVariant
                                        }]}>
                                            <Text variant="labelSmall" style={{
                                                color: r.isCompleted ? '#1E8E3E' : theme.colors.onSurface,
                                                fontWeight: 'bold'
                                            }}>
                                                {rDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            })
                        ) : (
                            <Text variant="bodySmall" style={{ fontStyle: 'italic', opacity: 0.6 }}>No reminders set</Text>
                        )}
                    </View>
                </View>
            )}
        </Card>
    );
};

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const theme = useTheme();
    const { isDark, toggleTheme } = useThemeContext();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    useEffect(() => {
        if (!user) return;
        const unsubscribe = TaskService.subscribeToUserTasks(user.uid, (fetchedTasks) => {
            console.log("Fetched tasks count:", fetchedTasks.length);
            setTasks(fetchedTasks);
            setLoading(false);
        });
        return unsubscribe;
    }, [user]);

    const handleToggleComplete = async (task: Task) => {
        try {
            await TaskService.updateTask(task.id, { isCompleted: !task.isCompleted });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteTask = async (id: string) => {
        try {
            await TaskService.deleteTask(id);
        } catch (e) {
            console.error(e);
        }
    };

    const handleToggleReminder = async (task: Task, reminderIndex: number) => {
        try {
            const updatedReminders = [...(task.reminders || [])];
            if (updatedReminders[reminderIndex]) {
                updatedReminders[reminderIndex].isCompleted = !updatedReminders[reminderIndex].isCompleted;
                await TaskService.updateTask(task.id, { reminders: updatedReminders });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const activeTasks = tasks.filter(t => !t.isCompleted);
    const completedTasks = tasks.filter(t => t.isCompleted);

    const sections = [
        { title: 'ACTIVE', data: activeTasks },
        { title: 'COMPLETED', data: completedTasks }
    ].filter(s => s.data.length > 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: theme.colors.outlineVariant }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.logoContainer, { borderColor: theme.colors.onSurface }]}>
                        <MaterialCommunityIcons name="check" size={24} color={theme.colors.onSurface} />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>TaskFlow</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '500' }}>{dateString}</Text>
                    </View>
                </View>
                <IconButton
                    icon={isDark ? "weather-sunny" : "weather-night"}
                    size={20}
                    onPress={toggleTheme}
                />
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={
                    <View>
                        <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                            <View>
                                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>Your Tasks</Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                                    {activeTasks.length} active • {completedTasks.length} completed
                                </Text>
                            </View>
                        </View>

                        <UpcomingRemindersWidget tasks={tasks} />
                    </View>
                }
                renderSectionHeader={({ section: { title } }) => (
                    <Text variant="labelLarge" style={{ marginHorizontal: 20, marginBottom: 12, marginTop: 24, opacity: 0.5, fontWeight: 'bold', letterSpacing: 1 }}>
                        {title}
                    </Text>
                )}
                renderItem={({ item }) => (
                    <TaskItem
                        item={item}
                        onToggleComplete={handleToggleComplete}
                        onToggleReminder={handleToggleReminder}
                        onDelete={handleDeleteTask}
                    />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={!loading && tasks.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Avatar.Icon size={70} icon="clipboard-text-outline" style={{ backgroundColor: theme.colors.surfaceVariant, marginBottom: 16 }} color={theme.colors.primary} />
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>No tasks</Text>
                    </View>
                ) : null}
            />

            <AnimatedFAB
                icon={'plus'}
                label={'New Task'}
                extended={false}
                onPress={() => router.push('/create-task')}
                animateFrom={'right'}
                iconMode={'static'}
                style={[styles.fab, { backgroundColor: isDark ? '#FFF' : '#000' }]}
                color={isDark ? '#000' : '#FFF'}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    list: {
        paddingBottom: 100,
    },
    card: {
        marginBottom: 16,
        marginHorizontal: 20,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 0,
    },
    cardInner: {
        padding: 16,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskTitle: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    completedText: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    expandedContent: {
        backgroundColor: 'transparent',
    },
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    pill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    upcomingCard: {
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 20,
        marginBottom: 0,
    },
    upcomingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        padding: 12,
        borderRadius: 16,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
        padding: 20,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        borderRadius: 30,
    },
});
