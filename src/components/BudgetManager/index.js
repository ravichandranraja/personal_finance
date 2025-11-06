import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Button, Progress, Modal, Form, InputNumber, Select, Tag, Empty, Statistic } from 'antd';
import { PlusOutlined, DeleteOutlined, DollarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import './styles.css';

const { Option } = Select;

const BudgetManager = React.memo(({ transactions = [] }) => {
  const [user] = useAuthState(auth);
  const [budgets, setBudgets] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Memoize spending calculation
  const spendingByCategory = useMemo(() => {
    const spending = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.name || transaction.category || 'Uncategorized';
        spending[category] = (spending[category] || 0) + parseFloat(transaction.amount || 0);
      });
    return spending;
  }, [transactions]);

  // Fetch budgets from Firebase
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
    } catch (error) {
      console.error('Error fetching budgets:', error);
      toast.error('Failed to load budgets');
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Add new budget
  const handleAddBudget = useCallback(async (values) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/budgets`), {
        category: values.category,
        limit: values.limit,
        period: values.period || 'monthly',
        createdAt: new Date().toISOString()
      });
      toast.success('Budget added successfully!');
      form.resetFields();
      setIsModalVisible(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error adding budget:', error);
      toast.error('Failed to add budget');
    }
  }, [user, form, fetchBudgets]);

  // Delete budget
  const handleDeleteBudget = useCallback(async (budgetId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/budgets`, budgetId));
      toast.success('Budget deleted successfully!');
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  }, [user, fetchBudgets]);

  // Memoize budget status calculation
  const getBudgetStatus = useCallback((budget) => {
    const spent = spendingByCategory[budget.category] || 0;
    const percentage = (spent / budget.limit) * 100;
    const remaining = budget.limit - spent;
    const isOverBudget = spent > budget.limit;

    return {
      spent,
      remaining,
      percentage: Math.min(100, Math.max(0, percentage)),
      isOverBudget,
      status: isOverBudget ? 'over' : percentage >= 80 ? 'warning' : 'good'
    };
  }, [spendingByCategory]);

  // Memoize available categories
  const availableCategories = useMemo(() => {
    const categories = new Set();
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categories.add(t.name || t.category || 'Uncategorized');
      }
    });
    return Array.from(categories);
  }, [transactions]);

  // Memoize summary calculations
  const summary = useMemo(() => {
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets.reduce((sum, b) => {
      const status = getBudgetStatus(b);
      return sum + status.spent;
    }, 0);
    return { totalBudgetLimit, totalSpent, remaining: totalBudgetLimit - totalSpent };
  }, [budgets, getBudgetStatus]);

  return (
    <div className="budget-manager">
      <Card 
        title={
          <div className="budget-header">
            <DollarOutlined /> <span>Budget Management</span>
          </div>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
          >
            Add Budget
          </Button>
        }
        className="budget-card"
      >
        {budgets.length === 0 ? (
          <Empty 
            description="No budgets set yet. Create one to track your spending limits!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => setIsModalVisible(true)}>
              Create Your First Budget
            </Button>
          </Empty>
        ) : (
          <>
            <div className="budget-summary">
              <Statistic
                title="Total Budget Limit"
                value={summary.totalBudgetLimit}
                prefix="₹"
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="Total Spent"
                value={summary.totalSpent}
                prefix="₹"
                valueStyle={{ color: summary.totalSpent > summary.totalBudgetLimit ? '#ff4d4f' : '#52c41a' }}
              />
              <Statistic
                title="Remaining"
                value={summary.remaining}
                prefix="₹"
                valueStyle={{ color: '#262626' }}
              />
            </div>

            <div className="budget-list">
              {budgets.map((budget) => {
                const status = getBudgetStatus(budget);
                return (
                  <Card
                    key={budget.id}
                    className={`budget-item budget-${status.status}`}
                    actions={[
                      <DeleteOutlined 
                        key="delete" 
                        onClick={() => handleDeleteBudget(budget.id)}
                        style={{ color: '#ff4d4f' }}
                      />
                    ]}
                  >
                    <div className="budget-item-header">
                      <div>
                        <h3>{budget.category}</h3>
                        <Tag color={status.isOverBudget ? 'red' : status.status === 'warning' ? 'orange' : 'green'}>
                          {status.isOverBudget ? 'Over Budget' : status.status === 'warning' ? 'Warning' : 'On Track'}
                        </Tag>
                      </div>
                      <div className="budget-amount">
                        ₹{status.spent.toLocaleString()} / ₹{budget.limit.toLocaleString()}
                      </div>
                    </div>
                    
                    <Progress
                      percent={status.percentage}
                      status={status.isOverBudget ? 'exception' : status.percentage >= 80 ? 'active' : 'success'}
                      strokeColor={
                        status.isOverBudget 
                          ? '#ff4d4f' 
                          : status.percentage >= 80 
                          ? '#faad14' 
                          : '#52c41a'
                      }
                      showInfo={false}
                    />
                    
                    <div className="budget-status">
                      {status.isOverBudget ? (
                        <span className="status-text error">
                          <CloseCircleOutlined /> Over by ₹{Math.abs(status.remaining).toLocaleString()}
                        </span>
                      ) : (
                        <span className="status-text success">
                          <CheckCircleOutlined /> ₹{status.remaining.toLocaleString()} remaining
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </Card>

      <Modal
        title="Add New Budget"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddBudget}
        >
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              placeholder="Select or enter category"
              showSearch
              allowClear
              notFoundContent={null}
              mode="combobox"
            >
              {availableCategories.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="limit"
            label="Budget Limit (₹)"
            rules={[
              { required: true, message: 'Please enter budget limit' },
              { type: 'number', min: 1, message: 'Budget must be greater than 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter budget limit"
              min={1}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="period"
            label="Period"
            initialValue="monthly"
          >
            <Select>
              <Option value="weekly">Weekly</Option>
              <Option value="monthly">Monthly</Option>
              <Option value="yearly">Yearly</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Budget
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});

BudgetManager.displayName = 'BudgetManager';

export default BudgetManager;
