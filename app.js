import { db } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, limit, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Helper to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// Helper to format date
const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
};

// PAGE SPECIFIC LOGIC
const path = window.location.pathname;
const isDashboard = path.endsWith('index.html') || path === '/' || path.endsWith('/');
const isDonations = path.endsWith('donations.html');
const isExpenses = path.endsWith('expenses.html');

// --- DASHBOARD: LISTEN FOR TOTALS ---
if (isDashboard) {
    let donationTotal = 0;
    let expenseTotal = 0;
    let allDonations = [];
    let allExpenses = [];

    // Skeleton Loaders
    const list = document.getElementById('recent-activity-list');
    if (list) {
        list.innerHTML = `
            <div class="data-item">
                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 16px;"></div>
                <div style="flex: 1;">
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
            <div class="data-item">
                <div class="skeleton" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 16px;"></div>
                <div style="flex: 1;">
                    <div class="skeleton skeleton-text short"></div>
                    <div class="skeleton skeleton-text"></div>
                </div>
            </div>
        `;
    }

    const updateDashboard = () => {
        const totalDonationsEl = document.getElementById('total-donations');
        const totalExpensesEl = document.getElementById('total-expenses');
        const netBalanceEl = document.getElementById('net-balance');

        if (totalDonationsEl) totalDonationsEl.textContent = formatCurrency(donationTotal);
        if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(expenseTotal);

        const balance = donationTotal - expenseTotal;
        if (netBalanceEl) {
            netBalanceEl.textContent = formatCurrency(balance);
            netBalanceEl.className = `stats-value ${balance >= 0 ? 'text-success' : 'text-danger'}`;
        }
    };

    const refreshRecentActivity = () => {
        const combined = [...allDonations, ...allExpenses];
        combined.sort((a, b) => b.date.seconds - a.date.seconds);
        updateRecentActivity(combined);
    };

    // Listen to Donations
    onSnapshot(collection(db, "donations"), (snapshot) => {
        donationTotal = 0;
        allDonations = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            donationTotal += Number(data.amount);
            allDonations.push({ ...data, type: 'donation', date: data.date });
        });
        updateDashboard();
        refreshRecentActivity();
    });

    // Listen to Expenses
    onSnapshot(collection(db, "expenses"), (snapshot) => {
        expenseTotal = 0;
        allExpenses = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            expenseTotal += Number(data.amount);
            allExpenses.push({ ...data, type: 'expense', date: data.date });
        });
        updateDashboard();
        refreshRecentActivity();
    });
}

function updateRecentActivity(activities) {
    const list = document.getElementById('recent-activity-list');
    if (!list) return;

    const recent = activities.slice(0, 10);

    if (recent.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px;">No recent activity found.</p>';
        return;
    }

    list.innerHTML = '';

    recent.forEach(item => {
        const isDonation = item.type === 'donation';
        const colorClass = isDonation ? 'text-success' : 'text-danger';
        const sign = isDonation ? '+' : '-';
        const icon = isDonation ? '💰' : '💸';
        const iconClass = isDonation ? 'donation' : 'expense';
        const title = isDonation ? (item.donorName || 'Anonymous') : item.description;
        const subtitle = isDonation ? 'Donation' : (item.category || 'Expense');

        const div = document.createElement('div');
        div.className = 'data-item';
        div.innerHTML = `
            <div class="item-icon ${iconClass}">
                ${icon}
            </div>
            <div class="item-content">
                <div style="font-weight: 600; color: var(--text-main); font-size: 1.05rem;">${title}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${subtitle} • ${formatDate(item.date)}</div>
            </div>
            <div class="item-amount ${colorClass}">${sign}${formatCurrency(item.amount)}</div>
        `;
        list.appendChild(div);
    });
}

// --- DONATIONS PAGE ---
if (isDonations) {
    const form = document.getElementById('donation-form');
    // Handle Form Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const donorName = document.getElementById('donorName').value;
            const amount = Number(document.getElementById('amount').value);
            const notes = document.getElementById('notes').value;

            try {
                await addDoc(collection(db, "donations"), {
                    donorName,
                    amount,
                    notes,
                    date: Timestamp.now()
                });
                form.reset();
                alert("Donation recorded successfully!");
            } catch (err) {
                console.error("Error adding donation: ", err);
                alert("Error recording donation. See console.");
            }
        });
    }

    // Listen and Render List
    const listContainer = document.getElementById('donations-list');
    if (listContainer) {
        const q = query(collection(db, "donations"), orderBy("date", "desc"), limit(20));
        onSnapshot(q, (snapshot) => {
            listContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = 'data-item';
                div.innerHTML = `
                    <div>
                        <div style="font-weight: 600;">${data.donorName}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${data.notes || ''}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--success);">${formatCurrency(data.amount)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${formatDate(data.date)}</div>
                    </div>
                `;
                listContainer.appendChild(div);
            });
        });
    }
}

// --- EXPENSES PAGE ---
if (isExpenses) {
    const form = document.getElementById('expense-form');
    // Handle Form Submit
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const description = document.getElementById('description').value;
            const amount = Number(document.getElementById('amount').value);
            const category = document.getElementById('category').value;

            try {
                await addDoc(collection(db, "expenses"), {
                    description,
                    amount,
                    category,
                    date: Timestamp.now()
                });
                form.reset();
                alert("Expense recorded successfully!");
            } catch (err) {
                console.error("Error adding expense: ", err);
                alert("Error recording expense. See console.");
            }
        });
    }

    // Listen and Render List
    const listContainer = document.getElementById('expenses-list');
    if (listContainer) {
        const q = query(collection(db, "expenses"), orderBy("date", "desc"), limit(20));
        onSnapshot(q, (snapshot) => {
            listContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = 'data-item';
                div.innerHTML = `
                    <div>
                        <div style="font-weight: 600;">${data.description}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${data.category}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--danger);">${formatCurrency(data.amount)}</div>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">${formatDate(data.date)}</div>
                    </div>
                `;
                listContainer.appendChild(div);
            });
        });
    }
}
