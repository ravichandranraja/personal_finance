# Financely - AI-Powered Personal Finance Tracker

Financely is a comprehensive personal finance management application with an integrated AI chatbot that provides personalized financial advice and insights.

## Features

### Core Features
- **Income & Expense Tracking**: Add and categorize your financial transactions
- **Real-time Balance Calculation**: Track your current financial position
- **Interactive Charts**: Visualize your spending patterns with dynamic charts
- **Transaction Management**: Edit and delete transactions as needed
- **User Authentication**: Secure login with Firebase Authentication

### AI-Powered Features
- **Smart Financial Assistant**: AI chatbot that provides personalized financial advice
- **Quick Insights**: Automated analysis of your spending patterns and financial health
- **Budgeting Recommendations**: AI-powered suggestions for better financial management
- **Expense Analysis**: Detailed breakdown of your spending categories
- **Financial Planning**: Get advice on saving, investing, and financial goals

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Financely
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
   ```

   To get your Google Gemini API key:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key and paste it in your `.env` file

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## AI Chatbot Features

The AI chatbot provides:

### Financial Advice
- Budgeting strategies and tips
- Saving recommendations based on your spending patterns
- Investment guidance for beginners
- Expense reduction strategies

### Personalized Insights
- Analysis of your spending categories
- Balance trend analysis
- Financial health indicators
- Customized recommendations

### Quick Actions
- Pre-defined questions for common financial queries
- Real-time financial data analysis
- Contextual advice based on your current financial situation

## Usage

### Getting Started
1. **Sign up/Login**: Create an account or sign in with Google
2. **Add Transactions**: Start by adding your income and expenses
3. **View Dashboard**: Monitor your financial overview
4. **Chat with AI**: Click the chat button to get personalized financial advice

### Using the AI Assistant
1. **Click the chat icon** in the bottom-right corner
2. **Ask questions** about your finances:
   - "How can I save more money?"
   - "What's my spending pattern?"
   - "Budgeting tips for beginners"
   - "How to reduce expenses?"
3. **Get insights**: The AI analyzes your data and provides personalized recommendations
4. **Quick questions**: Use the suggested questions for common queries

## Technology Stack

- **Frontend**: React.js, Ant Design
- **Backend**: Firebase (Firestore, Authentication)
- **AI**: Google Gemini Pro
- **Charts**: ApexCharts
- **Styling**: CSS3 with modern animations

## Project Structure

```
src/
├── components/
│   ├── ChatBot/           # AI chatbot component
│   ├── Cards/            # Financial overview cards
│   ├── Charts/           # Data visualization
│   ├── Modals/           # Add income/expense modals
│   └── ...
├── contexts/
│   └── FinancialContext.js  # Global state management
├── services/
│   └── aiService.js      # AI integration service
├── pages/
│   ├── Dashboard.js      # Main dashboard
│   └── Signup.js         # Authentication
└── ...
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security Notes

- The Google Gemini API key should be kept secure
- Firebase configuration is public and safe to expose
- User data is stored securely in Firebase Firestore
- All API calls are made from the client-side (consider moving to backend for production)

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository or contact the development team.
