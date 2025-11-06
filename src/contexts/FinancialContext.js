import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

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

  const updateFinancialData = useCallback((newData) => {
    setFinancialData(prev => ({
      ...prev,
      ...newData
    }));
  }, []);

  const updateBudgets = useCallback((budgets) => {
    setFinancialData(prev => ({
      ...prev,
      budgets
    }));
  }, []);

  const updateGoals = useCallback((goals) => {
    setFinancialData(prev => ({
      ...prev,
      goals
    }));
  }, []);

  const setLoading = useCallback((isLoading) => {
    setFinancialData(prev => ({
      ...prev,
      isLoading
    }));
  }, []);

  const value = useMemo(() => ({
    financialData,
    updateFinancialData,
    updateBudgets,
    updateGoals,
    setLoading
  }), [financialData, updateFinancialData, updateBudgets, updateGoals, setLoading]);

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};
