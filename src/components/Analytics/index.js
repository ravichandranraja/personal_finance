import React, { useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, Tag } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  DollarOutlined,
  LineChartOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import ReactApexChart from 'react-apexcharts';
import { analyzeSpendingPatterns } from '../../services/aiService';
import './styles.css';

const Analytics = React.memo(({ transactions = [], income = 0, expense = 0 }) => {
  // Memoize expensive pattern analysis
  const patterns = useMemo(() => analyzeSpendingPatterns(transactions), [transactions]);
  
  // Memoize calculations
  const expenseTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'expense'), 
    [transactions]
  );
  
  const incomeTransactions = useMemo(() => 
    transactions.filter(t => t.type === 'income'), 
    [transactions]
  );
  
  const avgExpense = useMemo(() => 
    expenseTransactions.length > 0 ? expense / expenseTransactions.length : 0,
    [expenseTransactions.length, expense]
  );
  
  const avgIncome = useMemo(() => 
    incomeTransactions.length > 0 ? income / incomeTransactions.length : 0,
    [incomeTransactions.length, income]
  );
  
  const savingsRate = useMemo(() => 
    income > 0 ? ((income - expense) / income * 100).toFixed(1) : 0,
    [income, expense]
  );

  // Memoize category chart data
  const categoryChartData = useMemo(() => {
    const categories = Object.keys(patterns.byCategory).slice(0, 6);
    const values = Object.values(patterns.byCategory).slice(0, 6);
    
    return {
      options: {
        chart: {
          type: 'donut',
          toolbar: { show: false }
        },
        labels: categories,
        colors: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'],
        legend: {
          position: 'bottom'
        },
        dataLabels: {
          enabled: true,
          formatter: function(val) {
            return val.toFixed(1) + "%";
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '70%',
              labels: {
                show: true,
                total: {
                  show: true,
                  label: 'Total Expenses',
                  formatter: function() {
                    return '₹' + expense.toLocaleString();
                  }
                }
              }
            }
          }
        },
        tooltip: {
          y: {
            formatter: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        }
      },
      series: values
    };
  }, [patterns.byCategory, expense]);

  // Memoize monthly trend data
  const monthlyTrendData = useMemo(() => {
    const monthlyData = {};
    transactions.forEach(t => {
      if (t.date) {
        const month = t.date.split('-').slice(1).join('-');
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          monthlyData[month].income += parseFloat(t.amount || 0);
        } else {
          monthlyData[month].expense += parseFloat(t.amount || 0);
        }
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
      options: {
        chart: {
          type: 'area',
          toolbar: { show: false },
          stacked: false
        },
        dataLabels: { enabled: false },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        xaxis: {
          categories: sortedMonths
        },
        colors: ['#52c41a', '#ff4d4f'],
        fill: {
          type: 'gradient',
          gradient: {
            opacityFrom: 0.6,
            opacityTo: 0.8
          }
        },
        legend: {
          position: 'top'
        },
        tooltip: {
          y: {
            formatter: function(value) {
              return '₹' + value.toLocaleString();
            }
          }
        }
      },
      series: [
        {
          name: 'Income',
          data: sortedMonths.map(month => monthlyData[month].income)
        },
        {
          name: 'Expenses',
          data: sortedMonths.map(month => monthlyData[month].expense)
        }
      ],
      sortedMonths
    };
  }, [transactions]);

  // Memoize top categories
  const topCategories = useMemo(() => 
    Object.entries(patterns.byCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5),
    [patterns.byCategory]
  );

  return (
    <div className="analytics-dashboard">
      <Card title={<><PieChartOutlined /> Financial Analytics</>} className="analytics-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Total Transactions"
                value={transactions.length}
                prefix={<LineChartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Average Expense"
                value={avgExpense}
                prefix={<DollarOutlined />}
                suffix="₹"
                precision={0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Average Income"
                value={avgIncome}
                prefix={<DollarOutlined />}
                suffix="₹"
                precision={0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="stat-card">
              <Statistic
                title="Savings Rate"
                value={savingsRate}
                prefix={<ArrowUpOutlined />}
                suffix="%"
                valueStyle={{ 
                  color: savingsRate >= 20 ? '#52c41a' : savingsRate >= 10 ? '#faad14' : '#ff4d4f' 
                }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Expense by Category" className="chart-card">
              {topCategories.length > 0 ? (
                <>
                  <ReactApexChart
                    options={categoryChartData.options}
                    series={categoryChartData.series}
                    type="donut"
                    height={300}
                  />
                  <div className="category-list">
                    {topCategories.map(([category, amount], index) => {
                      const percentage = (amount / expense * 100).toFixed(1);
                      return (
                        <div key={category} className="category-item">
                          <div className="category-info">
                            <Tag color={['blue', 'green', 'orange', 'red', 'purple'][index]}>
                              {category}
                            </Tag>
                            <span className="category-amount">₹{amount.toLocaleString()}</span>
                          </div>
                          <Progress 
                            percent={parseFloat(percentage)} 
                            showInfo={false}
                            strokeColor={['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'][index]}
                          />
                          <span className="category-percentage">{percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="no-data">No expense data available</div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Income vs Expenses Trend" className="chart-card">
              {monthlyTrendData.sortedMonths.length > 0 ? (
                <ReactApexChart
                  options={monthlyTrendData.options}
                  series={monthlyTrendData.series}
                  type="area"
                  height={300}
                />
              ) : (
                <div className="no-data">No trend data available</div>
              )}
            </Card>
          </Col>
        </Row>

        {patterns.mostExpensiveDay && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title="Spending Insights" className="insights-card">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <div className="insight-item">
                      <div className="insight-label">Most Expensive Day</div>
                      <div className="insight-value">{patterns.mostExpensiveDay[0]}</div>
                      <div className="insight-amount">₹{patterns.mostExpensiveDay[1].toLocaleString()}</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="insight-item">
                      <div className="insight-label">Average Transaction</div>
                      <div className="insight-value">₹{patterns.averageTransaction.toLocaleString()}</div>
                    </div>
                  </Col>
                  <Col xs={24} sm={8}>
                    <div className="insight-item">
                      <div className="insight-label">Top Category</div>
                      <div className="insight-value">{patterns.mostExpensiveCategory?.[0] || 'N/A'}</div>
                      <div className="insight-amount">₹{patterns.mostExpensiveCategory?.[1]?.toLocaleString() || 0}</div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        )}
      </Card>
    </div>
  );
});

Analytics.displayName = 'Analytics';

export default Analytics;
