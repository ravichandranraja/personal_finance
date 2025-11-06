import React, { useState, useEffect } from 'react';
import { Card, Button, Progress, Modal, Form, Input, InputNumber, Select, Tag, Empty, Statistic } from 'antd';
import { PlusOutlined, DeleteOutlined, TrophyOutlined, CheckCircleOutlined, TargetOutlined } from '@ant-design/icons';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { toast } from 'react-toastify';
import './styles.css';

const { TextArea } = Input;
const { Option } = Select;

const FinancialGoals = ({ currentBalance = 0 }) => {
  const [user] = useAuthState(auth);
  const [goals, setGoals] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Fetch goals from Firebase
  const fetchGoals = async () => {
    if (!user) return;
    try {
      const goalsRef = collection(db, `users/${user.uid}/goals`);
      const querySnapshot = await getDocs(goalsRef);
      const goalsList = [];
      querySnapshot.forEach((doc) => {
        goalsList.push({ ...doc.data(), id: doc.id });
      });
      // Sort by priority and completion status
      goalsList.sort((a, b) => {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
        return (b.priority || 0) - (a.priority || 0);
      });
      setGoals(goalsList);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [user]);

  // Add new goal
  const handleAddGoal = async (values) => {
    if (!user) return;
    try {
      await addDoc(collection(db, `users/${user.uid}/goals`), {
        name: values.name,
        description: values.description || '',
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount || 0,
        targetDate: values.targetDate || null,
        priority: values.priority || 'medium',
        category: values.category || 'general',
        completed: false,
        createdAt: new Date().toISOString()
      });
      toast.success('Financial goal created successfully!');
      form.resetFields();
      setIsModalVisible(false);
      fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to create goal');
    }
  };

  // Update goal progress
  const handleUpdateProgress = async (goalId, newAmount) => {
    if (!user) return;
    try {
      const goalRef = doc(db, `users/${user.uid}/goals`, goalId);
      await updateDoc(goalRef, {
        currentAmount: newAmount,
        completed: newAmount >= goals.find(g => g.id === goalId).targetAmount
      });
      toast.success('Goal progress updated!');
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/goals`, goalId));
      toast.success('Goal deleted successfully!');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  // Calculate goal progress
  const getGoalProgress = (goal) => {
    const percentage = (goal.currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - goal.currentAmount;
    const isCompleted = goal.completed || goal.currentAmount >= goal.targetAmount;
    
    return {
      percentage: Math.min(100, Math.max(0, percentage)),
      remaining,
      isCompleted,
      daysRemaining: goal.targetDate ? Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
    };
  };

  const completedGoals = goals.filter(g => g.completed || g.currentAmount >= g.targetAmount).length;
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="financial-goals">
      <Card 
        title={
          <div className="goals-header">
            <TrophyOutlined /> <span>Financial Goals</span>
          </div>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsModalVisible(true)}
          >
            Add Goal
          </Button>
        }
        className="goals-card"
      >
        {goals.length === 0 ? (
          <Empty 
            description="No financial goals set yet. Create one to track your savings targets!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => setIsModalVisible(true)}>
              Create Your First Goal
            </Button>
          </Empty>
        ) : (
          <>
            <div className="goals-summary">
              <Statistic
                title="Total Goals"
                value={goals.length}
                suffix={`/ ${completedGoals} completed`}
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="Total Target"
                value={totalTargetAmount}
                prefix="₹"
                valueStyle={{ color: '#262626' }}
              />
              <Statistic
                title="Progress"
                value={totalCurrentAmount}
                prefix="₹"
                suffix={`of ₹${totalTargetAmount.toLocaleString()}`}
                valueStyle={{ color: '#52c41a' }}
              />
            </div>

            <div className="goals-list">
              {goals.map((goal) => {
                const progress = getGoalProgress(goal);
                return (
                  <Card
                    key={goal.id}
                    className={`goal-item ${progress.isCompleted ? 'goal-completed' : ''}`}
                    actions={[
                      <Button
                        key="update"
                        type="link"
                        onClick={() => {
                          const newAmount = prompt(`Update progress for "${goal.name}" (Current: ₹${goal.currentAmount})`, goal.currentAmount);
                          if (newAmount !== null && !isNaN(newAmount)) {
                            handleUpdateProgress(goal.id, parseFloat(newAmount));
                          }
                        }}
                      >
                        Update Progress
                      </Button>,
                      <DeleteOutlined 
                        key="delete" 
                        onClick={() => handleDeleteGoal(goal.id)}
                        style={{ color: '#ff4d4f' }}
                      />
                    ]}
                  >
                    <div className="goal-item-header">
                      <div>
                        <h3>
                          {goal.name}
                          {progress.isCompleted && (
                            <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
                          )}
                        </h3>
                        <div className="goal-tags">
                          <Tag color={goal.priority === 'high' ? 'red' : goal.priority === 'medium' ? 'orange' : 'blue'}>
                            {goal.priority} priority
                          </Tag>
                          <Tag>{goal.category}</Tag>
                          {progress.daysRemaining !== null && (
                            <Tag color={progress.daysRemaining < 30 ? 'red' : progress.daysRemaining < 90 ? 'orange' : 'green'}>
                              {progress.daysRemaining > 0 ? `${progress.daysRemaining} days left` : 'Overdue'}
                            </Tag>
                          )}
                        </div>
                      </div>
                      <div className="goal-amount">
                        ₹{goal.currentAmount.toLocaleString()} / ₹{goal.targetAmount.toLocaleString()}
                      </div>
                    </div>
                    
                    {goal.description && (
                      <p className="goal-description">{goal.description}</p>
                    )}
                    
                    <Progress
                      percent={progress.percentage}
                      status={progress.isCompleted ? 'success' : 'active'}
                      strokeColor={progress.isCompleted ? '#52c41a' : '#1890ff'}
                    />
                    
                    <div className="goal-status">
                      {progress.isCompleted ? (
                        <span className="status-text success">
                          <CheckCircleOutlined /> Goal Achieved! 🎉
                        </span>
                      ) : (
                        <span className="status-text">
                          <TargetOutlined /> ₹{progress.remaining.toLocaleString()} remaining
                          {progress.daysRemaining !== null && progress.daysRemaining > 0 && (
                            <span className="days-remaining"> • {progress.daysRemaining} days left</span>
                          )}
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
        title="Create Financial Goal"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddGoal}
        >
          <Form.Item
            name="name"
            label="Goal Name"
            rules={[{ required: true, message: 'Please enter goal name' }]}
          >
            <Input placeholder="e.g., Emergency Fund, Vacation, House Down Payment" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea 
              rows={3} 
              placeholder="Add details about your goal (optional)"
            />
          </Form.Item>

          <Form.Item
            name="targetAmount"
            label="Target Amount (₹)"
            rules={[
              { required: true, message: 'Please enter target amount' },
              { type: 'number', min: 1, message: 'Amount must be greater than 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter target amount"
              min={1}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="currentAmount"
            label="Current Amount (₹)"
            initialValue={0}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Current progress (optional)"
              min={0}
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="targetDate"
            label="Target Date"
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priority"
            initialValue="medium"
          >
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            initialValue="general"
          >
            <Select>
              <Option value="emergency">Emergency Fund</Option>
              <Option value="vacation">Vacation</Option>
              <Option value="house">House</Option>
              <Option value="car">Car</Option>
              <Option value="education">Education</Option>
              <Option value="retirement">Retirement</Option>
              <Option value="general">General</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Goal
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancialGoals;

