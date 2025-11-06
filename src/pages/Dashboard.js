import React, { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { Tabs, Card, Spin } from "antd";
import Cards from "../components/Cards";
import AddExpense from "../components/Modals/addExpense";
import AddIncome from "../components/Modals/addIncome";
import { toast } from "react-toastify";
import { auth, db } from "../firebase";
import { addDoc, collection, getDocs, query } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import TransactionsTable from "../components/TransactionsTable";
import ChartComponent from "../components/Charts";
import ChatBot from "../components/ChatBot";
import { useFinancialContext } from "../contexts/FinancialContext";
import { getPredictiveInsights } from "../services/aiService";
import "./styles.css";

// Lazy load heavy components
const BudgetManager = React.lazy(() => import("../components/BudgetManager"));
const FinancialGoals = React.lazy(() => import("../components/FinancialGoals"));
const Analytics = React.lazy(() => import("../components/Analytics"));

const { TabPane } = Tabs;

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ textAlign: 'center', padding: '50px' }}>
    <Spin size="large" />
  </div>
);

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isIncomeModalVisible, setIsIncomeModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [financialHealth, setFinancialHealth] = useState(null);
  
  const { updateFinancialData, updateBudgets, updateGoals } = useFinancialContext();

  // Memoize callbacks to prevent unnecessary re-renders
  const showExpenseModal = useCallback(() => {
    setIsExpenseModalVisible(true);
  }, []);

  const showIncomeModal = useCallback(() => {
    setIsIncomeModalVisible(true);
  }, []);

  const handleExpenseCancel = useCallback(() => {
    setIsExpenseModalVisible(false);
  }, []);

  const handleIncomeCancel = useCallback(() => {
    setIsIncomeModalVisible(false);
  }, []);

  const onFinish = useCallback((values, type) => {
    const newTransaction = {
      type: type,
      date: values.date.format("DD-MM-YYYY"),
      amount: parseFloat(values.amount),
      name: values.name,
      category: values.category || values.name,
    };
    setIsExpenseModalVisible(false);
    setIsIncomeModalVisible(false);
    addTransaction(newTransaction);
  }, []);

  const addTransaction = useCallback(async (transaction, many) => {
    if (!user) return;
    try {
      await addDoc(
        collection(db, `users/${user.uid}/transactions`),
        transaction
      );
      if (!many) toast.success("Transaction Added!");
      setTransactions(prev => [...prev, transaction]);
      fetchTransactions();
    } catch (err) {
      if (!many) toast.error("Couldn't add transaction");
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const dataRef = query(collection(db, `users/${user.uid}/transactions`));
      const querySnapshot = await getDocs(dataRef);
      let transactionArray = [];
      querySnapshot.forEach((doc) => {
        transactionArray.push({ ...doc.data(), id: doc.id });
      });
      setTransactions(transactionArray);
      if (transactionArray.length > 0) {
        toast.success("Transactions loaded!");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }, [user]);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    try {
      const budgetsRef = collection(db, `users/${user.uid}/budgets`);
      const querySnapshot = await getDocs(budgetsRef);
      const budgetsList = [];
      querySnapshot.forEach((doc) => {
        budgetsList.push({ ...doc.data(), id: doc.id });
      });
      setBudgets(budgetsList);
      updateBudgets(budgetsList);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    }
  }, [user, updateBudgets]);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    try {
      const goalsRef = collection(db, `users/${user.uid}/goals`);
      const querySnapshot = await getDocs(goalsRef);
      const goalsList = [];
      querySnapshot.forEach((doc) => {
        goalsList.push({ ...doc.data(), id: doc.id });
      });
      setGoals(goalsList);
      updateGoals(goalsList);
    } catch (error) {
      console.error("Error fetching goals:", error);
    }
  }, [user, updateGoals]);

  // Memoize balance calculation
  const calculateBalance = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        totalIncome += parseFloat(transaction.amount || 0);
      } else {
        totalExpense += parseFloat(transaction.amount || 0);
      }
    });
    return { totalIncome, totalExpense, currentBalance: totalIncome - totalExpense };
  }, [transactions]);

  // Update state when calculations change
  useEffect(() => {
    setIncome(calculateBalance.totalIncome);
    setExpense(calculateBalance.totalExpense);
    setCurrentBalance(calculateBalance.currentBalance);
  }, [calculateBalance]);

  useEffect(() => {
    fetchTransactions();
    fetchBudgets();
    fetchGoals();
  }, [user, fetchTransactions, fetchBudgets, fetchGoals]);

  // Update financial context and health score
  useEffect(() => {
    const financialData = {
      transactions,
      income,
      expense,
      currentBalance,
      budgets,
      goals
    };
    
    updateFinancialData(financialData);
    
    // Calculate financial health asynchronously
    const calculateHealth = async () => {
      try {
        const health = await getPredictiveInsights(financialData);
        setFinancialHealth(health);
      } catch (error) {
        console.error("Error calculating health:", error);
      }
    };
    
    // Debounce health calculation to avoid excessive calls
    const timeoutId = setTimeout(calculateHealth, 500);
    return () => clearTimeout(timeoutId);
  }, [transactions, income, expense, currentBalance, budgets, goals, updateFinancialData]);

  return (
    <div className="dashboard-container">
      {/* Financial Health Score Card */}
      {financialHealth && (
        <Card className="health-score-card" style={{ marginBottom: 20, borderRadius: 12 }}>
          <div className="health-score-content">
            <div>
              <h3 style={{ margin: 0, marginBottom: 8 }}>Financial Health Score</h3>
              <p style={{ color: '#8c8c8c', margin: 0 }}>
                {financialHealth.riskLevel} Risk Level
              </p>
            </div>
            <div className="health-score-value" style={{ 
              color: financialHealth.healthScore >= 80 ? '#52c41a' : 
                     financialHealth.healthScore >= 60 ? '#faad14' : '#ff4d4f',
              fontSize: 36,
              fontWeight: 'bold'
            }}>
              {financialHealth.healthScore}/100
            </div>
          </div>
        </Card>
      )}

      {/* Main Cards */}
      <Cards
        showExpenseModal={showExpenseModal}
        showIncomeModal={showIncomeModal}
        income={income}
        expense={expense}
        currentBalance={currentBalance}
        financialHealth={financialHealth}
      />

      {/* Modals */}
      <AddExpense
        isExpenseModalVisible={isExpenseModalVisible}
        handleExpenseCancel={handleExpenseCancel}
        onFinish={onFinish}
      />
      <AddIncome
        isIncomeModalVisible={isIncomeModalVisible}
        handleIncomeCancel={handleIncomeCancel}
        onFinish={onFinish}
      />

      {/* Main Content Tabs */}
      <Tabs defaultActiveKey="overview" className="dashboard-tabs" size="large">
        <TabPane tab="Overview" key="overview">
          <div className="chart container">
            {transactions.length !== 0 ? (
              <div className="line-chart">
                <ChartComponent transactions={transactions} />
              </div>
            ) : (
              <div className="no-transaction">
                <h2>No Transactions Available</h2>
                <img
                  src={process.env.PUBLIC_URL + "/coin.gif"}
                  alt="No-transaction-img"
                />
              </div>
            )}
          </div>
          <TransactionsTable
            transactions={transactions}
            addTransaction={addTransaction}
            fetchTransactions={fetchTransactions}
          />
        </TabPane>

        <TabPane tab="Analytics" key="analytics">
          <Suspense fallback={<LoadingFallback />}>
            <Analytics 
              transactions={transactions}
              income={income}
              expense={expense}
            />
          </Suspense>
        </TabPane>

        <TabPane tab="Budgets" key="budgets">
          <Suspense fallback={<LoadingFallback />}>
            <BudgetManager transactions={transactions} />
          </Suspense>
        </TabPane>

        <TabPane tab="Goals" key="goals">
          <Suspense fallback={<LoadingFallback />}>
            <FinancialGoals currentBalance={currentBalance} />
          </Suspense>
        </TabPane>
      </Tabs>
      
      {/* AI ChatBot */}
      <ChatBot />
    </div>
  );
};

export default React.memo(Dashboard);
