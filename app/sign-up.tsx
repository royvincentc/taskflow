import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, TextInput, Title, useTheme } from 'react-native-paper';
import { AuthService } from '../services/AuthService';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    const handleSignUp = async () => {
        if (!email || !password) return;
        setLoading(true);
        try {
            await AuthService.signUp(email, password);
            Alert.alert("Success", "Account created successfully");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Title style={styles.title}>Create Account</Title>

            <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                mode="outlined"
            />

            <Button
                mode="contained"
                onPress={handleSignUp}
                loading={loading}
                style={styles.button}
            >
                Sign Up
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    input: {
        marginBottom: 12,
    },
    button: {
        marginTop: 10,
        paddingVertical: 5,
    },
});
