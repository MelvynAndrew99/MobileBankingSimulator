// Alpine.js Banking App
document.addEventListener('alpine:init', () => {
    Alpine.data('bankApp', () => ({
        // App state
        userName: localStorage.getItem('userName') || 'Alex Johnson',

        // Account Balances
        checkingBalance: parseFloat(localStorage.getItem('checkingBalance')) || 5240.75,
        savingsBalance: parseFloat(localStorage.getItem('savingsBalance')) || 2500.00,

        // Account Numbers
        checkingAccountNumber: localStorage.getItem('checkingAccountNumber') || 'Checking •••• 4567',
        savingsAccountNumber: localStorage.getItem('savingsAccountNumber') || 'Savings •••• 7890',

        // Active account tracking
        activeAccount: localStorage.getItem('activeAccount') || 'checking',

        // Transaction history
        transactions: JSON.parse(localStorage.getItem('transactions')) || [],

        // External transfer fields
        fromAccount: '',
        toAccount: '',
        transferAmount: '',

        // Internal transfer fields
        internalFromAccount: 'checking',
        internalToAccount: 'savings',
        internalTransferAmount: '',

        // Deposit fields
        depositToAccount: 'checking',
        depositAmount: '',
        depositSource: 'Cash Deposit',

        // Active action (what form is showing)
        currentAction: localStorage.getItem('currentAction') || 'send',

        // Transaction filters
        transactionFilter: 'all',

        // Transaction receipt
        showReceipt: false,
        txDate: '',
        txId: '',

        // Modal state
        showEditModal: false,
        editModalTitle: '',
        editValue: '',
        editTarget: '', // Tracks which field is being edited

      // Notification state
      showNotification: false,
      notificationType: 'success', // 'success', 'error', or 'info'
      notificationTitle: '',
      notificationMessage: '',
      notificationTimer: null,

        // Navigation
        currentNav: 'home',
        navItems: [
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'payments', icon: '💸', label: 'Payments' },
            { id: 'stats', icon: '📊', label: 'Stats' },
            { id: 'settings', icon: '⚙️', label: 'Settings' }
        ],

        // Quick actions
        quickActions: [
            { id: 'send', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Send' },
            { id: 'deposit', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M12 20L18 14M12 20L6 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Deposit' },
            { id: 'transfer', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', label: 'Transfer' },
            { id: 'cards', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="2"/><path d="M2 10H22" stroke="currentColor" stroke-width="2"/></svg>', label: 'Cards' }
			],
// Initialize app
        init() {
            this.fromAccount = this.checkingAccountNumber;
            this.loadFromLocalStorage();

            // Watch for account changes and update from account
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

            // Add some demo transactions if none exist
            if (this.transactions.length === 0) {
                this.addDemoTransactions();
            }

            // Save current action to localStorage whenever it changes
            this.$watch('currentAction', (value) => {
                localStorage.setItem('currentAction', value);
            });
        },

        // Local Storage Management
        loadFromLocalStorage() {
            // Load saved data from localStorage
            this.userName = localStorage.getItem('userName') || this.userName;
            this.checkingBalance = parseFloat(localStorage.getItem('checkingBalance')) || this.checkingBalance;
            this.savingsBalance = parseFloat(localStorage.getItem('savingsBalance')) || this.savingsBalance;
            this.checkingAccountNumber = localStorage.getItem('checkingAccountNumber') || this.checkingAccountNumber;
            this.savingsAccountNumber = localStorage.getItem('savingsAccountNumber') || this.savingsAccountNumber;
            this.activeAccount = localStorage.getItem('activeAccount') || this.activeAccount;
            this.transactions = JSON.parse(localStorage.getItem('transactions')) || this.transactions;
            this.currentAction = localStorage.getItem('currentAction') || this.currentAction;
            this.transactionFilter = localStorage.getItem('transactionFilter') || 'all';

            // Set from account based on active account
            if (this.activeAccount === 'checking') {
                this.fromAccount = this.checkingAccountNumber;
            } else {
                this.fromAccount = this.savingsAccountNumber;
            }
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
        },

        // Helper Functions
        formatCurrency(amount) {
            return '$' + parseFloat(amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
			},
// Get the title for the current active action
        get activeActionTitle() {
            switch(this.currentAction) {
                case 'send': return 'Send Money';
                case 'deposit': return 'Deposit Funds';
                case 'transfer': return 'Transfer Between Accounts';
                case 'cards': return 'Manage Cards';
                default: return 'Send Money';
            }
        },

        // Transaction filtering
        get filteredTransactions() {
            if (this.transactionFilter === 'all') {
                return this.transactions;
            }
            return this.transactions.filter(tx => tx.account === this.transactionFilter);
        },

        generateTxId() {
            const chars = '0123456789ABCDEF';
            let txid = '';
            for (let i = 0; i < 16; i++) {
                txid += chars[Math.floor(Math.random() * chars.length)];
            }
            return txid;
        },

        copyToClipboard(text) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    alert('Account number copied to clipboard!');
                })
                .catch(err => {
                    alert('Failed to copy: ' + err);
                });
        },

        // Account Management
        setActiveAccount(account) {
            this.activeAccount = account;
        },

        // Set active action (what form is displayed)
        setActiveAction(actionId) {
            this.currentAction = actionId;
        },

        // Modal and Edit Functions
        editUserName() {
            this.editModalTitle = 'Edit Your Name';
            this.editValue = this.userName;
            this.editTarget = 'userName';
            this.showEditModal = true;

            // Focus the input after the modal is shown
            setTimeout(() => {
                this.$refs.editInput.focus();
            }, 100);
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

            setTimeout(() => {
                this.$refs.editInput.focus();
            }, 100);
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

            setTimeout(() => {
                this.$refs.editInput.focus();
            }, 100);
        },

        saveEdit() {
            if (this.editTarget === 'userName') {
                this.userName = this.editValue || 'Alex Johnson';
            } else if (this.editTarget === 'checkingBalance') {
                this.checkingBalance = parseFloat(this.editValue) || 0;
            } else if (this.editTarget === 'savingsBalance') {
                this.savingsBalance = parseFloat(this.editValue) || 0;
            } else if (this.editTarget === 'checkingAccountNumber') {
                this.checkingAccountNumber = this.editValue || 'Checking •••• 4567';
                if (this.activeAccount === 'checking') {
                    this.fromAccount = this.checkingAccountNumber;
                }
            } else if (this.editTarget === 'savingsAccountNumber') {
                this.savingsAccountNumber = this.editValue || 'Savings •••• 7890';
                if (this.activeAccount === 'savings') {
                    this.fromAccount = this.savingsAccountNumber;
                }
            }

            this.saveToLocalStorage();
            this.showEditModal = false;
        },

        cancelEdit() {
            this.showEditModal = false;
        },

        // Make a deposit
        makeDeposit() {
            const amount = parseFloat(this.depositAmount);

            // Validation
            if (!amount || amount <= 0) {
                alert('Please enter an amount greater than $0.00.');
                return;
            }

            // Process deposit
            if (this.depositToAccount === 'checking') {
                this.checkingBalance += amount;

                // Record the transaction
                this.addTransaction({
                    description: this.depositSource,
                    amount: amount,
                    account: 'checking',
                    type: 'incoming'
                });
            } else {
                this.savingsBalance += amount;

                // Record the transaction
                this.addTransaction({
                    description: this.depositSource,
                    amount: amount,
                    account: 'savings',
                    type: 'incoming'
                });
            }

            // Reset form and show receipt
            this.txDate = new Date().toLocaleString();
            this.txId = this.generateTxId();
            this.showReceipt = true;
            this.fromAccount = this.depositSource;
            this.toAccount = this.depositToAccount === 'checking' ? this.checkingAccountNumber : this.savingsAccountNumber;
            this.transferAmount = amount;

            // Reset deposit amount
            this.depositAmount = '';

            // Save changes
            this.saveToLocalStorage();

            // Show notification
            this.showToast(
                'success',
                'Deposit Successful',
                `Successfully deposited ${this.formatCurrency(amount)} to your ${this.depositToAccount === 'checking' ? 'Checking' : 'Savings'} account.`
);
			},
// Add transaction and update balances
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

        // Transfer Functions
        transferFunds() {
            const amount = parseFloat(this.transferAmount);

            // Validation
            if (!this.toAccount) {
                alert('Please enter a recipient account or email.');
                return;
            }

            if (!amount || amount <= 0) {
                alert('Please enter an amount greater than $0.00.');
                return;
            }

            // Check if we have enough funds in the selected account
            let sourceAccount = this.fromAccount === this.checkingAccountNumber ? 'checking' : 'savings';
            let sourceBalance = sourceAccount === 'checking' ? this.checkingBalance : this.savingsBalance;

            if (amount > sourceBalance) {
                alert(`Insufficient funds in ${sourceAccount === 'checking' ? 'Checking' : 'Savings'} account!`);
                return;
            }

            // Process transfer
            if (sourceAccount === 'checking') {
                this.checkingBalance -= amount;
            } else {
                this.savingsBalance -= amount;
            }

            this.txDate = new Date().toLocaleString();
            this.txId = this.generateTxId();
            this.showReceipt = true;

            // Record the transaction - use "Payment to" instead of "Transfer to"
            this.addTransaction({
                description: `Payment to ${this.toAccount}`,
                amount: -amount,
                account: sourceAccount,
                type: 'outgoing'
            });

            // Reset form
            this.transferAmount = '';

            // Save changes
            this.saveToLocalStorage();

            // Show notification
            this.showToast(
                'success',
                'Payment Successful',
                `Successfully sent ${this.formatCurrency(amount)} to ${this.toAccount}.`
);
        },

        transferBetweenAccounts() {
            const amount = parseFloat(this.internalTransferAmount);

            // Validation
            if (!amount || amount <= 0) {
                alert('Please enter an amount greater than $0.00.');
                return;
            }

            // Check if we have enough funds in the source account
            let sourceBalance = this.internalFromAccount === 'checking' ? this.checkingBalance : this.savingsBalance;

            if (amount > sourceBalance) {
                alert(`Insufficient funds in ${this.internalFromAccount === 'checking' ? 'Checking' : 'Savings'} account!`);
                return;
            }

            // Process transfer
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

            // Record the outgoing transaction
            this.addTransaction({
                description: `Transfer to ${toAccountName}`,
                amount: -amount,
                account: this.internalFromAccount,
                type: 'internal'
            });

            // Record the incoming transaction
            this.addTransaction({
                description: `Transfer from ${fromAccountName}`,
                amount: amount,
                account: this.internalToAccount,
                type: 'internal'
            });

            // Reset form
            this.internalTransferAmount = '';

            // Save changes
            this.saveToLocalStorage();

            // Show notification
            this.showToast(
              'success',
              'Payment Successful',
              `Successfully transferred ${this.formatCurrency(amount)} from ${fromAccountName} to ${toAccountName}.`
);
			},

        // Show toast notification
        showToast(type, title, message, duration = 3000) {
            // Clear any existing timer
            if (this.notificationTimer) {
                clearTimeout(this.notificationTimer);
            }

            // Set notification properties
            this.notificationType = type;
            this.notificationTitle = title;
            this.notificationMessage = message;
            this.showNotification = true;

            // Auto-hide after duration
            this.notificationTimer = setTimeout(() => {
                this.showNotification = false;
            }, duration);
        },

        // Demo data generator
        addDemoTransactions() {
            const now = new Date();

            const demoTransactions = [
                // Checking account transactions
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 1)).toISOString(),
                    description: 'Coffee Shop',
                    amount: -4.75,
                    account: 'checking',
                    type: 'outgoing'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 1)).toISOString(),
                    description: 'Amazon Purchase',
                    amount: -29.99,
                    account: 'checking',
                    type: 'outgoing'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 2)).toISOString(),
                    description: 'Salary Deposit',
                    amount: 2450.00,
                    account: 'checking',
                    type: 'incoming'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 3)).toISOString(),
                    description: 'Grocery Store',
                    amount: -87.32,
                    account: 'checking',
                    type: 'outgoing'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 5)).toISOString(),
                    description: 'Venmo from John',
                    amount: 25.00,
                    account: 'checking',
                    type: 'incoming'
					},
         // Savings account transactions
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 4)).toISOString(),
                    description: 'Interest Payment',
                    amount: 15.25,
                    account: 'savings',
                    type: 'incoming'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 6)).toISOString(),
                    description: 'Bonus Deposit',
                    amount: 500.00,
                    account: 'savings',
                    type: 'incoming'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 7)).toISOString(),
                    description: 'Transfer to Checking',
                    amount: -200.00,
                    account: 'savings',
                    type: 'internal'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 7)).toISOString(),
                    description: 'Transfer from Savings',
                    amount: 200.00,
                    account: 'checking',
                    type: 'internal'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 9)).toISOString(),
                    description: 'Monthly Savings',
                    amount: 300.00,
                    account: 'savings',
                    type: 'incoming'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 12)).toISOString(),
                    description: 'Vacation Fund',
                    amount: 150.00,
                    account: 'savings',
                    type: 'incoming'
                },
                {
                    id: this.generateTxId(),
                    date: new Date(now.setDate(now.getDate() - 15)).toISOString(),
                    description: 'Savings Deposit',
                    amount: 500.00,
                    account: 'savings',
                    type: 'incoming'
                }
            ];

            this.transactions = demoTransactions;
            this.saveToLocalStorage();
			},

        // Navigation Functions
        setActiveNav(navId) {
            this.currentNav = navId;
            alert(`You clicked on ${navId}`);
        }
    }));
});