import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, RefreshControl } from 'react-native';
import { DataTable, Appbar, Snackbar, ActivityIndicator, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import useAuthStore from '../../store/authStore';

const ReceiptsScreen = () => {
    const [receipts, setReceipts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const BASEURL = process.env.EXPO_PUBLIC_API_URL;
    const router = useRouter();
    const currentUser = useAuthStore((state) => state.currentUser);

    useEffect(() => {
        if (!currentUser) {
            router.push('/login');
        } else {
            fetchReceipts();
        }
    }, [currentUser]);

    const fetchReceipts = async () => {
        setLoading(true);
        setSnackbarMessage('');
        setSnackbarOpen(false);

        try {
            // No Authorization header needed; cookies handle the authentication.
            const response = await axios.get(`${BASEURL}/receipts`, {
                withCredentials: true, // Ensures cookies are sent with the request
            });

            if (Array.isArray(response.data)) {
                setReceipts(response.data);
                setFilteredReceipts(response.data);
            } else {
                setReceipts([]);
                setFilteredReceipts([]);
            }
        } catch (error) {
            console.error('Error fetching receipts:', error);
            if (error.response?.status === 403) {
                setSnackbarMessage('Access denied: You do not have permission to view receipts.');
            } else {
                setSnackbarMessage('An error occurred while fetching receipts.');
            }
            setReceipts([]);
            setFilteredReceipts([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setSnackbarOpen(true);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        const filteredData = receipts.filter((receipt) => {
            const receiptNumberMatch = receipt.receiptNumber?.toLowerCase().includes(query.toLowerCase());
            const paidByMatch = receipt.paidBy?.toLowerCase().includes(query.toLowerCase());
            const phoneNumberMatch = receipt.customer?.phoneNumber?.toLowerCase().includes(query.toLowerCase());
            return receiptNumberMatch || paidByMatch || phoneNumberMatch;
        });
        setFilteredReceipts(filteredData);
    };

    const handleRowClick = (receipt) => {
        if (receipt.id) {
            router.push(`/receipt/${receipt.id}`);
        } else {
            console.error('Receipt ID is missing:', receipt);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReceipts();
    };

    return (
        <View style={styles.container}>
            <Appbar.Header>
                <Appbar.Content title="Receipts" />
            </Appbar.Header>

            <View style={styles.searchContainer}>
                <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Receipt Number, Name, Phone Number"
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="blue" style={styles.loader} />
            ) : (
                <ScrollView
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <DataTable>
                        <DataTable.Header>
                            <DataTable.Title>Receipt Number</DataTable.Title>
                            <DataTable.Title numeric>Amount (KES)</DataTable.Title>
                            <DataTable.Title>Mode of Payment</DataTable.Title>
                            <DataTable.Title>Status</DataTable.Title>
                            <DataTable.Title>Paid By</DataTable.Title>
                        </DataTable.Header>

                        {filteredReceipts.map((receipt) => (
                            <DataTable.Row
                                key={receipt.id}
                                onPress={() => handleRowClick(receipt)}
                                style={!receipt.receipted ? styles.unreceiptedRow : {}}
                            >
                                <DataTable.Cell>{receipt.receiptNumber}</DataTable.Cell>
                                <DataTable.Cell numeric>{receipt.amount}</DataTable.Cell>
                                <DataTable.Cell>{receipt.modeOfPayment}</DataTable.Cell>
                                <DataTable.Cell>{receipt.receipted ? 'Receipted' : 'Not Receipted'}</DataTable.Cell>
                                <DataTable.Cell>{receipt.paidBy}</DataTable.Cell>
                            </DataTable.Row>
                        ))}
                    </DataTable>
                </ScrollView>
            )}

            <Snackbar
                visible={snackbarOpen}
                onDismiss={() => setSnackbarOpen(false)}
                duration={3000}
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
        backgroundColor: '#f5f5f5',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 25,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        elevation: 5,
    },
    searchInput: {
        height: 50,
        flex: 1,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    searchIcon: {
        padding: 10,
    },
    unreceiptedRow: {
        backgroundColor: '#ffe6e6',
    },
    loader: {
        marginTop: 20,
    },
});

export default ReceiptsScreen;
