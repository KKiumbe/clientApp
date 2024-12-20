import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Modal, Pressable, ScrollView, TextInput, RefreshControl, FlatList } from 'react-native';
import { DataTable, Searchbar, Snackbar, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const PaymentScreen = () => {
    const [payments, setPayments] = useState([]);
    const [originalPayments, setOriginalPayments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [totalAmount, setTotalAmount] = useState('');
    const [modeOfPayment, setModeOfPayment] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasPermission, setHasPermission] = useState(true);
    const router = useRouter();
    const BASEURL = process.env.EXPO_PUBLIC_API_URL;

    



    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BASEURL}/payments`);
            const data = await response.json();
    
            if (response.status === 403) {
                setHasPermission(false); // Permission denied
                setSnackbarMessage('Access denied. Please contact the admin.');
                setSnackbarOpen(true);
                return;
            }
    
            if (Array.isArray(data)) {
                setPayments(data);
                setOriginalPayments(data);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            setSnackbarMessage('Error fetching payments.');
            setSnackbarOpen(true);
        } finally {
            setLoading(false);
        }
    };
    

    const handleRefresh = () => {
        if (hasPermission) {
            setRefreshing(true);
            fetchPayments().then(() => setRefreshing(false));
        }
    };

    const handleSearch = async () => {
        setIsSearching(true);
        if (!searchQuery.trim()) {
            setPayments(originalPayments);
            setIsSearching(false);
            return;
        }

        try {
            const isPhoneNumber = /^\\d+$/.test(searchQuery);
            const response = await axios.get(`${BASEURL}/search-customers`, {
                params: {
                    phone: isPhoneNumber ? searchQuery : undefined,
                    name: !isPhoneNumber ? searchQuery : undefined,
                },
            });

            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching payments:', error);
            setSnackbarMessage('Error searching payments.');
            setSnackbarOpen(true);
        } finally {
            setIsSearching(false);
        }
    };

    const openModal = () => {
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        resetModalState();
    };

    const resetModalState = () => {
        setSelectedCustomer(null);
        setTotalAmount('');
        setModeOfPayment('');
        setSearchQuery('');
        setSearchResults([]);
    };

    const handlePaymentSubmit = async () => {
        if (!selectedCustomer || !totalAmount || !modeOfPayment) {
            setSnackbarMessage('Please fill all payment details.');
            setSnackbarOpen(true);
            return;
        }

        const payload = {
            customerId: selectedCustomer.id,
            totalAmount: parseFloat(totalAmount),
            modeOfPayment,
            paidBy: selectedCustomer.firstName,
        };

        setIsProcessing(true);
        try {
            await axios.post(`${BASEURL}/manual-cash-payment`, payload);
            fetchPayments();
            closeModal();
        } catch (error) {
            console.error('Error creating payment:', error);
            setSnackbarMessage('Error creating payment.');
            setSnackbarOpen(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const RenderPaymentItem = ({ item }) => (
        <DataTable.Row key={item.id}>
            <DataTable.Cell>KES {item.amount}</DataTable.Cell>
            <DataTable.Cell>{item.modeOfPayment}</DataTable.Cell>
            <DataTable.Cell>{item.TransactionId}</DataTable.Cell>
            <DataTable.Cell>{item.firstName}</DataTable.Cell>
            <DataTable.Cell>{item.receipted ? 'Receipted' : 'Not Receipted'}</DataTable.Cell>
            <DataTable.Cell>{item.receipt?.receiptNumber || 'N/A'}</DataTable.Cell>
            <DataTable.Cell>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {!item.receipted && (
                        <Pressable onPress={() => handleEditPress(item.id)} style={{ marginRight: 16 }}>
                            <Icon name="pencil" size={24} color="blue" />
                        </Pressable>
                    )}
                    <Pressable onPress={() => openDetailModal(item)}>
                        <Icon name="eye" size={24} color="green" />
                    </Pressable>
                </View>
            </DataTable.Cell>
        </DataTable.Row>
    );

    if (!hasPermission) {
        return (
            <View style={styles.accessDeniedContainer}>
                <Text style={styles.accessDeniedText}>Kindly ask the admin to give you rights.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Payments</Text>
            <Searchbar
                placeholder="Search payments by Mpesa code, name, or phone number"
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                value={searchQuery}
                style={styles.searchbar}
            />

            {loading && <ActivityIndicator size="large" color="blue" />}

            <View
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                <DataTable>
                    <DataTable.Header>
                        <DataTable.Title>Amount</DataTable.Title>
                        <DataTable.Title>Mode of Payment</DataTable.Title>
                        <DataTable.Title>Transaction ID</DataTable.Title>
                        <DataTable.Title>Status</DataTable.Title>
                        <DataTable.Title>Receipt Number</DataTable.Title>
                        <DataTable.Title>Edit</DataTable.Title>
                    </DataTable.Header>

                    <FlatList
                        data={searchQuery ? searchResults : payments}
                        renderItem={({ item }) => <RenderPaymentItem item={item} />}
                        keyExtractor={(item) => item.id.toString()}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                    />
                </DataTable>
            </View>

            <Pressable style={styles.fab} onPress={openModal}>
                <Icon name="plus" size={24} color="white" />
            </Pressable>

            <Snackbar
                visible={snackbarOpen}
                onDismiss={() => setSnackbarOpen(false)}
                duration={6000}
            >
                {snackbarMessage}
            </Snackbar>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        paddingTop: 50,
    },
    searchbar: {
        marginBottom: 16,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: 'blue',
        borderRadius: 50,
        padding: 16,
    },
    accessDeniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    accessDeniedText: {
        fontSize: 18,
        color: 'red',
        textAlign: 'center',
    },
});

export default PaymentScreen;
