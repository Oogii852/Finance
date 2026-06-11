import { supabase } from './supabase.js'
const BADGES = {
    FIRST_TRANSACTION: {
        name: "Эхний Алхам",
        icon: "fa-shoe-prints"
    },
    FIRST_INCOME: {
        name: "Анхны Орлого",
        icon: "fa-money-bill-wave"
    },
    FIRST_EXPENSE: {
        name: "Анхны Худалдан Авалт",
        icon: "fa-cart-shopping"
    },
    FIRST_BUDGET: {
        name: "Төлөвлөгч",
        icon: "fa-bullseye"
    },
    BOOKKEEPER: {
        name: "Бүртгэлч",
        icon: "fa-book"
    },
    POSITIVE_BALANCE: {
        name: "Эерэг Баланс",
        icon: "fa-gem"
    },
    MONEY_MAKER: {
        name: "Мөнгө Ологч",
        icon: "fa-sack-dollar"
    },
    SAVINGS_MASTER: {
        name: "Хуримтлуулагч",
        icon: "fa-piggy-bank"
    },
    FINANCE_KING: {
        name: "Санхүүгийн Хаан",
        icon: "fa-crown"
    }
};

const transactionForm = document.getElementById('transaction-form');
const txTypeInput = document.getElementById('tx-type');
const txCategoryInput = document.getElementById('tx-category');
const txAmountInput = document.getElementById('tx-amount');
const txDateInput = document.getElementById('tx-date');
const txDescInput = document.getElementById('tx-desc');

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        window.location.href = 'index.html';
        return;
    }
    document.getElementById('user-email').textContent = user.email;
    
    // Анхны өгөгдлүүдийг зэрэг татаж ачаална
    await Promise.all([
        fetchTransactions(),
        fetchBadges(),
        fetchBudgets()
    ]);

    // Төсвийн Offcanvas нээгдэх үед
    document.getElementById('offcanvasBudget').addEventListener('show.bs.offcanvas', () => {
        fetchBudgets();
    });

    // Амжилтын Offcanvas нээгдэх үед датаг дахин шинэчилнэ
    document.getElementById('offcanvasBadges').addEventListener('show.bs.offcanvas', () => {
        fetchBadges();
    });
});

// Гүйлгээ нэмэх
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = txTypeInput.value;
    const category = txCategoryInput.value;
    const amount = parseFloat(txAmountInput.value);
    const date = txDateInput.value;
    const description = txDescInput.value;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
        alert("Сешн дууссан байна. Дахин нэвтэрнэ үү.");
        window.location.href = 'index.html';
        return;
    }

    // Зарлага бол төсөв хэтэрсэн эсэхийг шалгана
    if (type === 'expense') {
        const currentMonthYear = date.substring(0, 7);

        const { data: budgetData } = await supabase
            .from('budgets')
            .select('limit_amount')
            .eq('user_id', user.id)
            .eq('category', category)
            .eq('month_year', currentMonthYear)
            .maybeSingle();

        if (budgetData) {
            const limitAmount = budgetData.limit_amount;

            const { data: pastExpenses } = await supabase
                .from('transactions')
                .select('amount, date')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .eq('category', category);

            let totalPastExpense = 0;
            if (pastExpenses) {
                pastExpenses.forEach(tx => {
                    if (tx.date && tx.date.substring(0, 7) === currentMonthYear) {
                        totalPastExpense += tx.amount;
                    }
                });
            }

            if (totalPastExpense + amount > limitAmount) {
                const currentTotal = totalPastExpense + amount;
                const proceed = confirm(
                    `⚠️ ТӨСӨВ ХЭТРЭХ АНХААРУУЛГА!\n\n` +
                    `Ангилал: ${category}\n` +
                    `Тогтоосон хязгаар: ${limitAmount.toLocaleString()} ₮\n` +
                    `Одоогийн нийт зарцуулалт: ${currentTotal.toLocaleString()} ₮\n\n` +
                    `Төсөв хэтрүүлж гүйлгээг үргэлжлүүлэх үү?`
                );
                if (!proceed) return;
            }
        }
    }

    // Supabase руу хадгалах
    const { error } = await supabase
        .from('transactions')
        .insert([{
            user_id: user.id,
            type: type,
            category: category,
            amount: amount,
            description: description,
            date: date
        }]);

    if (error) {
        alert("Гүйлгээг хадгалахад алдаа гарлаа: " + error.message);
    } else {
        alert("Гүйлгээ амжилттай бүртгэгдлээ");
        transactionForm.reset();

        await checkBadges(user.id);
        await fetchTransactions();
        await fetchBadges();
    }
});

// Гүйлгээ устгах
window.deleteTransaction = async function(id) {
    const confirmDelete = confirm("Та энэ гүйлгээг устгахдаа итгэлтэй байна уу?");
    if (!confirmDelete) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        alert("Гүйлгээ амжилттай устгагдлаа.");
        
        await fetchTransactions();
        await checkBadges(user.id);
        await fetchBadges();
    } catch (error) {
        alert("Гүйлгээ устгахад алдаа гарлаа: " + error.message);
    }
}

// Гүйлгээнүүд татах
async function fetchTransactions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) {
        console.error("Гүйлгээ уншихад алдаа гарлаа:", error.message);
        return;
    }

    let totalIncome = 0;
    let totalExpense = 0;
    if (transactions) {
        transactions.forEach(tx => {
            if (tx.type === 'income') totalIncome += tx.amount;
            else if (tx.type === 'expense') totalExpense += tx.amount;
        });
    }

    const totalBalance = totalIncome - totalExpense;
    document.getElementById('total-balance').textContent = `${totalBalance.toLocaleString()} ₮`;
    document.getElementById('total-income').textContent = `${totalIncome.toLocaleString()} ₮`;
    document.getElementById('total-expense').textContent = `${totalExpense.toLocaleString()} ₮`;
    renderTransactions(transactions || []);
}

// Хүснэгтэд харуулах
function renderTransactions(transactions) {
    const listContainer = document.getElementById('transaction-list');

    if (transactions.length === 0) {
        listContainer.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fa-solid fa-folder-open fs-3 d-block mb-2"></i>
                    Одоогоор ямар нэгэн гүйлгээ бүртгэгдээгүй байна.
                </td>
            </tr>
        `;
        return;
    }

    let htmlContent = '';
    transactions.forEach(tx => {
        const isIncome = tx.type === 'income';
        const badgeColor = isIncome ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger';
        const typeText = isIncome ? 'Орлого' : 'Зарлага';
        const amountSign = isIncome ? '+' : '-';
        const amountColor = isIncome ? 'text-success' : 'text-danger';

        htmlContent += `
            <tr>
                <td>${tx.date}</td>
                <td><span class="badge bg-light text-dark shadow-sm border">${tx.category}</span></td>
                <td class="text-secondary fw-medium">${tx.description}</td>
                <td><span class="badge ${badgeColor}">${typeText}</span></td>
                <td class="text-end fw-bold ${amountColor}">${amountSign}${tx.amount.toLocaleString()} ₮</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteTransaction('${tx.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    listContainer.innerHTML = htmlContent;
}

// Гарах товч
document.getElementById('btn-logout').addEventListener('click', async () => {
    const confirmLogout = confirm("Та системээс гарахдаа итгэлтэй байна уу?");
    if (!confirmLogout) return;
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        alert("Системээс гарахад алдаа гарлаа: " + error.message);
    }
});

// Төсөв нэмэх форм
const budgetForm = document.getElementById('budget-form');
const budgetCategoryInput = document.getElementById('budget-category');
const budgetAmountInput = document.getElementById('budget-amount');
const budgetMonthInput = document.getElementById('budget-month');

budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = budgetCategoryInput.value;
    const limitAmount = parseFloat(budgetAmountInput.value);
    const monthYear = budgetMonthInput.value;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Сешн дууссан байна!");
        return;
    }

    const { error } = await supabase
        .from('budgets')
        .insert([{
            user_id: user.id,
            category: category,
            limit_amount: limitAmount,
            month_year: monthYear
        }]);

    if (error) {
        alert("Төсөв тогтооход алдаа гарлаа: " + error.message);
    } else {
        alert(`${monthYear} сарын "${category}" ангилалд төсөв амжилттай тогтоогдлоо!`);
        budgetForm.reset();
        const instance = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasBudget'));
        if (instance) instance.hide();
        
        await checkBadges(user.id);
        await fetchBadges();
        fetchBudgets();
    }
});

// Төсвүүд татах
async function fetchBudgets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month_year', { ascending: false });

    if (error) {
        console.error("Төсөв уншихад алдаа гарлаа:", error.message);
        return;
    }

    const budgetsContainer = document.getElementById('current-budgets-list');

    if (!budgets || budgets.length === 0) {
        budgetsContainer.innerHTML = `
            <h6 class="fw-bold text-dark mb-3">Одоогийн тогтоосон төсвүүд:</h6>
            <div class="text-center py-3 text-muted small bg-light rounded">Одоогоор төсөв тогтоогоогүй байна.</div>
        `;
        return;
    }

    let htmlContent = `<h6 class="fw-bold text-dark mb-3">Одоогийн тогтоосон төсвүүд:</h6>`;
    budgets.forEach(b => {
        htmlContent += `
            <div class="card p-2 mb-2 bg-light border-0 shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold small text-dark">${b.category}</span>
                        <span class="text-muted mx-1">•</span>
                        <span class="small text-secondary">${b.month_year}</span>
                    </div>
                    <span class="fw-bold text-primary small">${b.limit_amount.toLocaleString()} ₮</span>
                </div>
            </div>
        `;
    });
    budgetsContainer.innerHTML = htmlContent;
}

// Амжилт олгох функц
async function awardBadge(userId, badge) {
    const { data: existing } = await supabase
        .from('badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_name', badge.name)
        .maybeSingle();

    if (existing) return;

    const { error } = await supabase
        .from('badges')
        .insert([{
            user_id: userId,
            badge_name: badge.name,
            badge_icon: badge.icon
        }]);

    if (!error) {
        alert(`🏆 Achievement Unlocked!\n\n${badge.name}`);
    }
}

// Нөхцөл шалгах функц
async function checkBadges(userId) {
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

    const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId);

    const txList = transactions || [];
    const budgetList = budgets || [];

    let totalIncome = 0;
    let totalExpense = 0;

    txList.forEach(tx => {
        if (tx.type === 'income') totalIncome += tx.amount;
        if (tx.type === 'expense') totalExpense += tx.amount;
    });

    const balance = totalIncome - totalExpense;

    if (txList.length >= 1) await awardBadge(userId, BADGES.FIRST_TRANSACTION);
    if (txList.some(t => t.type === 'income')) await awardBadge(userId, BADGES.FIRST_INCOME);
    if (txList.some(t => t.type === 'expense')) await awardBadge(userId, BADGES.FIRST_EXPENSE);
    if (budgetList.length >= 1) await awardBadge(userId, BADGES.FIRST_BUDGET);
    if (balance >= 100000) await awardBadge(userId, BADGES.POSITIVE_BALANCE);
    if (balance >= 1000000) await awardBadge(userId, BADGES.SAVINGS_MASTER);
}

// Баазаас амжилтуудыг татаж Offcanvas дотор зурах функц
// Баазаас амжилтуудыг татаж Offcanvas дотор зурах функц
async function fetchBadges() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .eq('user_id', user.id);

    const container = document.getElementById('badges-container');
    if (!container) return;

    if (!badges || badges.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-4 small w-100"><i class="fa-solid fa-lock fs-3 d-block mb-2"></i>Одоогоор амжилтын тэмдэг аваагүй байна.</div>';
        return;
    }

    let html = '';
    badges.forEach(function(b) {
        const iconVal = b.badge_icon || b.icon || '';
        const icon = iconVal.startsWith('fa-') ? iconVal : 'fa-' + iconVal;
        html += '<div class="card border-0 shadow-sm text-center p-3 align-items-center justify-content-center bg-white" style="width:130px;border-radius:12px;min-height:110px;">';
        html += '<div class="p-3 bg-warning-subtle rounded-circle mb-2 d-flex align-items-center justify-content-center" style="width:56px;height:56px;">';
        html += '<i class="fa-solid ' + icon + ' fa-lg text-warning"></i>';
        html += '</div>';
        html += '<div class="fw-bold text-dark" style="font-size:0.78rem;line-height:1.3;">' + b.badge_name + '</div>';
        html += '</div>';
    });
    container.innerHTML = html;
}