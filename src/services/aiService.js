import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

// Enhanced financial context with more detailed analysis
const getFinancialContext = (userData) => {
  const { 
    transactions = [], 
    income = 0, 
    expense = 0, 
    currentBalance = 0,
    budgets = [],
    goals = []
  } = userData;
  
  // Analyze transactions by date
  const transactionsByMonth = {};
  const transactionsByCategory = {};
  const recentTransactions = transactions.slice(-20);
  
  transactions.forEach(transaction => {
    // Group by month
    const month = transaction.date ? transaction.date.split('-').slice(1).join('-') : 'Unknown';
    if (!transactionsByMonth[month]) {
      transactionsByMonth[month] = { income: 0, expense: 0 };
    }
    
    if (transaction.type === 'income') {
      transactionsByMonth[month].income += parseFloat(transaction.amount || 0);
    } else {
      transactionsByMonth[month].expense += parseFloat(transaction.amount || 0);
    }
    
    // Group by category
    const category = transaction.name || transaction.category || 'Uncategorized';
    if (!transactionsByCategory[category]) {
      transactionsByCategory[category] = { income: 0, expense: 0, count: 0 };
    }
    if (transaction.type === 'income') {
      transactionsByCategory[category].income += parseFloat(transaction.amount || 0);
    } else {
      transactionsByCategory[category].expense += parseFloat(transaction.amount || 0);
    }
    transactionsByCategory[category].count++;
  });
  
  // Calculate trends
  const months = Object.keys(transactionsByMonth).sort();
  const expenseTrend = months.length >= 2 
    ? transactionsByMonth[months[months.length - 1]].expense - transactionsByMonth[months[months.length - 2]].expense
    : 0;
  
  // Top spending categories
  const topCategories = Object.entries(transactionsByCategory)
    .filter(([_, data]) => data.expense > 0)
    .sort(([_, a], [__, b]) => b.expense - a.expense)
    .slice(0, 5)
    .map(([name, data]) => ({ name, amount: data.expense, count: data.count }));
  
  // Calculate savings rate
  const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0;
  
  // Budget analysis
  const budgetStatus = budgets.map(budget => {
    const categorySpent = transactionsByCategory[budget.category]?.expense || 0;
    return {
      category: budget.category,
      limit: budget.limit,
      spent: categorySpent,
      remaining: budget.limit - categorySpent,
      percentage: (categorySpent / budget.limit * 100).toFixed(1)
    };
  });
  
  return {
    totalIncome: income,
    totalExpense: expense,
    currentBalance: currentBalance,
    savingsRate: parseFloat(savingsRate),
    transactionCount: transactions.length,
    recentTransactions: recentTransactions.slice(-10),
    topCategories,
    expenseTrend,
    budgetStatus,
    goals: goals || [],
    monthlyData: transactionsByMonth
  };
};

// Predictive analytics
export const getPredictiveInsights = async (userData) => {
  try {
    const context = getFinancialContext(userData);
    
    // Predict next month's expenses
    const avgMonthlyExpense = context.totalExpense / Math.max(1, Object.keys(context.monthlyData).length);
    const predictedExpense = avgMonthlyExpense + (context.expenseTrend * 0.3); // Weighted prediction
    
    // Calculate financial health score (0-100)
    let healthScore = 100;
    if (context.currentBalance < 0) healthScore -= 30;
    if (context.savingsRate < 10) healthScore -= 20;
    if (context.savingsRate < 20) healthScore -= 10;
    if (context.expenseTrend > 0 && context.expenseTrend > avgMonthlyExpense * 0.1) healthScore -= 15;
    
    // Check budget overruns
    const budgetOverruns = context.budgetStatus.filter(b => b.spent > b.limit);
    healthScore -= budgetOverruns.length * 5;
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    return {
      predictedExpense: Math.max(0, predictedExpense),
      healthScore: Math.round(healthScore),
      riskLevel: healthScore >= 80 ? 'Low' : healthScore >= 60 ? 'Medium' : 'High',
      recommendations: generateRecommendations(context, healthScore)
    };
  } catch (error) {
    console.error('Error in predictive insights:', error);
    return {
      predictedExpense: 0,
      healthScore: 50,
      riskLevel: 'Medium',
      recommendations: []
    };
  }
};

// Generate recommendations based on data
const generateRecommendations = (context, healthScore) => {
  const recommendations = [];
  
  if (context.savingsRate < 20) {
    recommendations.push({
      type: 'warning',
      title: 'Low Savings Rate',
      message: `Your savings rate is ${context.savingsRate}%. Aim for at least 20% to build a strong financial foundation.`
    });
  }
  
  if (context.expenseTrend > 0) {
    recommendations.push({
      type: 'info',
      title: 'Increasing Expenses',
      message: 'Your expenses are trending upward. Review your spending patterns to identify areas for optimization.'
    });
  }
  
  if (context.topCategories.length > 0) {
    const topCategory = context.topCategories[0];
    if (topCategory.amount > context.totalExpense * 0.3) {
      recommendations.push({
        type: 'suggestion',
        title: 'High Spending Category',
        message: `${topCategory.name} accounts for ${(topCategory.amount / context.totalExpense * 100).toFixed(1)}% of your expenses. Consider reviewing this category.`
      });
    }
  }
  
  if (context.budgetStatus.some(b => b.spent > b.limit)) {
    recommendations.push({
      type: 'alert',
      title: 'Budget Overrun',
      message: 'You have exceeded budgets in some categories. Review and adjust your spending.'
    });
  }
  
  if (healthScore < 60) {
    recommendations.push({
      type: 'critical',
      title: 'Financial Health Alert',
      message: 'Your financial health score is below optimal. Focus on reducing expenses and increasing savings.'
    });
  }
  
  return recommendations;
};

// Enhanced financial advice with AI
export const getFinancialAdvice = async (userMessage, userData) => {
  try {
    const financialContext = getFinancialContext(userData);
    const predictiveInsights = await getPredictiveInsights(userData);
    
    // Check if API key is available
    if (!process.env.REACT_APP_GEMINI_API_KEY) {
      throw new Error('API key not configured');
    }
    
    const systemPrompt = `You are an advanced AI personal finance assistant for Financely, a comprehensive financial management platform. You provide intelligent, data-driven financial advice.

User's Financial Profile:
- Total Income: ₹${financialContext.totalIncome.toLocaleString()}
- Total Expenses: ₹${financialContext.totalExpense.toLocaleString()}
- Current Balance: ₹${financialContext.currentBalance.toLocaleString()}
- Savings Rate: ${financialContext.savingsRate}%
- Financial Health Score: ${predictiveInsights.healthScore}/100 (${predictiveInsights.riskLevel} Risk)
- Total Transactions: ${financialContext.transactionCount}

Top Spending Categories:
${financialContext.topCategories.map((cat, i) => `${i + 1}. ${cat.name}: ₹${cat.amount.toLocaleString()}`).join('\n')}

Budget Status:
${financialContext.budgetStatus.length > 0 
  ? financialContext.budgetStatus.map(b => `- ${b.category}: ₹${b.spent.toLocaleString()}/${b.limit.toLocaleString()} (${b.percentage}%)`).join('\n')
  : 'No budgets set yet'}

Financial Goals:
${financialContext.goals.length > 0 
  ? financialContext.goals.map(g => `- ${g.name}: ₹${g.targetAmount.toLocaleString()} (${g.currentAmount.toLocaleString()} saved)`).join('\n')
  : 'No goals set yet'}

Predictive Insights:
- Predicted Next Month Expense: ₹${predictiveInsights.predictedExpense.toLocaleString()}
- Expense Trend: ${financialContext.expenseTrend > 0 ? 'Increasing' : financialContext.expenseTrend < 0 ? 'Decreasing' : 'Stable'}

Your Capabilities:
1. Analyze spending patterns and identify optimization opportunities
2. Provide personalized budgeting strategies
3. Recommend savings and investment approaches
4. Predict future expenses based on historical data
5. Assess financial health and provide improvement plans
6. Help set and track financial goals
7. Suggest actionable steps for financial improvement

Guidelines:
- Be specific and actionable with recommendations
- Use data-driven insights from the user's financial profile
- Consider their financial health score and risk level
- Provide step-by-step guidance when appropriate
- Use Indian Rupee (₹) for all currency references
- Be encouraging but realistic
- For investment advice, provide general guidance and recommend consulting a certified financial advisor for complex decisions
- Reference specific categories, amounts, and trends from their data

Respond in a friendly, professional, and conversational tone. Make your advice personalized and relevant to their specific financial situation.`;

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error getting AI advice:', error);
    
    // Enhanced fallback with better insights
    const financialContext = getFinancialContext(userData);
    const predictiveInsights = await getPredictiveInsights(userData);
    
    const message = userMessage.toLowerCase();
    
    if (message.includes('budget') || message.includes('spending limit')) {
      return `Based on your financial data, here's a budgeting analysis:

💰 Current Financial Status:
- Income: ₹${financialContext.totalIncome.toLocaleString()}
- Expenses: ₹${financialContext.totalExpense.toLocaleString()}
- Balance: ₹${financialContext.currentBalance.toLocaleString()}
- Savings Rate: ${financialContext.savingsRate}%

${financialContext.budgetStatus.length > 0 
  ? `📊 Your Budget Status:\n${financialContext.budgetStatus.map(b => 
      `- ${b.category}: ₹${b.spent.toLocaleString()}/${b.limit.toLocaleString()} (${b.percentage}% used)`
    ).join('\n')}`
  : '💡 Tip: Set up budgets for different categories to better control your spending!'}

🎯 Recommendation: Follow the 50/30/20 rule - allocate 50% for needs, 30% for wants, and 20% for savings.`;
    }
    
    if (message.includes('save') || message.includes('saving')) {
      return `Great question about saving! Here's your savings analysis:

📈 Current Savings Rate: ${financialContext.savingsRate}%
${financialContext.savingsRate < 20 
  ? '⚠️ Your savings rate is below the recommended 20%. Here are some strategies:\n\n1. Automate your savings - set up automatic transfers\n2. Review your top spending categories and find areas to cut\n3. Use the 50/30/20 budgeting rule\n4. Track every expense to identify unnecessary spending'
  : '✅ Great job! You\'re maintaining a healthy savings rate.'}

💰 Your Financial Goals:
${financialContext.goals.length > 0 
  ? financialContext.goals.map(g => `- ${g.name}: ₹${g.currentAmount.toLocaleString()}/${g.targetAmount.toLocaleString()}`).join('\n')
  : '💡 Set up financial goals to stay motivated and track your progress!'}`;
    }
    
    if (message.includes('predict') || message.includes('forecast') || message.includes('future')) {
      return `🔮 Financial Forecast Based on Your Data:

Predicted Next Month Expense: ₹${predictiveInsights.predictedExpense.toLocaleString()}
Expense Trend: ${financialContext.expenseTrend > 0 ? '📈 Increasing' : financialContext.expenseTrend < 0 ? '📉 Decreasing' : '➡️ Stable'}

📊 Financial Health Score: ${predictiveInsights.healthScore}/100 (${predictiveInsights.riskLevel} Risk)

💡 Recommendations:
${predictiveInsights.recommendations.map(r => `- ${r.title}: ${r.message}`).join('\n')}

Based on your spending patterns, I recommend focusing on maintaining or improving your current savings rate.`;
    }
    
    if (message.includes('health') || message.includes('score') || message.includes('status')) {
      return `🏥 Your Financial Health Report:

Score: ${predictiveInsights.healthScore}/100 (${predictiveInsights.riskLevel} Risk Level)

📊 Breakdown:
- Income: ₹${financialContext.totalIncome.toLocaleString()}
- Expenses: ₹${financialContext.totalExpense.toLocaleString()}
- Balance: ₹${financialContext.currentBalance.toLocaleString()}
- Savings Rate: ${financialContext.savingsRate}%

${predictiveInsights.healthScore >= 80 
  ? '✅ Excellent! You\'re in great financial shape. Keep up the good work!'
  : predictiveInsights.healthScore >= 60
  ? '⚠️ Good, but there\'s room for improvement. Focus on increasing your savings rate.'
  : '🚨 Your financial health needs attention. Consider reducing expenses and increasing savings.'}

💡 Action Items:
${predictiveInsights.recommendations.slice(0, 3).map(r => `- ${r.message}`).join('\n')}`;
    }
    
    return `I'm here to help with your personal finance! Based on your data:

💰 Financial Overview:
- Income: ₹${financialContext.totalIncome.toLocaleString()}
- Expenses: ₹${financialContext.totalExpense.toLocaleString()}
- Balance: ₹${financialContext.currentBalance.toLocaleString()}
- Health Score: ${predictiveInsights.healthScore}/100

I can help you with budgeting, savings strategies, expense analysis, financial forecasting, goal setting, and more. What would you like to know?`;
  }
};

// Enhanced quick insights
export const getQuickInsights = async (userData) => {
  try {
    const financialContext = getFinancialContext(userData);
    const predictiveInsights = await getPredictiveInsights(userData);
    
    const insights = [];
    
    // Health score insight
    if (predictiveInsights.healthScore >= 80) {
      insights.push(`✅ Excellent Financial Health Score: ${predictiveInsights.healthScore}/100!`);
    } else if (predictiveInsights.healthScore < 60) {
      insights.push(`⚠️ Financial Health Score: ${predictiveInsights.healthScore}/100 - Focus on improving your savings rate`);
    }
    
    // Savings rate insights
    if (financialContext.savingsRate >= 20) {
      insights.push(`💪 Great savings rate of ${financialContext.savingsRate}%! You're on track.`);
    } else if (financialContext.savingsRate < 10) {
      insights.push(`⚠️ Your savings rate is ${financialContext.savingsRate}%. Aim for at least 20% to build wealth.`);
    }
    
    // Budget insights
    const overBudget = financialContext.budgetStatus.filter(b => b.spent > b.limit);
    if (overBudget.length > 0) {
      insights.push(`🚨 You've exceeded budget in ${overBudget.length} categor${overBudget.length > 1 ? 'ies' : 'y'}`);
    }
    
    // Expense trend
    if (financialContext.expenseTrend > 0) {
      insights.push(`📈 Your expenses are trending upward. Consider reviewing your spending.`);
    }
    
    // Top category insight
    if (financialContext.topCategories.length > 0) {
      const top = financialContext.topCategories[0];
      insights.push(`🎯 Top spending: ${top.name} (₹${top.amount.toLocaleString()})`);
    }
    
    // Goal progress
    if (financialContext.goals.length > 0) {
      const activeGoals = financialContext.goals.filter(g => g.currentAmount < g.targetAmount);
      if (activeGoals.length > 0) {
        insights.push(`🎯 ${activeGoals.length} active financial goal${activeGoals.length > 1 ? 's' : ''} to track`);
      }
    }
    
    return insights.length > 0 ? insights : ["💡 Add more transactions and set up budgets to get personalized insights!"];
  } catch (error) {
    console.error('Error generating insights:', error);
    return ["💡 Welcome to Financely! Start adding transactions to get personalized financial insights."];
  }
};

// Analyze spending patterns
export const analyzeSpendingPatterns = (transactions) => {
  const patterns = {
    byCategory: {},
    byDayOfWeek: {},
    byMonth: {},
    averageTransaction: 0,
    mostExpensiveDay: null,
    mostExpensiveCategory: null
  };
  
  transactions.filter(t => t.type === 'expense').forEach(transaction => {
    const category = transaction.name || transaction.category || 'Uncategorized';
    patterns.byCategory[category] = (patterns.byCategory[category] || 0) + parseFloat(transaction.amount || 0);
    
    if (transaction.date) {
      const date = new Date(transaction.date.split('-').reverse().join('-'));
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      
      patterns.byDayOfWeek[dayOfWeek] = (patterns.byDayOfWeek[dayOfWeek] || 0) + parseFloat(transaction.amount || 0);
      patterns.byMonth[month] = (patterns.byMonth[month] || 0) + parseFloat(transaction.amount || 0);
    }
  });
  
  const expenses = transactions.filter(t => t.type === 'expense').map(t => parseFloat(t.amount || 0));
  patterns.averageTransaction = expenses.length > 0 
    ? expenses.reduce((a, b) => a + b, 0) / expenses.length 
    : 0;
  
  patterns.mostExpensiveCategory = Object.entries(patterns.byCategory)
    .sort(([,a], [,b]) => b - a)[0];
  
  patterns.mostExpensiveDay = Object.entries(patterns.byDayOfWeek)
    .sort(([,a], [,b]) => b - a)[0];
  
  return patterns;
};
