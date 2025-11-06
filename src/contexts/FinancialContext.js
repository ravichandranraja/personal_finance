import React, { createContext, useContext, useState } from 'react';

const FinancialContext = createContext();

export const useFinancialContext = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancialContext must be used within a FinancialProvider');
  }
  return context;
};

export const FinancialProvider = ({ children }) => {
  const [financialData, setFinancialData] = useState({
    transactions: [],
    income: 0,
    expense: 0,
    currentBalance: 0,
    budgets: [],
    goals: [],
    isLoading: false
  });

  const updateFinancialData = (newData) => {
    setFinancialData(prev => ({
      ...prev,
      ...newData
    }));
  };

  const updateBudgets = (budgets) => {
    setFinancialData(prev => ({
      ...prev,
      budgets
    }));
  };

  const updateGoals = (goals) => {
    setFinancialData(prev => ({
      ...prev,
      goals
    }));
  };

  const setLoading = (isLoading) => {
    setFinancialData(prev => ({
      ...prev,
      isLoading
    }));
  };

  const value = {
    financialData,
    updateFinancialData,
    updateBudgets,
    updateGoals,
    setLoading
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};
