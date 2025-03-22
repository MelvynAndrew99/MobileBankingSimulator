document.addEventListener('alpine:init', () => {
    Alpine.data('bankApp', () => ({
        // Core state
        userName: localStorage.getItem('userName') || 'Alex Johnson',
        checkingBalance: parseFloat(localStorage.getItem('checkingBalance')) || 5240.75,
        savingsBalance: parseFloat(localStorage.getItem('savingsBalance')) || 2500.00,
        checkingAccountNumber: localStorage.getItem('checkingAccountNumber') || 'Checking •••• 4567',
        savingsAccountNumber: localStorage.getItem('savingsAccountNumber') || 'Savings •••• 7890',
        activeAccount: localStorage.getItem('activeAccount') || 'checking',
        transactions: JSON.parse(localStorage.getItem('transactions')) || [],
        fromAccount: '',
        toAccount: '',
        transferAmount: '',
        internalFromAccount: 'checking',
        internalToAccount: 'savings',
        internalTransferAmount: '',
        depositToAccount: 'checking',
        depositAmount: '',
        depositSource: 'Cash Deposit',
        currentAction: localStorage.getItem('currentAction') || 'send',
        transactionFilter: 'all',
        showReceipt: false,
        txDate: '',
        txId: '',
        showEditModal: false,
        editModalTitle: '',
        editValue: '',
        editTarget: '',
        showNotification: false,
        notificationType: 'success',
        notificationTitle: '',
        notificationMessage: '',
        notificationTimer: null,

        // Navigation and UI state
        currentPage: localStorage.getItem('currentPage') || 'home',
        navItems: [
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'payments', icon: '💸', label: 'Payments' },
            { id: 'stats', icon: '📊', label: 'Stats' },
            { id: 'settings', icon: '⚙️', label: 'Settings' }
        ],
        quickActions: [
            { id: 'send', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Send' },
            { id: 'deposit', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M12 20L18 14M12 20L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Deposit' },
            { id: 'transfer', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Transfer' },
            { id: 'cards', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M2 10H22" stroke="currentColor" stroke-width="2"/></svg>', label: 'Cards' }
        ],
        isLoading: false,
        showServerError: false,
        serverErrorMessage: '',
        fraudDetected: false,
        showSearch: false,
        showNotifications: false,
        showProfile: false,
        showQuickActions: false,
        cards: [
            { type: 'debit', number: '**** **** **** 4567', expiry: '05/28', isLocked: false },
            { type: 'credit', number: '**** **** **** 9876', expiry: '03/27', isLocked: false }
        ],
        lastTransactionAmount: 0,

        init() {
            this.fromAccount = this.checkingAccountNumber;
            this.loadFromLocalStorage();
            this.$watch('activeAccount', (value) => {
                if (value === 'checking') {
                    this.fromAccount = this.checkingAccountNumber;
                    this.internalFromAccount = 'checking';
                    this.internalToAccount = 'savings';
                } else {
                    this.fromAccount = this.savingsAccountNumber;
                    this.internalFromAccount = 'savings';
                    this.internalToAccount = 'checking';
                }
                localStorage.setItem('activeAccount', value);
            });
            if (this.transactions.length === 0) this.addDemoTransactions();
            this.$watch('currentAction', (value) => localStorage.setItem('currentAction', value));

            // Keyboard triggers
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'F') this.triggerFraudDetection();
                if (e.ctrlKey && e.shiftKey && e.key === 'E') this.triggerServerError('Server connection timeout. Please try again.');
                if (e.ctrlKey && e.shiftKey && e.key === 'D') this.simulateDelay();
            });
        },

        loadFromLocalStorage() {
            this.userName = localStorage.getItem('userName') || this.userName;
            this.checkingBalance = parseFloat(localStorage.getItem('checkingBalance')) || this.checkingBalance;
            this.savingsBalance = parseFloat(localStorage.getItem('savingsBalance')) || this.savingsBalance;
            this.checkingAccountNumber = localStorage.getItem('checkingAccountNumber') || this.checkingAccountNumber;
            this.savingsAccountNumber = localStorage.getItem('savingsAccountNumber') || this.savingsAccountNumber;
            this.activeAccount = localStorage.getItem('activeAccount') || this.activeAccount;
            this.transactions = JSON.parse(localStorage.getItem('transactions')) || this.transactions;
            this.currentAction = localStorage.getItem('currentAction') || this.currentAction;
            this.transactionFilter = localStorage.getItem('transactionFilter') || 'all';
            this.currentPage = localStorage.getItem('currentPage') || this.currentPage;
            this.cards[0].isLocked = localStorage.getItem('debitCardLocked') === 'true';
            this.cards[1].isLocked = localStorage.getItem('creditCardLocked') === 'true';
            if (this.activeAccount === 'checking') this.fromAccount = this.checkingAccountNumber;
            else this.fromAccount = this.savingsAccountNumber;
        },

        saveToLocalStorage() {
            localStorage.setItem('userName', this.userName);
            localStorage.setItem('checkingBalance', this.checkingBalance);
            localStorage.setItem('savingsBalance', this.savingsBalance);
            localStorage.setItem('checkingAccountNumber', this.checkingAccountNumber);
            localStorage.setItem('savingsAccountNumber', this.savingsAccountNumber);
            localStorage.setItem('activeAccount', this.activeAccount);
            localStorage.setItem('transactions', JSON.stringify(this.transactions));
            localStorage.setItem('currentAction', this.currentAction);
            localStorage.setItem('transactionFilter', this.transactionFilter);
            localStorage.setItem('currentPage', this.currentPage);
            localStorage.setItem('debitCardLocked', this.cards[0].isLocked);
            localStorage.setItem('creditCardLocked', this.cards[1].isLocked);
        },

        formatCurrency(amount) {
            const num = parseFloat(amount);
            if (isNaN(num)) {
                return '$0.00';
            }
            return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        },

        generateTxId() {
            const chars = '0123456789ABCDEF';
            let txid = '';
            for (let i = 0; i < 16; i++) txid += chars[Math.floor(Math.random() * chars.length)];
            return txid;
        },

        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('success', 'Copied', 'Account number copied to clipboard!');
            }).catch(err => {
                this.showToast('error', 'Copy Failed', 'Failed to copy: ' + err);
            });
        },

        setActiveAccount(account) {
            this.activeAccount = account;
        },

        setActiveAction(actionId) {
            this.currentAction = actionId;
        },

        setActiveNav(navId) {
            if (this.isLoading) return;
            this.isLoading = true;
            const delay = Math.random() * 1500 + 500;
            setTimeout(() => {
                if (this.fraudDetected) {
                    this.showServerError = true;
                    this.serverErrorMessage = 'Navigation blocked: Suspicious activity detected. Call 1-800-555-0123.';
                    this.isLoading = false;
                    return;
                }
                this.currentPage = navId;
                localStorage.setItem('currentPage', navId);
                this.showToast('success', `${navId.charAt(0).toUpperCase() + navId.slice(1)} Loaded`, `Navigated to ${navId} page.`);
                this.isLoading = false;
            }, delay);
        },

        editUserName() {
            this.editModalTitle = 'Edit Your Name';
            this.editValue = this.userName;
            this.editTarget = 'userName';
            this.showEditModal = true;
            setTimeout(() => this.$refs.editInput.focus(), 100);
        },

        editBalance(accountType) {
            if (accountType === 'checking') {
                this.editModalTitle = 'Edit Checking Balance';
                this.editValue = this.checkingBalance;
                this.editTarget = 'checkingBalance';
            } else {
                this.editModalTitle = 'Edit Savings Balance';
                this.editValue = this.savingsBalance;
                this.editTarget = 'savingsBalance';
            }
            this.showEditModal = true;
            setTimeout(() => this.$refs.editInput.focus(), 100);
        },

        editAccountNumber(accountType) {
            if (accountType === 'checking') {
                this.editModalTitle = 'Edit Checking Account Number';
                this.editValue = this.checkingAccountNumber;
                this.editTarget = 'checkingAccountNumber';
            } else {
                this.editModalTitle = 'Edit Savings Account Number';
                this.editValue = this.savingsAccountNumber;
                this.editTarget = 'savingsAccountNumber';
            }
            this.showEditModal = true;
            setTimeout(() => this.$refs.editInput.focus(), 100);
        },

        saveEdit() {
            if (this.editTarget === 'userName') this.userName = this.editValue || 'Alex Johnson';
            else if (this.editTarget === 'checkingBalance') this.checkingBalance = parseFloat(this.editValue) || 0;
            else if (this.editTarget === 'savingsBalance') this.savingsBalance = parseFloat(this.editValue) || 0;
            else if (this.editTarget === 'checkingAccountNumber') {
                this.checkingAccountNumber = this.editValue || 'Checking •••• 4567';
                if (this.activeAccount === 'checking') this.fromAccount = this.checkingAccountNumber;
            } else if (this.editTarget === 'savingsAccountNumber') {
                this.savingsAccountNumber = this.editValue || 'Savings •••• 7890';
                if (this.activeAccount === 'savings') this.fromAccount = this.savingsAccountNumber;
            }
            this.saveToLocalStorage();
            this.showEditModal = false;
        },

        cancelEdit() {
            this.showEditModal = false;
        },

        makeDeposit() {
            const amount = parseFloat(this.depositAmount);
            if (!amount || amount <= 0) {
                this.showToast('error', 'Invalid Amount', 'Please enter an amount greater than $0.00.');
                return;
            }
            this.isLoading = true;
            setTimeout(() => {
                if (this.fraudDetected && amount > 5000) {
                    this.showServerError = true;
                    this.serverErrorMessage = 'Large deposit flagged as potential fraud. Contact 1-800-555-0123.';
                    this.isLoading = false;
                    return;
                }
                if (this.depositToAccount === 'checking') {
                    this.checkingBalance += amount;
                    this.addTransaction({ description: this.depositSource, amount: amount, account: 'checking', type: 'incoming' });
                } else {
                    this.savingsBalance += amount;
                    this.addTransaction({ description: this.depositSource, amount: amount, account: 'savings', type: 'incoming' });
                }
                this.txDate = new Date().toLocaleString();
                this.txId = this.generateTxId();
                this.showReceipt = true;
                this.fromAccount = this.depositSource;
                this.toAccount = this.depositToAccount === 'checking' ? this.checkingAccountNumber : this.savingsAccountNumber;
                this.lastTransactionAmount = amount; // Store the amount for the receipt
                this.depositAmount = ''; // Clear the form input
                this.saveToLocalStorage();
                this.showToast('success', 'Deposit Successful', `Deposited ${this.formatCurrency(amount)} to ${this.depositToAccount === 'checking' ? 'Checking' : 'Savings'}.`);
                this.isLoading = false;
            }, 1000);
        },

        addTransaction(transaction) {
            const txData = {
                id: this.generateTxId(),
                date: new Date().toISOString(),
                description: transaction.description,
                amount: transaction.amount,
                account: transaction.account,
                type: transaction.type
            };
            this.transactions.unshift(txData);
            this.saveToLocalStorage();
            return txData;
        },

        transferFunds() {
            const amount = parseFloat(this.transferAmount);
            if (!this.toAccount) {
                this.showToast('error', 'Missing Recipient', 'Please enter a recipient account or email.');
                return;
            }
            if (!amount || amount <= 0) {
                this.showToast('error', 'Invalid Amount', 'Please enter an amount greater than $0.00.');
                return;
            }
            let sourceAccount = this.fromAccount === this.checkingAccountNumber ? 'checking' : 'savings';
            let sourceBalance = sourceAccount === 'checking' ? this.checkingBalance : this.savingsBalance;
            if (amount > sourceBalance) {
                this.showToast('error', 'Insufficient Funds', `Insufficient funds in ${sourceAccount === 'checking' ? 'Checking' : 'Savings'}!`);
                return;
            }
            this.isLoading = true;
            setTimeout(() => {
                if (this.fraudDetected && amount > 1000) {
                    this.showServerError = true;
                    this.serverErrorMessage = 'Transfer flagged as potential fraud. Call 1-800-555-0123.';
                    this.isLoading = false;
                    return;
                }
                if (sourceAccount === 'checking') this.checkingBalance -= amount;
                else this.savingsBalance -= amount;
                this.txDate = new Date().toLocaleString();
                this.txId = this.generateTxId();
                this.showReceipt = true;
                this.lastTransactionAmount = amount; // Store the amount for the receipt
                this.addTransaction({ description: `Payment to ${this.toAccount}`, amount: -amount, account: sourceAccount, type: 'outgoing' });
                this.transferAmount = ''; // Clear the form input
                this.saveToLocalStorage();
                this.showToast('success', 'Payment Successful', `Sent ${this.formatCurrency(amount)} to ${this.toAccount}.`);
                this.isLoading = false;
            }, 1000);
        },

        transferBetweenAccounts() {
            const amount = parseFloat(this.internalTransferAmount);
            if (!amount || amount <= 0) {
                this.showToast('error', 'Invalid Amount', 'Please enter an amount greater than $0.00.');
                return;
            }
            let sourceBalance = this.internalFromAccount === 'checking' ? this.checkingBalance : this.savingsBalance;
            if (amount > sourceBalance) {
                this.showToast('error', 'Insufficient Funds', `Insufficient funds in ${this.internalFromAccount === 'checking' ? 'Checking' : 'Savings'}!`);
                return;
            }
            this.isLoading = true;
            setTimeout(() => {
                if (this.fraudDetected && amount > 2000) {
                    this.showServerError = true;
                    this.serverErrorMessage = 'Internal transfer flagged as suspicious. Contact 1-800-555-0123.';
                    this.isLoading = false;
                    return;
                }
                if (this.internalFromAccount === 'checking') {
                    this.checkingBalance -= amount;
                    this.savingsBalance += amount;
                } else {
                    this.savingsBalance -= amount;
                    this.checkingBalance += amount;
                }
                this.txDate = new Date().toLocaleString();
                this.txId = this.generateTxId();
                const fromAccountName = this.internalFromAccount === 'checking' ? 'Checking' : 'Savings';
                const toAccountName = this.internalToAccount === 'checking' ? 'Checking' : 'Savings';
                this.addTransaction({ description: `Transfer to ${toAccountName}`, amount: -amount, account: this.internalFromAccount, type: 'internal' });
                this.addTransaction({ description: `Transfer from ${fromAccountName}`, amount: amount, account: this.internalToAccount, type: 'internal' });
                this.lastTransactionAmount = amount; // Store the amount for the receipt
                this.internalTransferAmount = ''; // Clear the form input
                this.saveToLocalStorage();
                this.showToast('success', 'Transfer Successful', `Transferred ${this.formatCurrency(amount)} from ${fromAccountName} to ${toAccountName}.`);
                this.isLoading = false;
            }, 1000);
        },

        searchTransactions(query) {
            if (!query) {
                this.transactionFilter = 'all';
                this.showToast('info', 'Search Cleared', 'Showing all transactions.');
                return;
            }
            this.isLoading = true;
            setTimeout(() => {
                this.transactions = this.transactions.filter(tx =>
                    tx.description.toLowerCase().includes(query.toLowerCase()) ||
                    Math.abs(tx.amount).toString().includes(query)
                );
                this.showToast('info', 'Search Results', `Filtered transactions for "${query}".`);
                this.isLoading = false;
            }, 800);
        },

        toggleCardLock(index) {
            this.cards[index].isLocked = !this.cards[index].isLocked;
            this.saveToLocalStorage();
            this.showToast('success', 'Card Updated', `${this.cards[index].type === 'debit' ? 'Debit' : 'Credit'} card ${this.cards[index].isLocked ? 'locked' : 'unlocked'}.`);
        },

        orderNewCard() {
            this.isLoading = true;
            setTimeout(() => {
                if (this.fraudDetected) {
                    this.showServerError = true;
                    this.serverErrorMessage = 'Card order blocked due to security concerns. Call 1-800-555-0123.';
                    this.isLoading = false;
                    return;
                }
                this.addTransaction({ description: 'New Card Fee', amount: -5.00, account: this.activeAccount, type: 'outgoing' });
                this.showToast('success', 'Card Ordered', 'New card will arrive in 5-7 business days.');
                this.isLoading = false;
            }, 1000);
        },

        addNewCard() {
            this.isLoading = true;
            setTimeout(() => {
                if (this.fraudDetected) {
                    this.showServerError = true;
                    this.serverErrorMessage = 'New card addition blocked. Contact 1-800-555-0123.';
                    this.isLoading = false;
                    return;
                }
                const newCard = { type: 'debit', number: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`, expiry: '12/29', isLocked: false };
                this.cards.push(newCard);
                this.showToast('success', 'Card Added', 'New debit card linked to your account.');
                this.isLoading = false;
            }, 1000);
        },

        showToast(type, title, message, duration = 3000) {
            if (this.notificationTimer) clearTimeout(this.notificationTimer);
            this.notificationType = type;
            this.notificationTitle = title;
            this.notificationMessage = message;
            this.showNotification = true;
            this.notificationTimer = setTimeout(() => this.showNotification = false, duration);
        },

        triggerFraudDetection() {
            this.fraudDetected = true;
            this.showToast('warning', 'Fraud Alert', 'Suspicious activity detected!');
            setTimeout(() => this.fraudDetected = false, 10000);
        },

        triggerServerError(message) {
            this.showServerError = true;
            this.serverErrorMessage = message;
            this.showToast('error', 'Server Error', 'Something went wrong on our end.');
        },

        simulateDelay() {
            this.isLoading = true;
            setTimeout(() => {
                this.isLoading = false;
                this.showToast('info', 'Delay Simulated', 'Operation completed after intentional delay.');
            }, 3000);
        },

        closeServerError() {
            this.showServerError = false;
            this.serverErrorMessage = '';
        },

        addDemoTransactions() {
            const now = new Date();
            const demoTransactions = [
                { id: this.generateTxId(), date: new Date(now.setDate(now.getDate() - 1)).toISOString(), description: 'Coffee Shop', amount: -4.75, account: 'checking', type: 'outgoing' },
                { id: this.generateTxId(), date: new Date(now.setDate(now.getDate() - 1)).toISOString(), description: 'Lottery Winnings', amount: 25000.00, account: 'checking', type: 'incoming' }, // Big bait
                { id: this.generateTxId(), date: new Date(now.setDate(now.getDate() - 2)).toISOString(), description: 'Salary Deposit', amount: 2450.00, account: 'checking', type: 'incoming' },
                { id: this.generateTxId(), date: new Date(now.setDate(now.getDate() - 3)).toISOString(), description: 'Grocery Store', amount: -87.32, account: 'checking', type: 'outgoing' },
                { id: this.generateTxId(), date: new Date(now.setDate(now.getDate() - 4)).toISOString(), description: 'Crypto Payout', amount: 15000.00, account: 'savings', type: 'incoming' }, // More bait
            ];
            this.transactions = demoTransactions;
            this.saveToLocalStorage();
        },

        get activeActionTitle() {
            switch (this.currentAction) {
                case 'send': return 'Send Money';
                case 'deposit': return 'Deposit Funds';
                case 'transfer': return 'Transfer Between Accounts';
                case 'cards': return 'Manage Cards';
                default: return 'Send Money';
            }
        },

// Add this method in the methods section
getChartData() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Group transactions by day for the current month
    const dailyData = {};
    this.transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            const day = txDate.getDate();
            dailyData[day] = dailyData[day] || { income: 0, expenses: 0 };
            if (tx.amount > 0) dailyData[day].income += tx.amount;
            else dailyData[day].expenses += Math.abs(tx.amount);
        }
    });

    // Prepare data for Chart.js
    const labels = Object.keys(dailyData).map(day => `Day ${day}`);
    const incomeData = Object.values(dailyData).map(data => data.income);
    const expenseData = Object.values(dailyData).map(data => data.expenses);

    return {
        labels,
        datasets: [
            {
                label: 'Income',
                data: incomeData,
                backgroundColor: 'rgba(1, 162, 153, 0.5)', // Success color
                borderColor: '#01a299',
                borderWidth: 1
            },
            {
                label: 'Expenses',
                data: expenseData,
                backgroundColor: 'rgba(216, 30, 5, 0.5)', // Danger color
                borderColor: '#d81e05',
                borderWidth: 1
            }
        ]
    };
},

// Add this method to initialize the chart
initChart() {
    if (this.isLoading) return;
    this.isLoading = true;
    const delay = Math.random() * 1500 + 500; // 0.5-2s delay
    setTimeout(() => {
        if (this.fraudDetected) {
            this.showServerError = true;
            this.serverErrorMessage = 'Statistics access blocked due to suspicious activity. Call 1-800-555-0123.';
            this.isLoading = false;
            return;
        }

        const ctx = document.getElementById('statsChart').getContext('2d');
        if (this.chart) this.chart.destroy(); // Destroy existing chart if any
        this.chart = new Chart(ctx, {
            type: 'bar', // Can switch to 'line' if preferred
            data: this.getChartData(),
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Amount ($)' }
                    },
                    x: {
                        title: { display: true, text: 'Day of Month' }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Monthly Transaction Activity' }
                }
            }
        });

        this.showToast('success', 'Stats Loaded', 'Transaction graph updated.');
        this.isLoading = false;
    }, delay);
},

        viewAllTransactions() {
            if (this.fraudDetected) {
                this.showServerError = true;
                this.serverErrorMessage = 'Transaction history access blocked due to suspicious activity. Call 1-800-555-0123.';
                return;
            }
            this.transactionFilter = 'all';
            this.saveToLocalStorage();
            this.showToast('success', 'Full History Loaded', 'Now showing all transactions.');
        },

        get filteredTransactions() {
            if (this.transactionFilter === 'all') return this.transactions;
            return this.transactions.filter(tx => tx.account === this.transactionFilter);
        }
    }));
});