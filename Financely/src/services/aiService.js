import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
console.log('Environment check:', {
  hasApiKey: !!process.env.REACT_APP_GEMINI_API_KEY,
  apiKeyLength: process.env.REACT_APP_GEMINI_API_KEY?.length,
  apiKeyStart: process.env.REACT_APP_GEMINI_API_KEY?.substring(0, 10)
});

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

// Financial advice prompts and context
const getFinancialContext = (userData) => {
  const { transactions = [], income = 0, expense = 0, currentBalance = 0 } = userData;
  
  const recentTransactions = transactions.slice(-10); // Last 10 transactions
  const expenseCategories = {};
  const incomeCategories = {};
  
  recentTransactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      expenseCategories[transaction.name] = (expenseCategories[transaction.name] || 0) + transaction.amount;
    } else {
      incomeCategories[transaction.name] = (incomeCategories[transaction.name] || 0) + transaction.amount;
    }
  });

  return {
    totalIncome: income,
    totalExpense: expense,
    currentBalance: currentBalance,
    recentTransactions: recentTransactions,
    expenseCategories: expenseCategories,
    incomeCategories: incomeCategories,
    transactionCount: transactions.length
  };
};

export const getFinancialAdvice = async (userMessage, userData) => {
  try {
    console.log('getFinancialAdvice called with:', { userMessage, userData });
    
    const financialContext = getFinancialContext(userData);
    console.log('Financial context:', financialContext);
    
    // Check if API key is available
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
      console.error('Gemini API key not found in environment variables');
      throw new Error('API key not configured');
    }
    
    const systemPrompt = `You are a helpful personal finance assistant for the Financely app. You help users with budgeting, saving, investing, and financial planning.

User's Financial Data:
- Total Income: ₹${financialContext.totalIncome}
- Total Expenses: ₹${financialContext.totalExpense}
- Current Balance: ₹${financialContext.currentBalance}
- Total Transactions: ${financialContext.transactionCount}
- Recent Expense Categories: ${JSON.stringify(financialContext.expenseCategories)}
- Recent Income Sources: ${JSON.stringify(financialContext.incomeCategories)}

Guidelines:
1. Provide practical, actionable financial advice
2. Be encouraging and supportive
3. Suggest specific steps they can take
4. Consider their current financial situation
5. Keep responses concise but helpful
6. Use Indian Rupee (₹) for currency references
7. Focus on budgeting, saving, and smart spending
8. If they ask about investments, provide general guidance but recommend consulting a financial advisor for complex decisions

Respond in a friendly, conversational tone.`;

    console.log('API Key exists:', !!process.env.REACT_APP_GEMINI_API_KEY);
    console.log('API Key length:', process.env.REACT_APP_GEMINI_API_KEY?.length);
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;
    console.log('Sending prompt to Gemini:', prompt.substring(0, 200) + '...');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini response:', text);

    return text;
  } catch (error) {
    console.error('Error getting AI advice:', error);
    
    // Get financial context for fallback responses
    const financialContext = getFinancialContext(userData);
    
    // Fallback responses for common queries
    const fallbackResponses = {
      'budget': `I'd be happy to help you with budgeting! Based on your current financial situation:
- Total Income: ₹${financialContext.totalIncome}
- Total Expenses: ₹${financialContext.totalExpense}
- Current Balance: ₹${financialContext.currentBalance}

I recommend following the 50-30-20 rule: 50% for needs, 30% for wants, and 20% for savings. Would you like me to analyze your spending patterns?`,
      'save': `Great question about saving! Looking at your current situation:
- Current Balance: ₹${financialContext.currentBalance}
- Total Income: ₹${financialContext.totalIncome}

Consider setting up automatic transfers to a savings account and tracking your expenses more closely.`,
      'invest': "Investment advice depends on your goals and risk tolerance. For beginners, I'd suggest starting with mutual funds or SIPs. Always remember to diversify and never invest more than you can afford to lose.",
      'expense': `I can help you analyze your expenses! Here's your current situation:
- Total Expenses: ₹${financialContext.totalExpense}
- Total Income: ₹${financialContext.totalIncome}
- Expense Categories: ${Object.keys(financialContext.expenseCategories).join(', ')}

Let's look at your spending categories and find ways to optimize.`,
      'pattern': `Let me analyze your spending pattern based on your data:
- You have ${financialContext.transactionCount} transactions
- Total Income: ₹${financialContext.totalIncome}
- Total Expenses: ₹${financialContext.totalExpense}
- Your biggest expense category: ${Object.keys(financialContext.expenseCategories)[0] || 'Not available'}

This gives you a savings rate of ${financialContext.totalIncome > 0 ? Math.round(((financialContext.totalIncome - financialContext.totalExpense) / financialContext.totalIncome) * 100) : 0}%.`,
      'default': `I'm here to help with your personal finance questions! Based on your current data:
- Income: ₹${financialContext.totalIncome}
- Expenses: ₹${financialContext.totalExpense}
- Balance: ₹${financialContext.currentBalance}

I can assist with budgeting, saving tips, expense tracking, and general financial planning. What would you like to know?`
    };

    // Simple keyword matching for fallback
    const message = userMessage.toLowerCase();
    if (message.includes('budget')) return fallbackResponses.budget;
    if (message.includes('save')) return fallbackResponses.save;
    if (message.includes('invest')) return fallbackResponses.invest;
    if (message.includes('expense')) return fallbackResponses.expense;
    if (message.includes('pattern') || message.includes('spending')) return fallbackResponses.pattern;
    if (message.includes('spend')) return fallbackResponses.expense;
    if (message.includes('money')) return fallbackResponses.save;
    
    return fallbackResponses.default;
  }
};

export const getQuickInsights = async (userData) => {
  try {
    const financialContext = getFinancialContext(userData);
    
    const insights = [];
    
    // Balance insights
    if (financialContext.currentBalance < 0) {
      insights.push("⚠️ You're currently spending more than you earn. Consider reviewing your expenses.");
    } else if (financialContext.currentBalance > financialContext.totalIncome * 0.2) {
      insights.push("✅ Great job! You're saving more than 20% of your income.");
    }
    
    // Expense insights
    if (financialContext.totalExpense > financialContext.totalIncome * 0.8) {
      insights.push("💡 Your expenses are high relative to income. Consider budgeting to increase savings.");
    }
    
    // Transaction frequency insights
    if (financialContext.transactionCount > 50) {
      insights.push("📊 You have many transactions. Consider categorizing them for better insights.");
    }
    
    // Category-based insights
    const topExpenseCategory = Object.entries(financialContext.expenseCategories)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topExpenseCategory && topExpenseCategory[1] > financialContext.totalExpense * 0.4) {
      insights.push(`🎯 Your biggest expense category is "${topExpenseCategory[0]}" (₹${topExpenseCategory[1]}). Consider if this aligns with your priorities.`);
    }
    
    return insights.length > 0 ? insights : ["💡 Add more transactions to get personalized insights!"];
  } catch (error) {
    console.error('Error generating insights:', error);
    return ["💡 Welcome to Financely! Start adding transactions to get personalized financial insights."];
  }
};
