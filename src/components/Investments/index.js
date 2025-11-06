import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Input, InputNumber, Select, Statistic, Tag, Tabs, Alert } from 'antd';
import { PieChartOutlined, PlusOutlined, CalculatorOutlined, AimOutlined } from '@ant-design/icons';
import ReactApexChart from 'react-apexcharts';

const { Option } = Select;

const DEFAULT_ASSET_CLASSES = [
	{ key: 'equity', label: 'Equity', color: '#1890ff' },
	{ key: 'debt', label: 'Debt', color: '#52c41a' },
	{ key: 'gold', label: 'Gold', color: '#faad14' },
	{ key: 'crypto', label: 'Crypto', color: '#722ed1' },
	{ key: 'cash', label: 'Cash', color: '#13c2c2' }
];

const Investments = () => {
	const [holdings, setHoldings] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [form] = Form.useForm();
    const [sipResult, setSipResult] = useState(null);
    const [riskProfile, setRiskProfile] = useState('balanced');

	useEffect(() => {
		try {
			const saved = localStorage.getItem('financely_investments');
			if (saved) setHoldings(JSON.parse(saved));
		} catch {}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem('financely_investments', JSON.stringify(holdings));
		} catch {}
	}, [holdings]);

	const totalValue = useMemo(() => holdings.reduce((s, h) => s + (Number(h.currentValue) || 0), 0), [holdings]);

	const allocationByClass = useMemo(() => {
		const map = new Map();
		holdings.forEach(h => {
			const key = h.assetClass || 'other';
			map.set(key, (map.get(key) || 0) + (Number(h.currentValue) || 0));
		});
		return map;
	}, [holdings]);

	const allocationChart = useMemo(() => {
		const entries = Array.from(allocationByClass.entries());
		const labels = entries.map(([k]) => DEFAULT_ASSET_CLASSES.find(a => a.key === k)?.label || k);
		const values = entries.map(([, v]) => v);
		const colors = entries.map(([k]) => DEFAULT_ASSET_CLASSES.find(a => a.key === k)?.color || '#91d5ff');
		return {
			options: {
				chart: { type: 'pie', toolbar: { show: false } },
				labels,
				colors,
				legend: { position: 'bottom' },
				tooltip: { y: { formatter: (val) => '₹' + Number(val).toLocaleString() } }
			},
			series: values
		};
	}, [allocationByClass]);

	const columns = [
		{ title: 'Name', dataIndex: 'name', key: 'name', render: (t) => <strong>{t}</strong> },
		{ title: 'Asset Class', dataIndex: 'assetClass', key: 'assetClass', render: (v) => {
			const a = DEFAULT_ASSET_CLASSES.find(x => x.key === v);
			return <Tag color={a?.color || 'blue'}>{a?.label || v}</Tag>;
		}},
		{ title: 'Units', dataIndex: 'units', key: 'units', align: 'right' },
		{ title: 'Buy Price', dataIndex: 'buyPrice', key: 'buyPrice', align: 'right', render: (v) => '₹' + Number(v || 0).toLocaleString() },
		{ title: 'Current Value', dataIndex: 'currentValue', key: 'currentValue', align: 'right', render: (v) => '₹' + Number(v || 0).toLocaleString() }
	];

	const openAdd = useCallback(() => setIsModalOpen(true), []);
	const closeAdd = useCallback(() => { setIsModalOpen(false); form.resetFields(); }, [form]);

	const onAddHolding = useCallback((values) => {
		setHoldings(prev => [
			...prev,
			{
				id: Date.now(),
				name: values.name,
				assetClass: values.assetClass,
				units: Number(values.units || 0),
				buyPrice: Number(values.buyPrice || 0),
				currentValue: Number(values.currentValue || 0)
			}
		]);
		closeAdd();
	}, [closeAdd]);

return (
    <div className="investments">
        <Tabs
            defaultActiveKey="portfolio"
            items={[
                {
                    key: 'portfolio',
                    label: 'Portfolio',
                    children: (
                        <Card title={<><PieChartOutlined /> Portfolio Overview</>} extra={<Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>Add Holding</Button>}>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={10}>
                                    <Card>
                                        <Statistic title="Total Portfolio Value" value={totalValue} prefix="₹" precision={0} valueStyle={{ color: '#262626' }} />
                                        <div style={{ marginTop: 16 }}>
                                            {allocationChart.series.length > 0 ? (
                                                <ReactApexChart options={allocationChart.options} series={allocationChart.series} type="pie" height={300} />
                                            ) : (
                                                <div>No allocation data</div>
                                            )}
                                        </div>
                                    </Card>
                                </Col>
                                <Col xs={24} md={14}>
                                    <Card title="Holdings">
                                        <Table rowKey="id" columns={columns} dataSource={holdings} size="middle" pagination={{ pageSize: 5 }} />
                                    </Card>
                                </Col>
                            </Row>
                        </Card>
                    )
                },
                {
                    key: 'tools',
                    label: 'Tools',
                    children: (
                        <Row gutter={[16,16]}>
                            <Col xs={24} md={12}>
                                <Card title={<><CalculatorOutlined /> SIP Calculator</>}>
                                    <SipCalculator onResult={setSipResult} />
                                    {sipResult && (
                                        <Alert style={{ marginTop: 12 }} type="info" showIcon message={`Future value: ₹${sipResult.futureValue.toLocaleString()} | Total invested: ₹${sipResult.totalInvested.toLocaleString()} | Gains: ₹${sipResult.gain.toLocaleString()}`} />
                                    )}
                                </Card>
                            </Col>
                            <Col xs={24} md={12}>
                                <Card title={<><AimOutlined /> Target Allocation</>}>
                                    <TargetAllocation riskProfile={riskProfile} onChange={setRiskProfile} />
                                </Card>
                            </Col>
                        </Row>
                    )
                }
            ]}
        />

			<Modal title="Add Holding" open={isModalOpen} onCancel={closeAdd} footer={null} destroyOnClose>
				<Form form={form} layout="vertical" onFinish={onAddHolding}>
					<Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please enter a name' }]}>
						<Input placeholder="e.g., NIFTY 50 ETF, US Stocks, Gold" />
					</Form.Item>
					<Form.Item name="assetClass" label="Asset Class" initialValue="equity" rules={[{ required: true }]}>
						<Select>
							{DEFAULT_ASSET_CLASSES.map(a => <Option value={a.key} key={a.key}>{a.label}</Option>)}
						</Select>
					</Form.Item>
					<Row gutter={12}>
						<Col span={8}>
							<Form.Item name="units" label="Units" initialValue={0}>
								<InputNumber min={0} style={{ width: '100%' }} />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item name="buyPrice" label="Buy Price (₹)" initialValue={0}>
								<InputNumber min={0} style={{ width: '100%' }} />
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item name="currentValue" label="Current Value (₹)" initialValue={0}>
								<InputNumber min={0} style={{ width: '100%' }} />
							</Form.Item>
						</Col>
					</Row>
					<Form.Item>
						<Button type="primary" htmlType="submit" block>Add</Button>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
};

function SipCalculator({ onResult }) {
  const [form] = Form.useForm();
  const onFinish = (values) => {
    const P = Number(values.monthly || 0);
    const r = Number(values.rate || 0) / 100 / 12;
    const n = Number(values.years || 0) * 12;
    const futureValue = r === 0 ? P * n : Math.round(P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    const totalInvested = P * n;
    const gain = futureValue - totalInvested;
    onResult?.({ futureValue, totalInvested, gain });
  };
  return (
    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ monthly: 5000, rate: 12, years: 10 }}>
      <Form.Item name="monthly" label="Monthly Investment (₹)" rules={[{ required: true }]}>
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="rate" label="Expected Annual Return (%)" rules={[{ required: true }]}>
        <InputNumber min={0} max={50} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="years" label="Years" rules={[{ required: true }]}>
        <InputNumber min={1} max={50} style={{ width: '100%' }} />
      </Form.Item>
      <Button type="primary" htmlType="submit" block>Calculate</Button>
    </Form>
  );
}

function TargetAllocation({ riskProfile, onChange }) {
  const presets = {
    conservative: { equity: 30, debt: 50, gold: 10, cash: 10 },
    balanced: { equity: 50, debt: 35, gold: 10, cash: 5 },
    aggressive: { equity: 70, debt: 20, gold: 5, cash: 5 }
  };
  const current = presets[riskProfile] || presets.balanced;
  const labels = Object.keys(current).map(k => DEFAULT_ASSET_CLASSES.find(a => a.key === k)?.label || k);
  const values = Object.values(current);
  const colors = Object.keys(current).map(k => DEFAULT_ASSET_CLASSES.find(a => a.key === k)?.color || '#91d5ff');
  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Select value={riskProfile} onChange={onChange} style={{ width: 200 }}>
          <Option value="conservative">Conservative</Option>
          <Option value="balanced">Balanced</Option>
          <Option value="aggressive">Aggressive</Option>
        </Select>
      </div>
      <ReactApexChart
        options={{ labels, colors, legend: { position: 'bottom' }, chart: { type: 'donut', toolbar: { show: false } } }}
        series={values}
        type="donut"
        height={260}
      />
    </div>
  );
}

export default React.memo(Investments);


