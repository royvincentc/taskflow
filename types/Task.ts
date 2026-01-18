export type Reminder = {
    id: string;
    date: string; // ISO string
    isCompleted: boolean;
};

export type Task = {
    id: string;
    userId: string;
    title: string; // Patient Name or ID
    description?: string;
    category: 'Microbiology' | 'General';
    // Microbiology specific fields
    labId?: string;
    sampleType?: string; // e.g., Blood, Urine
    testType?: string;   // e.g., Culture, Sensitivity
    createdAt: string;
    reminders: Reminder[];
    isCompleted: boolean;
};
