import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    Timestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { Task } from '../types/Task';
import { db } from './firebaseConfig';

const TASKS_COLLECTION = 'tasks';

export const TaskService = {
    createTask: async (taskData: Omit<Task, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
                ...taskData,
                createdAt: Timestamp.now().toDate().toISOString(),
            });
            return docRef.id;
        } catch (e) {
            console.error("Error adding document: ", e);
            throw e;
        }
    },

    updateTask: async (taskId: string, updates: Partial<Task>) => {
        const taskRef = doc(db, TASKS_COLLECTION, taskId);
        return updateDoc(taskRef, updates);
    },

    deleteTask: async (taskId: string) => {
        return deleteDoc(doc(db, TASKS_COLLECTION, taskId));
    },

    subscribeToUserTasks: (userId: string, callback: (tasks: Task[]) => void) => {
        const q = query(
            collection(db, TASKS_COLLECTION),
            where("userId", "==", userId)
        );

        return onSnapshot(q, (snapshot) => {
            const tasks: Task[] = [];
            snapshot.forEach((doc) => {
                tasks.push({ id: doc.id, ...doc.data() } as Task);
            });
            callback(tasks);
        });
    }
};
