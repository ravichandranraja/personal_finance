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
    isLoading: false
  });

  const updateFinancialData = (newData) => {
    setFinancialData(prev => ({
      ...prev,
      ...newData
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
    setLoading
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};
