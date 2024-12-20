import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import useAuthStore from '../store/authStore';
import { useRouter } from 'expo-router';

const BASEURL = process.env.EXPO_PUBLIC_API_URL;



const ProfilePage = () => {
  const { currentUser, updateCurrentUser, loadUser, isLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser(); // Load user data when the component mounts
  }, []);

  const phoneNumber = currentUser?.phoneNumber;

 


  const handleChangePassword = async () => {

    if (!phoneNumber) {
      Alert.alert('Error', 'Phone number is missing. Please check your profile.');
      return;
    }
  
    console.log(BASEURL);
    setLoading(true);
    try {
      console.log('Requesting OTP for:', phoneNumber); // Debug log
      console.log('BASEURL:', BASEURL); // Debug log
  
      const response = await fetch(`${BASEURL}/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
  
      //console.log('Response Status:', response.status);
  
      if (response.ok) {
        const data = await response.json();
        console.log('OTP request successful:', data);
        router.push(`/changePassword/verifyOTP`);
      } else {
        const text = await response.text();
        console.error('Error Response:', text);
        Alert.alert('Request Failed', `Failed to request OTP. ${text}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      Alert.alert('Error', 'An error occurred while requesting OTP. Check your network and API configuration.');
    } finally {
      setLoading(false);
    }
  };
  



  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text>No user data available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <Text>Name: {`${currentUser.firstName} ${currentUser.lastName}`}</Text>
      <Text>Email: {currentUser.email}</Text>
      <Text>Phone: {currentUser.phoneNumber}</Text>
      <Text>County: {currentUser.county}</Text>
      <Text>Town: {currentUser.town}</Text>
      <Text>Gender: {currentUser.gender}</Text>

      <Button
        mode="contained"
        onPress={handleChangePassword}
        disabled={loading}
        style={styles.button}
      >
        {loading ? 'Requesting OTP...' : 'Change Password'}
      </Button>

      <Button
        mode="contained"
        onPress={() => {
          updateCurrentUser(null);
          router.replace('/login');
        }}
        style={[styles.button, styles.logoutButton]}
      >
        Logout
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
  button: {
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#f44336', // Red color for logout
  },
});

export default ProfilePage;
