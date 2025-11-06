import React, { useMemo } from "react";
import "./styles.css";
import { Button, Card, Row, Col, Statistic, Tag } from "antd";
import { 
  WalletOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  PlusOutlined,
  LineChartOutlined
} from "@ant-design/icons";

const Cards = React.memo(({
  showExpenseModal,
  showIncomeModal,
  income,
  expense,
  currentBalance,
  financialHealth,
}) => {
  // Memoize calculations
  const savingsRate = useMemo(() => {
    return income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0;
  }, [income, expense]);

  const isPositive = useMemo(() => currentBalance >= 0, [currentBalance]);

  const netSavings = useMemo(() => income - expense, [income, expense]);

  return (
    <div className="cards-container">
      <Row gutter={[16, 16]} className="card-row">
        <Col xs={24} sm={12} lg={8}>
          <Card className="finance-card balance-card" hoverable>
            <Statistic
              title={
                <div className="card-title">
                  <WalletOutlined /> Current Balance
                </div>
              }
              value={Math.abs(currentBalance)}
              prefix={isPositive ? "₹" : "-₹"}
              valueStyle={{ 
                color: isPositive ? '#52c41a' : '#ff4d4f',
                fontSize: '28px',
                fontWeight: 'bold'
              }}
            />
            <div className="card-footer">
              <Tag color={isPositive ? 'success' : 'error'}>
                {isPositive ? 'Positive' : 'Negative'}
              </Tag>
              {financialHealth && (
                <Tag color={
                  financialHealth.healthScore >= 80 ? 'green' : 
                  financialHealth.healthScore >= 60 ? 'orange' : 'red'
                }>
                  Health: {financialHealth.healthScore}/100
                </Tag>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="finance-card income-card" hoverable>
            <Statistic
              title={
                <div className="card-title">
                  <ArrowUpOutlined /> Total Income
                </div>
              }
              value={income}
              prefix="₹"
              precision={0}
              valueStyle={{ 
                color: '#52c41a',
                fontSize: '28px',
                fontWeight: 'bold'
              }}
            />
            <div className="card-footer">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={showIncomeModal}
                className="action-btn"
                block
              >
                Add Income
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="finance-card expense-card" hoverable>
            <Statistic
              title={
                <div className="card-title">
                  <ArrowDownOutlined /> Total Expenses
                </div>
              }
              value={expense}
              prefix="₹"
              precision={0}
              valueStyle={{ 
                color: '#ff4d4f',
                fontSize: '28px',
                fontWeight: 'bold'
              }}
            />
            <div className="card-footer">
              <Button 
                type="primary" 
                danger
                icon={<PlusOutlined />}
                onClick={showExpenseModal}
                className="action-btn"
                block
              >
                Add Expense
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="finance-card stat-card" hoverable>
            <Statistic
              title="Savings Rate"
              value={savingsRate}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ 
                color: savingsRate >= 20 ? '#52c41a' : 
                       savingsRate >= 10 ? '#faad14' : '#ff4d4f',
                fontSize: '24px'
              }}
            />
            <div className="stat-hint">
              {savingsRate >= 20 
                ? 'Excellent!' 
                : savingsRate >= 10 
                ? 'Good' 
                : 'Needs improvement'}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="finance-card stat-card" hoverable>
            <Statistic
              title="Net Savings"
              value={netSavings}
              prefix="₹"
              precision={0}
              valueStyle={{ 
                color: netSavings >= 0 ? '#52c41a' : '#ff4d4f',
                fontSize: '24px'
              }}
            />
            <div className="stat-hint">
              {income > 0 ? `${savingsRate}% of income` : 'N/A'}
            </div>
          </Card>
        </Col>

        {financialHealth && (
          <>
            <Col xs={24} sm={12} lg={6}>
              <Card className="finance-card stat-card" hoverable>
                <Statistic
                  title="Predicted Expense"
                  value={financialHealth.predictedExpense}
                  prefix="₹"
                  precision={0}
                  valueStyle={{ 
                    color: '#1890ff',
                    fontSize: '24px'
                  }}
                />
                <div className="stat-hint">Next month forecast</div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card className="finance-card stat-card" hoverable>
                <Statistic
                  title="Risk Level"
                  value={financialHealth.riskLevel}
                  valueStyle={{ 
                    color: financialHealth.healthScore >= 80 ? '#52c41a' : 
                           financialHealth.healthScore >= 60 ? '#faad14' : '#ff4d4f',
                    fontSize: '24px',
                    fontWeight: 'bold'
                  }}
                />
                <div className="stat-hint">
                  {financialHealth.healthScore >= 80 
                    ? 'Low risk' 
                    : financialHealth.healthScore >= 60 
                    ? 'Medium risk' 
                    : 'High risk'}
                </div>
              </Card>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
});

Cards.displayName = 'Cards';

export default Cards;
