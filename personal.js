let transactions = [];
let budgets = [];

window.onload = function() {

    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark");
    }

    let dateInput = document.getElementById("date");

    if (dateInput) {
        dateInput.value =
            new Date().toISOString().split("T")[0];
    }

    localStorage.removeItem("isLoggedIn");

    showLogin();

    let monthFilter =
        document.getElementById("monthFilter");

    if (monthFilter) {
        monthFilter.addEventListener(
            "change",
            updateDashboard
        );
    }
};


// ================= LOGIN PAGE =================

function showLogin() {

    document.getElementById("loginPage")
        .classList.remove("hidden");

    document.getElementById("signupPage")
        .classList.add("hidden");

    document.getElementById("dashboardPage")
        .classList.add("hidden");

    document.getElementById("loginPage")
        .style.display = "flex";

    document.getElementById("signupPage")
        .style.display = "none";

    document.getElementById("dashboardPage")
        .style.display = "none";
}


// ================= SIGNUP PAGE =================

function showSignup() {

    document.getElementById("loginPage")
        .classList.add("hidden");

    document.getElementById("signupPage")
        .classList.remove("hidden");

    document.getElementById("dashboardPage")
        .classList.add("hidden");

    document.getElementById("loginPage")
        .style.display = "none";

    document.getElementById("signupPage")
        .style.display = "flex";

    document.getElementById("dashboardPage")
        .style.display = "none";
}


// ================= SIGNUP =================

async function signup() {

    let name =
        document.getElementById("signupName")
        .value.trim();

    let email =
        document.getElementById("signupEmail")
        .value.trim();

    let password =
        document.getElementById("signupPassword")
        .value;

    if (
        name === "" ||
        email === "" ||
        password === ""
    ) {

        alert("Please fill all details.");
        return;
    }

    let data =
        "name=" + encodeURIComponent(name) +
        "&email=" + encodeURIComponent(email) +
        "&password=" + encodeURIComponent(password);

    try {

        let response =
            await fetch(
                "http://localhost:8080/api/signup",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: data
                }
            );

        let result =
            await response.text();

        if (response.ok) {

            alert(result);

            localStorage.setItem(
                "userName",
                name
            );

            localStorage.setItem(
                "userEmail",
                email
            );

            document.getElementById(
                "signupName"
            ).value = "";

            document.getElementById(
                "signupEmail"
            ).value = "";

            document.getElementById(
                "signupPassword"
            ).value = "";

            showLogin();

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ================= LOGIN =================

async function login() {

    let email =
        document.getElementById("loginEmail")
        .value.trim();

    let password =
        document.getElementById("loginPassword")
        .value;

    if (
        email === "" ||
        password === ""
    ) {

        alert(
            "Please enter email and password."
        );

        return;
    }

    let data =
        "email=" + encodeURIComponent(email) +
        "&password=" + encodeURIComponent(password);

    try {

        let response =
            await fetch(
                "http://localhost:8080/api/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: data
                }
            );

        let result =
            await response.text();

        if (response.ok) {

            let parts =
                result.split("|");

            let userId =
                parts[1];

            let name =
                parts[2];

            localStorage.setItem(
                "isLoggedIn",
                "true"
            );

            localStorage.setItem(
                "userId",
                userId
            );

            localStorage.setItem(
                "userName",
                name
            );

            localStorage.setItem(
                "userEmail",
                email
            );

            await loadTransactions();

            await loadBudgets();

            showDashboard();

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ================= DASHBOARD =================

function showDashboard() {

    document.getElementById("loginPage")
        .classList.add("hidden");

    document.getElementById("signupPage")
        .classList.add("hidden");

    document.getElementById("dashboardPage")
        .classList.remove("hidden");

    document.getElementById("loginPage")
        .style.display = "none";

    document.getElementById("signupPage")
        .style.display = "none";

    document.getElementById("dashboardPage")
        .style.display = "block";


    // Make Dashboard visible
    document.getElementById("dashboardSection")
        .classList.remove("hidden");

    document.getElementById("dashboardSection")
        .style.display = "block";


    // Hide other sections
    document.getElementById("transactionsSection")
        .classList.add("hidden");

    document.getElementById("transactionsSection")
        .style.display = "none";

    document.getElementById("budgetSection")
        .classList.add("hidden");

    document.getElementById("budgetSection")
        .style.display = "none";

    document.getElementById("reportsSection")
        .classList.add("hidden");

    document.getElementById("reportsSection")
        .style.display = "none";

    document.getElementById("settingsSection")
        .classList.add("hidden");

    document.getElementById("settingsSection")
        .style.display = "none";


    let name =
        localStorage.getItem("userName") ||
        "User";

    let email =
        localStorage.getItem("userEmail") ||
        "";


    let userName =
        document.getElementById("userName");

    let profileName =
        document.getElementById("profileName");

    let settingsName =
        document.getElementById("settingsName");

    let settingsEmail =
        document.getElementById("settingsEmail");


    if (userName) {

        userName.textContent =
            name;
    }

    if (profileName) {

        profileName.textContent =
            name.charAt(0).toUpperCase();
    }

    if (settingsName) {

        settingsName.textContent =
            name;
    }

    if (settingsEmail) {

        settingsEmail.textContent =
            email;
    }


    updateDashboard();

    displayTransactions();

    displayRecentTransactions();

    displayBudgets();
}


// ================= LOGOUT =================

function logout() {

    localStorage.removeItem(
        "isLoggedIn"
    );

    localStorage.removeItem(
        "userId"
    );

    transactions = [];

    budgets = [];

    showLogin();

    document.getElementById(
        "loginEmail"
    ).value = "";

    document.getElementById(
        "loginPassword"
    ).value = "";
}


// ================= LOAD TRANSACTIONS =================

async function loadTransactions() {

    let userId =
        localStorage.getItem("userId");

    if (!userId) {

        transactions = [];

        return;
    }

    try {

        let response =
            await fetch(
                "http://localhost:8080/api/transactions?user_id=" +
                userId
            );

        if (response.ok) {

            transactions =
                await response.json();

        } else {

            transactions = [];

            alert(
                await response.text()
            );
        }

    } catch (error) {

        transactions = [];

        alert(
            "Cannot load transactions from database."
        );

        console.log(error);
    }
}


// ================= LOAD BUDGETS =================

async function loadBudgets() {

    let userId =
        localStorage.getItem("userId");

    if (!userId) {

        budgets = [];

        return;
    }

    try {

        let response =
            await fetch(
                "http://localhost:8080/api/budgets?user_id=" +
                userId
            );

        if (response.ok) {

            budgets =
                await response.json();

        } else {

            budgets = [];

            alert(
                await response.text()
            );
        }

    } catch (error) {

        budgets = [];

        alert(
            "Cannot load budgets from database."
        );

        console.log(error);
    }
}


// ================= SHOW SECTION =================

function showSection(section) {

    let sections = [
        "dashboard",
        "transactions",
        "budget",
        "reports",
        "settings"
    ];


    sections.forEach(function(item) {

        let element =
            document.getElementById(
                item + "Section"
            );

        if (element) {

            if (item === section) {

                element.classList.remove("hidden");

                element.style.display =
                    "block";

            } else {

                element.classList.add("hidden");

                element.style.display =
                    "none";
            }
        }
    });


    if (section === "dashboard") {

        updateDashboard();
    }


    if (section === "transactions") {

        displayTransactions();
    }


    if (section === "budget") {

        displayBudgets();
    }


    if (section === "reports") {

        updateReports();
    }
}


// ================= ADD TRANSACTION =================

async function addTransaction() {

    let description =
        document.getElementById(
            "description"
        ).value.trim();

    let amount =
        Number(
            document.getElementById(
                "amount"
            ).value
        );

    let type =
        document.getElementById(
            "transactionType"
        ).value;

    let category =
        document.getElementById(
            "category"
        ).value;

    let date =
        document.getElementById(
            "date"
        ).value;

    let userId =
        localStorage.getItem("userId");


    if (
        description === "" ||
        amount <= 0 ||
        date === ""
    ) {

        alert(
            "Please enter valid transaction details."
        );

        return;
    }


    if (!userId) {

        alert(
            "Please login first."
        );

        return;
    }


    let data =
        "user_id=" +
        encodeURIComponent(userId) +

        "&description=" +
        encodeURIComponent(description) +

        "&amount=" +
        encodeURIComponent(amount) +

        "&type=" +
        encodeURIComponent(type) +

        "&category=" +
        encodeURIComponent(category) +

        "&date=" +
        encodeURIComponent(date);


    try {

        let response =
            await fetch(
                "http://localhost:8080/api/transactions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: data
                }
            );


        let result =
            await response.text();


        if (response.ok) {

            document.getElementById(
                "description"
            ).value = "";

            document.getElementById(
                "amount"
            ).value = "";


            let message =
                document.getElementById(
                    "transactionMessage"
                );


            if (message) {

                message.textContent =
                    result;
            }


            await loadTransactions();

            updateDashboard();

            displayTransactions();

            displayRecentTransactions();

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ================= FILTER TRANSACTIONS =================

function getFilteredTransactions() {

    let filter =
        document.getElementById(
            "monthFilter"
        )?.value ||
        "This Month";


    let now =
        new Date();


    return transactions.filter(
        function(transaction) {

            let date =
                new Date(transaction.date);


            if (filter === "All") {

                return true;
            }


            if (filter === "This Month") {

                return (
                    date.getMonth() ===
                    now.getMonth() &&

                    date.getFullYear() ===
                    now.getFullYear()
                );
            }


            if (filter === "Last Month") {

                let lastMonth =
                    new Date(
                        now.getFullYear(),
                        now.getMonth() - 1,
                        1
                    );


                return (
                    date.getMonth() ===
                    lastMonth.getMonth() &&

                    date.getFullYear() ===
                    lastMonth.getFullYear()
                );
            }


            if (filter === "This Year") {

                return (
                    date.getFullYear() ===
                    now.getFullYear()
                );
            }


            return true;
        }
    );
}


// ================= UPDATE DASHBOARD =================

function updateDashboard() {

    let filtered =
        getFilteredTransactions();


    let income = 0;

    let expense = 0;


    filtered.forEach(
        function(transaction) {

            if (
                transaction.type ===
                "Income"
            ) {

                income +=
                    Number(
                        transaction.amount
                    );

            } else {

                expense +=
                    Number(
                        transaction.amount
                    );
            }
        }
    );


    let balance =
        income - expense;


    let totalIncome =
        document.getElementById(
            "totalIncome"
        );

    let totalExpense =
        document.getElementById(
            "totalExpense"
        );

    let balanceElement =
        document.getElementById(
            "balance"
        );


    if (totalIncome) {

        totalIncome.textContent =
            "₹" +
            income.toFixed(2);
    }


    if (totalExpense) {

        totalExpense.textContent =
            "₹" +
            expense.toFixed(2);
    }


    if (balanceElement) {

        balanceElement.textContent =
            "₹" +
            balance.toFixed(2);
    }


    updateExpenseOverview(
        filtered
    );


    updateChart(
        income,
        expense
    );


    displayRecentTransactions();
}


// ================= EXPENSE OVERVIEW =================

function updateExpenseOverview(data) {

    let overview =
        document.getElementById(
            "expenseOverview"
        );


    if (!overview) {

        return;
    }


    let categories = {};


    data.forEach(
        function(transaction) {

            if (
                transaction.type ===
                "Expense"
            ) {

                if (
                    !categories[
                        transaction.category
                    ]
                ) {

                    categories[
                        transaction.category
                    ] = 0;
                }


                categories[
                    transaction.category
                ] +=
                    Number(
                        transaction.amount
                    );
            }
        }
    );


    overview.innerHTML = "";


    let categoryNames =
        Object.keys(categories);


    if (
        categoryNames.length === 0
    ) {

        overview.innerHTML =
            "<p>No expenses available.</p>";

        return;
    }


    categoryNames.forEach(
        function(category) {

            let div =
                document.createElement(
                    "div"
                );


            div.innerHTML =
                "<strong>" +
                category +
                "</strong>: ₹" +
                categories[
                    category
                ].toFixed(2);


            overview.appendChild(div);
        }
    );
}


// ================= CHART =================

function updateChart(
    income,
    expense
) {

    let incomeBar =
        document.getElementById(
            "incomeBar"
        );

    let expenseBar =
        document.getElementById(
            "expenseBar"
        );


    let max =
        Math.max(
            income,
            expense,
            1
        );


    if (incomeBar) {

        incomeBar.style.height =
            (
                income /
                max *
                100
            ) + "%";
    }


    if (expenseBar) {

        expenseBar.style.height =
            (
                expense /
                max *
                100
            ) + "%";
    }
}


// ================= RECENT TRANSACTIONS =================

function displayRecentTransactions() {

    let container =
        document.getElementById(
            "recentTransactions"
        );


    if (!container) {

        return;
    }


    container.innerHTML = "";


    let recent =
        [...transactions]
        .sort(
            function(a, b) {

                return (
                    new Date(b.date) -
                    new Date(a.date)
                );
            }
        )
        .slice(0, 5);


    if (recent.length === 0) {

        container.innerHTML =
            "<tr><td colspan='6'>" +
            "No transactions yet." +
            "</td></tr>";

        return;
    }


    recent.forEach(
        function(transaction) {

            let row =
                createTransactionRow(
                    transaction
                );


            container.appendChild(row);
        }
    );
}


// ================= ALL TRANSACTIONS =================

function displayTransactions() {

    let container =
        document.getElementById(
            "allTransactions"
        );


    if (!container) {

        return;
    }


    let search =
        document.getElementById(
            "searchInput"
        )?.value.toLowerCase() || "";


    let category =
        document.getElementById(
            "categoryFilter"
        )?.value || "All";


    let type =
        document.getElementById(
            "typeFilter"
        )?.value || "All";


    container.innerHTML = "";


    let filtered =
        transactions.filter(
            function(transaction) {

                let matchesSearch =
                    transaction.description
                        .toLowerCase()
                        .includes(search);


                let matchesCategory =
                    category === "All" ||
                    transaction.category ===
                    category;


                let matchesType =
                    type === "All" ||
                    transaction.type ===
                    type;


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesType
                );
            }
        );


    if (filtered.length === 0) {

        container.innerHTML =
            "<tr><td colspan='6'>" +
            "No transactions found." +
            "</td></tr>";

        return;
    }


    filtered.forEach(
        function(transaction) {

            let row =
                createTransactionRow(
                    transaction
                );


            container.appendChild(row);
        }
    );
}


// ================= TRANSACTION ROW =================

function createTransactionRow(
    transaction
) {

    let row =
        document.createElement("tr");


    row.innerHTML = `
        <td>${transaction.description}</td>

        <td>${transaction.category}</td>

        <td>${transaction.date}</td>

        <td class="${
            transaction.type === "Income"
                ? "income-text"
                : "expense-text"
        }">
            ${transaction.type}
        </td>

        <td>
            ₹${Number(
                transaction.amount
            ).toFixed(2)}
        </td>

        <td>

            <button
                class="action-btn edit-btn"
                onclick="openEditTransaction(${transaction.id})">
                Edit
            </button>

            <button
                class="action-btn delete-btn"
                onclick="deleteTransaction(${transaction.id})">
                Delete
            </button>

        </td>
    `;


    return row;
}


// ================= DELETE TRANSACTION =================

async function deleteTransaction(id) {

    let confirmDelete =
        confirm(
            "Are you sure you want to delete this transaction?"
        );


    if (!confirmDelete) {

        return;
    }


    let userId =
        localStorage.getItem("userId");


    if (!userId) {

        alert(
            "Please login first."
        );

        return;
    }


    try {

        let response =
            await fetch(
                "http://localhost:8080/api/transactions?id=" +
                id +
                "&user_id=" +
                userId,
                {
                    method: "DELETE"
                }
            );


        let result =
            await response.text();


        if (response.ok) {

            await loadTransactions();

            updateDashboard();

            displayTransactions();

            displayRecentTransactions();

            alert(result);

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ================= EDIT TRANSACTION =================

function openEditTransaction(id) {

    let transaction =
        transactions.find(
            function(item) {

                return String(item.id) ===
                    String(id);
            }
        );


    if (!transaction) {

        alert(
            "Transaction not found."
        );

        return;
    }


    let modal =
        document.getElementById(
            "editModal"
        );


    if (!modal) {

        alert(
            "Edit modal not found in HTML."
        );

        return;
    }


    document.getElementById(
        "editTransactionId"
    ).value =
        transaction.id;


    document.getElementById(
        "editDescription"
    ).value =
        transaction.description;


    document.getElementById(
        "editAmount"
    ).value =
        transaction.amount;


    document.getElementById(
        "editTransactionType"
    ).value =
        transaction.type;


    document.getElementById(
        "editCategory"
    ).value =
        transaction.category;


    document.getElementById(
        "editDate"
    ).value =
        transaction.date;


    modal.style.display =
        "flex";
}


// ================= CLOSE EDIT MODAL =================

function closeEditModal() {

    let modal =
        document.getElementById(
            "editModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }
}


// ================= SAVE EDITED TRANSACTION =================

async function saveEditedTransaction() {

    let id =
        Number(
            document.getElementById(
                "editTransactionId"
            ).value
        );


    let description =
        document.getElementById(
            "editDescription"
        ).value.trim();


    let amount =
        Number(
            document.getElementById(
                "editAmount"
            ).value
        );


    let type =
        document.getElementById(
            "editTransactionType"
        ).value;


    let category =
        document.getElementById(
            "editCategory"
        ).value;


    let date =
        document.getElementById(
            "editDate"
        ).value;


    let userId =
        localStorage.getItem("userId");


    if (
        description === "" ||
        amount <= 0 ||
        date === ""
    ) {

        alert(
            "Please enter valid transaction details."
        );

        return;
    }


    if (!userId) {

        alert(
            "Please login first."
        );

        return;
    }


    let data =
        "id=" +
        encodeURIComponent(id) +

        "&user_id=" +
        encodeURIComponent(userId) +

        "&description=" +
        encodeURIComponent(description) +

        "&amount=" +
        encodeURIComponent(amount) +

        "&type=" +
        encodeURIComponent(type) +

        "&category=" +
        encodeURIComponent(category) +

        "&date=" +
        encodeURIComponent(date);


    try {

        let response =
            await fetch(
                "http://localhost:8080/api/transactions",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: data
                }
            );


        let result =
            await response.text();


        if (response.ok) {

            closeEditModal();

            await loadTransactions();

            updateDashboard();

            displayTransactions();

            displayRecentTransactions();

            alert(result);

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ==================================================
// ================= BUDGET ==========================
// ==================================================


// ================= SAVE BUDGET ======================

async function saveBudget() {

    let category =
        document.getElementById(
            "budgetCategory"
        ).value;


    let amount =
        Number(
            document.getElementById(
                "budgetAmount"
            ).value
        );


    let userId =
        localStorage.getItem("userId");


    if (
        category === "" ||
        amount <= 0
    ) {

        alert(
            "Please enter valid budget details."
        );

        return;
    }


    if (!userId) {

        alert(
            "Please login first."
        );

        return;
    }


    let data =
        "user_id=" +
        encodeURIComponent(userId) +

        "&category=" +
        encodeURIComponent(category) +

        "&amount=" +
        encodeURIComponent(amount);


    try {

        let response =
            await fetch(
                "http://localhost:8080/api/budgets",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: data
                }
            );


        let result =
            await response.text();


        if (response.ok) {

            document.getElementById(
                "budgetAmount"
            ).value = "";


            let message =
                document.getElementById(
                    "budgetMessage"
                );


            if (message) {

                message.textContent =
                    result;
            }


            await loadBudgets();

            displayBudgets();

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ================= DISPLAY BUDGETS ==================

function displayBudgets() {

    let container =
        document.getElementById(
            "budgetList"
        );


    if (!container) {

        return;
    }


    container.innerHTML = "";


    if (budgets.length === 0) {

        container.innerHTML = `
            <div class="card budget-empty">
                <h3>No budgets set yet</h3>
                <p>
                    Set a category budget to start tracking your spending.
                </p>
            </div>
        `;

        return;
    }


    budgets.forEach(
        function(budget) {

            let div =
                document.createElement(
                    "div"
                );


            div.className =
                "budget-card";


            div.innerHTML = `
                <div class="budget-card-header">

                    <h3>
                        ${budget.category}
                    </h3>

                    <span class="budget-status safe">
                        Monthly Budget
                    </span>

                </div>

                <div class="budget-amounts">

                    <span>
                        Budget
                    </span>

                    <strong>
                        ₹${Number(
                            budget.amount
                        ).toFixed(2)}
                    </strong>

                </div>

                <div class="budget-progress">
                    <div
                        class="budget-progress-bar"
                        style="width: 0%">
                    </div>
                </div>

                <div class="budget-card-footer">

                    <span>
                        Spending limit
                    </span>

                    <div>

                        <button
                            class="action-btn edit-btn"
                            onclick="editBudget(${budget.id})">
                            Edit
                        </button>

                        <button
                            class="action-btn delete-btn"
                            onclick="deleteBudget(${budget.id})">
                            Delete
                        </button>

                    </div>

                </div>
            `;


            container.appendChild(div);
        }
    );
}


// ================= EDIT BUDGET =====================

async function editBudget(id) {

    let budget =
        budgets.find(
            function(item) {

                return String(item.id) ===
                    String(id);
            }
        );


    if (!budget) {

        alert(
            "Budget not found."
        );

        return;
    }


    let newAmount =
        prompt(
            "Enter new budget amount:",
            budget.amount
        );


    if (
        newAmount === null ||
        newAmount.trim() === ""
    ) {

        return;
    }


    newAmount =
        Number(newAmount);


    if (newAmount <= 0) {

        alert(
            "Please enter a valid amount."
        );

        return;
    }


    let userId =
        localStorage.getItem("userId");


    if (!userId) {

        alert(
            "Please login first."
        );

        return;
    }


    let data =
        "id=" +
        encodeURIComponent(id) +

        "&user_id=" +
        encodeURIComponent(userId) +

        "&category=" +
        encodeURIComponent(
            budget.category
        ) +

        "&amount=" +
        encodeURIComponent(
            newAmount
        );


    try {

        let response =
            await fetch(
                "http://localhost:8080/api/budgets",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: data
                }
            );


        let result =
            await response.text();


        if (response.ok) {

            await loadBudgets();

            displayBudgets();

            alert(result);

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ================= DELETE BUDGET ===================

async function deleteBudget(id) {

    let confirmDelete =
        confirm(
            "Are you sure you want to delete this budget?"
        );


    if (!confirmDelete) {

        return;
    }


    let userId =
        localStorage.getItem("userId");


    if (!userId) {

        alert(
            "Please login first."
        );

        return;
    }


    try {

        let response =
            await fetch(
                "http://localhost:8080/api/budgets?id=" +
                id +
                "&user_id=" +
                userId,
                {
                    method: "DELETE"
                }
            );


        let result =
            await response.text();


        if (response.ok) {

            await loadBudgets();

            displayBudgets();

            alert(result);

        } else {

            alert(result);
        }

    } catch (error) {

        alert(
            "Cannot connect to backend server."
        );

        console.log(error);
    }
}


// ================= REPORTS =========================

function updateReports() {

    let expenses =
        transactions.filter(
            function(transaction) {

                return transaction.type ===
                    "Expense";
            }
        );


    if (expenses.length === 0) {

        document.getElementById(
            "highestExpense"
        ).textContent =
            "₹0.00";


        document.getElementById(
            "mostCategory"
        ).textContent =
            "No data";


        document.getElementById(
            "averageExpense"
        ).textContent =
            "₹0.00";


        return;
    }


    let highest =
        Math.max(
            ...expenses.map(
                function(transaction) {

                    return Number(
                        transaction.amount
                    );
                }
            )
        );


    let total =
        expenses.reduce(
            function(
                sum,
                transaction
            ) {

                return (
                    sum +
                    Number(
                        transaction.amount
                    )
                );

            },
            0
        );


    let categoryCount = {};


    expenses.forEach(
        function(transaction) {

            categoryCount[
                transaction.category
            ] =
                (
                    categoryCount[
                        transaction.category
                    ] || 0
                ) + 1;
        }
    );


    let mostCategory =
        Object.keys(
            categoryCount
        ).sort(
            function(a, b) {

                return (
                    categoryCount[b] -
                    categoryCount[a]
                );
            }
        )[0];


    document.getElementById(
        "highestExpense"
    ).textContent =
        "₹" +
        highest.toFixed(2);


    document.getElementById(
        "mostCategory"
    ).textContent =
        mostCategory;


    document.getElementById(
        "averageExpense"
    ).textContent =
        "₹" +
        (
            total /
            expenses.length
        ).toFixed(2);
}


// ================= SEARCH ==========================

document.addEventListener(
    "input",
    function(event) {

        if (
            event.target.id ===
            "searchInput"
        ) {

            displayTransactions();
        }
    }
);


// ================= FILTER ==========================

document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id ===
                "categoryFilter" ||

            event.target.id ===
                "typeFilter"
        ) {

            displayTransactions();
        }
    }
);


// ================= DARK MODE =======================

function toggleDarkMode() {

    document.body.classList.toggle(
        "dark"
    );


    localStorage.setItem(
        "darkMode",
        document.body.classList.contains(
            "dark"
        )
    );
}