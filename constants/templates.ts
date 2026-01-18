export type ReminderTemplate = {
    id: string;
    name: string;
    description: string;
    offsets: number[]; // days from start
    icon: string;
};

export const REMINDER_TEMPLATES: ReminderTemplate[] = [
    {
        id: 'swab',
        name: 'Swab Test',
        description: 'Read results after 2 days',
        offsets: [2],
        icon: 'microscope'
    },
    {
        id: 'water',
        name: 'Water Sample',
        description: 'Read on 2nd, 7th, and 14th day',
        offsets: [2, 7, 14],
        icon: 'water'
    },
    {
        id: 'bacteria',
        name: 'Bacteria Culture',
        description: 'Check on 1st, 3rd, and 5th day',
        offsets: [1, 3, 5],
        icon: 'bacteria'
    },
    {
        id: 'custom',
        name: 'Custom Schedule',
        description: 'Set your own reminder days',
        offsets: [],
        icon: 'calendar-clock'
    }
];
