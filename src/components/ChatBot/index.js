import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, Typography, Spin, Tooltip } from 'antd';
import { 
  MessageOutlined, 
  SendOutlined, 
  CloseOutlined, 
  RobotOutlined,
  UserOutlined,
  BulbOutlined,
  DownOutlined,
  DownloadOutlined,
  MinusOutlined
} from '@ant-design/icons';
import { useFinancialContext } from '../../contexts/FinancialContext';
import { getFinancialAdvice, getQuickInsights } from '../../services/aiService';
import './styles.css';

const { TextArea } = Input;
const { Text, Title } = Typography;

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef(null);
  const { financialData } = useFinancialContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when loading state changes
    if (!isLoading) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isLoading]);

  useEffect(() => {
    // Load quick insights when component mounts
    const loadInsights = async () => {
      const quickInsights = await getQuickInsights(financialData);
      setInsights(quickInsights);
    };
    loadInsights();
  }, [financialData]);

  // Persist and restore chat history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('financely_chat_messages');
      if (saved) {
        setMessages(JSON.parse(saved));
        setShowSuggestions(false);
      } else {
        // Initialize with welcome message once
        const welcomeMessage = {
          id: Date.now(),
          text: `Hello! I'm your personal finance assistant. I can help you with budgeting, saving tips, expense analysis, and financial planning. \n\nI can see you have ₹${financialData.currentBalance} in your current balance. How can I help you today?`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages([welcomeMessage]);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('financely_chat_messages', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    console.log('Sending message:', inputMessage);
    console.log('Financial data:', financialData);

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      console.log('Calling getFinancialAdvice...');
      const aiResponse = await getFinancialAdvice(inputMessage, financialData);
      console.log('AI Response:', aiResponse);
      
      const botMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `I'm sorry, I'm having trouble connecting right now. Error: ${error.message}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "How can I save more money?",
    "What's my spending pattern?",
    "Budgeting tips for beginners",
    "How to reduce expenses?"
  ];

  const exampleQuestions = [
    "How much should I save each month?",
    "What are my biggest expenses?",
    "Should I invest my money?",
    "How to create a budget?",
    "What's my financial health score?",
    "How to track my expenses better?"
  ];

  const suggestedPrompts = [
    "Analyze this month's spending",
    "Top 3 ways to cut expenses",
    "Create a 50/30/20 budget for me",
    "Build a 6-month savings plan",
    "Which subscriptions should I cancel?",
    "Set a weekly spending limit",
    "Forecast my month-end balance",
    "Tips to increase my savings rate",
    "Am I overspending this week?",
    "How to manage debt effectively?"
  ];

  const handleQuickQuestion = (question) => {
    console.log('Quick question clicked:', question);
    
    const userMessage = {
      id: Date.now(),
      text: question,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Call AI service directly with the question
    getFinancialAdvice(question, financialData)
      .then(aiResponse => {
        console.log('AI Response:', aiResponse);
        const botMessage = {
          id: Date.now() + 1,
          text: aiResponse,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, botMessage]);
      })
      .catch(error => {
        console.error('Error in handleQuickQuestion:', error);
        const errorMessage = {
          id: Date.now() + 1,
          text: `I'm sorry, I'm having trouble connecting right now. Error: ${error.message}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, errorMessage]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleSuggestionClick = (prompt) => {
    handleQuickQuestion(prompt);
    setShowSuggestions(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('financely_chat_messages');
    const welcomeMessage = {
      id: Date.now(),
      text: `Hello! I'm your personal finance assistant. I can help you with budgeting, saving tips, expense analysis, and financial planning. \n\nI can see you have ₹${financialData.currentBalance} in your current balance. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages([welcomeMessage]);
    setShowSuggestions(true);
  };

  const exportChat = () => {
    const blob = new Blob([messages.map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finance-assistant-chat.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggleCollapsed = () => setIsCollapsed(prev => !prev);

  return (
    <div className="chatbot-container">
      {isCollapsed ? (
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<MessageOutlined />}
          className="chat-toggle-btn"
          onClick={() => setIsCollapsed(false)}
          title="Open Finance Assistant"
        />
      ) : (
      <Card className="chat-window" bodyStyle={{ padding: 0 }}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-title">
              <div className="bot-icon">
                <RobotOutlined />
              </div>
              <Title level={5} style={{ margin: 0, color: '#262626', fontWeight: 600 }}>
                Finance Assistant
              </Title>
            </div>
            <div>
              <Button type="text" onClick={() => setIsCollapsed(true)} className="minimize-btn" title="Minimize" aria-label="Minimize chatbot">
                <MinusOutlined />
              </Button>
              <Button type="text" onClick={exportChat} className="close-btn" title="Export chat">
                <DownloadOutlined />
              </Button>
              <Button type="text" onClick={clearChat} className="close-btn" title="Clear chat">
                <CloseOutlined />
              </Button>
            </div>
          </div>

          {/* Quick Insights */}
          {insights.length > 0 && !isCollapsed && (
            <div className="insights-section">
              <div className="insights-header">
                <BulbOutlined className="insight-icon" />
                <Text strong>Quick Insights</Text>
              </div>
              <div className="insights-list">
                {insights.map((insight, index) => (
                  <div key={index} className="insight-item">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {!isCollapsed && (
          <div className="messages-container">
            {/* Inline suggestion chips (top) */}
            {showSuggestions && messages.length <= 1 && (
              <div className="suggestion-chips" role="list">
                {suggestedPrompts.map((p, i) => (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => handleSuggestionClick(p)}
                    role="listitem"
                    aria-label={`Suggestion: ${p}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender}`}
              >
                <div className="message-content">
                  <div className="message-avatar">
                    {message.sender === 'user' ? (
                      <UserOutlined />
                    ) : (
                      <RobotOutlined />
                    )}
                  </div>
                  <div className="message-bubble">
                    <Text>{message.text}</Text>
                    <div className="message-time">{message.timestamp}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot">
                <div className="message-content">
                  <div className="message-avatar">
                    <RobotOutlined />
                  </div>
                  <div className="message-bubble typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
            
            {/* Scroll to bottom button */}
            {messages.length > 3 && (
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<DownOutlined />}
                className="scroll-to-bottom-btn"
                onClick={scrollToBottom}
                title="Scroll to bottom"
              />
            )}
          </div>
          )}

          {/* Quick Questions - Show when no messages or only welcome message */}
          {messages.length <= 1 && (
            <div className="quick-questions">
              <Text type="secondary" className="quick-questions-label">
                Try asking me:
              </Text>
              <div className="quick-questions-list">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    type="dashed"
                    size="small"
                    onClick={() => handleQuickQuestion(question)}
                    className="quick-question-btn"
                  >
                    {question}
                  </Button>
                ))}
              </div>
              <div className="input-hint">
                <Text type="secondary">
                  💡 Or type your own question below
                </Text>
              </div>
            </div>
          )}

          {/* Input Area */}
          {!isCollapsed && (
          <div className="input-area">
            <div className="input-container">
              <TextArea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your finances... (e.g., 'How can I save more money?', 'What's my spending pattern?')"
                autoSize={{ minRows: 1, maxRows: 3 }}
                className="message-input"
                autoFocus={false}
                allowClear
              />
              <Button
                type="primary"
                shape="circle"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-btn"
                title="Send message (Enter)"
              />
            </div>
            <div className="input-help">
              <Text type="secondary">
                Press Enter to send • Shift+Enter for new line
              </Text>
            </div>
            
            {/* Show example questions when user starts typing */}
            {inputMessage.length > 0 && inputMessage.length < 3 && (
              <div className="example-questions">
                <Text type="secondary" style={{ marginBottom: '6px', display: 'block' }}>
                  💡 Try asking:
                </Text>
                <div className="example-questions-list">
                  {exampleQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      type="text"
                      size="small"
                      onClick={() => setInputMessage(question)}
                      className="example-question-btn"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          )}
      </Card>
      )}
    </div>
  );
};

export default ChatBot;
