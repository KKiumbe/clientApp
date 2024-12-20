import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, Alert } from 'react-native';
import { Button } from 'react-native-paper';

import { router } from 'expo-router';
import useAuthStore from '../../store/authStore';

const BASEURL = process.env.EXPO_PUBLIC_API_URL;

const RequestOtpPage = () => {
  const { currentUser, isLoading } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setPhoneNumber(currentUser.phoneNumber); // Pre-populate phone number from the logged-in user
    }
  }, [currentUser]);

  const handleRequestOtp = async () => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Please enter your phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASEURL}/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: phoneNumber }),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'OTP has been sent to your phone.');
        // Navigate to the Change Password screen
        router.push('/change-password');
      } else {
        Alert.alert('Error', result.message || 'Failed to request OTP.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Request OTP</Text>
      <TextInput
        style={styles.input}
        placeholder="Phone number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        editable={false} // Make it non-editable if you don't want the user to change it
      />
      <Button
        mode="contained"
        onPress={handleRequestOtp}
        style={styles.button}
        loading={loading}
        disabled={loading}
      >
        Request OTP
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
  },
  button: {
    marginTop: 20,
  },
});

export default RequestOtpPage;
