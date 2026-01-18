import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
    MD3DarkTheme,
    MD3LightTheme,
    PaperProvider
} from 'react-native-paper';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'system',
    setThemeMode: () => { },
    toggleTheme: () => { },
    isDark: false,
});

export const useThemeContext = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

    useEffect(() => {
        // Load preference
        AsyncStorage.getItem('themeMode').then((val) => {
            if (val) setThemeModeState(val as ThemeMode);
        });
    }, []);

    const setThemeMode = (mode: ThemeMode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem('themeMode', mode);
    };

    const isDark =
        themeMode === 'dark' ||
        (themeMode === 'system' && systemColorScheme === 'dark');

    const toggleTheme = () => {
        setThemeMode(isDark ? 'light' : 'dark');
    };

    const theme = isDark ? MD3DarkTheme : MD3LightTheme;

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, toggleTheme, isDark }}>
            <PaperProvider theme={theme}>
                {children}
            </PaperProvider>
        </ThemeContext.Provider>
    );
};
