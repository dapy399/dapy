import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Row, Col, Card, Statistic, Avatar, theme as antTheme, Tag, Badge, List, Progress, Dropdown, Button } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  GlobalOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextFilled,
  CarFilled,
  ClusterOutlined,
  UserAddOutlined,
  SettingOutlined,
  BellOutlined,
  RocketOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '@/store/index';
import { useCountUp } from '@/utils/useCountUp';
import { dashboardStats, dashboardCharts } from '@/api/mock';

// ==========================================
// 亮点 3：实时 Dashboard（dashboard/index.tsx）
// ==========================================
// 【功能说明】
// 工作台页面：显示核心指标 + 图表 + 快捷操作 + 消息通知。
// 每 3 秒自动微调数据，模拟实时业务波动。
//
// 【技术亮点】
// 1. 实时数据：setInterval 每 3 秒微调 stats 和 charts
// 2. 数字跳动：useCountUp Hook 驱动四个核心指标平滑过渡
// 3. Framer Motion 动画：卡片错峰入场、hover 悬浮效果
// 4. ECharts 动态更新：数据变化后，图表自动重绘
// 5. 消息通知：与 HeaderBar 相同的下拉消息系统
//
// 【数据流】
// Mock 数据 → useState 存储 → setInterval 微调 → useCountUp 动画 → 显示

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppStore();
  const [stats, setStats] = useState(dashboardStats);
  const [charts, setCharts] = useState(dashboardCharts);

  // ==========================================
  // 亮点 3-1：消息通知数据（与 HeaderBar 相同逻辑）
  // ==========================================
  const [notices, setNotices] = useState([
    { id: 1, title: '新订单待处理', desc: '您有 12 笔新订单等待分配司机', time: '10分钟前', type: 'warning', read: false },
    { id: 2, title: '司机入驻审核', desc: '3 位新司机提交入驻申请', time: '30分钟前', type: 'processing', read: false },
    { id: 3, title: '系统公告', desc: 'v2.1.0 版本更新完成', time: '2小时前', type: 'success', read: false },
    { id: 4, title: '流水日报', desc: '昨日流水 ¥58,320', time: '今天 09:00', type: 'default', read: true },
  ]);

  const unreadCount = notices.filter((n) => !n.read).length;

  const deleteNotice = (id: number) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotices((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ==========================================
  // 亮点 3-2：实时数据模拟（每 3 秒微调）
  // ==========================================
  // 【实现原理】
  // 1. setInterval 每 3000ms 执行一次
  // 2. 用 Math.random() - 0.45 使得：
  //    - 55% 概率增长（random > 0.45）
  //    - 45% 概率下降（random < 0.45）
  // 3. Math.max 设置下限，防止数据变为负数或异常值
  // 4. setStats 和 setCharts 同时更新，保证数据一致性
  //
  // 【视觉效果】
  // 数字不是突变，而是通过 useCountUp Hook 平滑过渡
  // 图表数据也是渐变，ECharts 自动重绘动画
  useEffect(() => {
    const interval = setInterval(() => {
      // 更新统计指标（数字）
      setStats((prev) => ({
        driverCount: Math.max(800, prev.driverCount + Math.floor((Math.random() - 0.45) * 30)),
        totalRevenue: Math.max(3000000, prev.totalRevenue + Math.floor((Math.random() - 0.45) * 60000)),
        totalOrders: Math.max(70000, prev.totalOrders + Math.floor((Math.random() - 0.45) * 800)),
        cityCount: prev.cityCount + (Math.random() > 0.92 ? 1 : 0), // 8% 概率 +1
      }));

      // 更新图表数据（ECharts 会自动重绘）
      setCharts((prev) => ({
        ...prev,
        orderTrend: {
          months: prev.orderTrend.months,
          orders: prev.orderTrend.orders.map((v) =>
            Math.max(10000, v + Math.floor((Math.random() - 0.4) * 400))
          ),
          revenue: prev.orderTrend.revenue.map((v) =>
            Math.max(300, v + Math.floor((Math.random() - 0.4) * 40))
          ),
        },
        driverCity: prev.driverCity.map((d) => ({
          ...d,
          value: Math.max(50, d.value + Math.floor((Math.random() - 0.4) * 30)),
        })),
        driverAge: prev.driverAge.map((d) => ({
          ...d,
          value: Math.max(80, d.value + Math.floor((Math.random() - 0.4) * 40)),
        })),
        modelDiagnosis: prev.modelDiagnosis.map((d) => ({
          ...d,
          score: Math.min(100, Math.max(60, d.score + Math.floor((Math.random() - 0.5) * 10))),
        })),
      }));
    }, 3000);

    // 组件卸载时清除定时器，防止内存泄漏
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // 亮点 3-3：数字跳动动画（调用 useCountUp）
  // ==========================================
  // 每次 stats 变化，useCountUp 会自动从旧值平滑跳到新值
  const animDriverCount = useCountUp(stats.driverCount);
  const animRevenue = useCountUp(stats.totalRevenue);
  const animOrders = useCountUp(stats.totalOrders);
  const animCities = useCountUp(stats.cityCount);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = antTheme.useToken();

  // ==========================================
  // 亮点 3-4：ECharts 图表配置
  // ==========================================

  // 订单和流水走势图（折线图 + 双 Y 轴）
  const orderTrendOption = {
    title: { text: '订单和流水走势图', left: 'center', textStyle: { fontSize: 16 } },
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '流水(万)'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: { type: 'category', data: charts.orderTrend.months },
    yAxis: [
      { type: 'value', name: '订单量' },
      { type: 'value', name: '流水(万)' },
    ],
    series: [
      {
        name: '订单量',
        type: 'line',
        data: charts.orderTrend.orders,
        smooth: true,  // 平滑曲线
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          // 渐变填充（从半透明到全透明）
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24,144,255,0.3)' },
              { offset: 1, color: 'rgba(24,144,255,0.05)' },
            ],
          },
        },
      },
      {
        name: '流水(万)',
        type: 'line',
        yAxisIndex: 1,  // 使用第二个 Y 轴
        data: charts.orderTrend.revenue,
        smooth: true,
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  // 司机城市分布（饼图）
  const cityPieOption = {
    title: { text: '司机城市分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    series: [
      {
        name: '城市',
        type: 'pie',
        radius: ['40%', '70%'],  // 环形图（内半径 40%，外半径 70%）
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{d}%' },  // 显示名称和百分比
        data: charts.driverCity,
      },
    ],
  };

  // 司机年龄分布（饼图）
  const agePieOption = {
    title: { text: '司机年龄分布', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item' },
    series: [
      {
        name: '年龄段',
        type: 'pie',
        radius: '65%',
        data: charts.driverAge,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0,0,0,0.5)',
          },
        },
      },
    ],
  };

  // 模型诊断雷达图
  const radarOption = {
    title: { text: '模型诊断', left: 'center', textStyle: { fontSize: 14 } },
    tooltip: {},
    radar: {
      indicator: charts.modelDiagnosis.map((item) => ({ name: item.indicator, max: 100 })),
      radius: '65%',
    },
    series: [
      {
        name: '评分',
        type: 'radar',
        data: [
          {
            value: charts.modelDiagnosis.map((item) => item.score),
            name: '综合评分',
            areaStyle: { color: 'rgba(24,144,255,0.2)' },
            lineStyle: { color: '#1890ff' },
            itemStyle: { color: '#1890ff' },
          },
        ],
      },
    ],
  };

  // 核心指标卡片数据
  const statCards = [
    { title: '司机数量', value: animDriverCount, icon: <UserOutlined />, color: '#fa8c16', suffix: '人', trend: 8.2, trendUp: true },
    { title: '总流水', value: animRevenue, icon: <DollarOutlined />, color: '#722ed1', prefix: '¥', suffix: '', trend: 12.5, trendUp: true },
    { title: '总订单', value: animOrders, icon: <FileTextOutlined />, color: '#1890ff', suffix: '单', trend: 5.3, trendUp: true },
    { title: '开通城市', value: animCities, icon: <GlobalOutlined />, color: '#13c2c2', suffix: '个', trend: 2.1, trendUp: true },
  ];

  // 快捷操作入口
  const quickActions = [
    { label: '订单列表', icon: <FileTextFilled />, color: '#1677ff', path: '/order/list' },
    { label: '司机管理', icon: <CarFilled />, color: '#fa8c16', path: '/order/driver' },
    { label: '订单聚合', icon: <ClusterOutlined />, color: '#52c41a', path: '/order/cluster' },
    { label: '用户管理', icon: <UserAddOutlined />, color: '#722ed1', path: '/system/user' },
    { label: '系统设置', icon: <SettingOutlined />, color: '#8c8c8c', path: '/system/menu' },
    { label: '工作台', icon: <RocketOutlined />, color: '#13c2c2', path: '/dashboard' },
  ];

  // 本周任务进度
  const weeklyTasks = [
    { name: '订单处理', percent: 82, color: '#1677ff' },
    { name: '司机培训', percent: 65, color: '#52c41a' },
    { name: '客户回访', percent: 45, color: '#fa8c16' },
    { name: '数据归档', percent: 90, color: '#722ed1' },
  ];

  // ==========================================
  // 亮点 6：消息下拉内容（与 HeaderBar 相同逻辑）
  // ==========================================
  const noticeContent = (
    <div style={{ width: 320, maxHeight: 420, overflow: 'auto' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>消息通知</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead}>全部已读</Button>
        )}
      </div>
      {notices.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#bfbfbf' }}>暂无消息</div>
      ) : (
        notices.map((item) => (
          <div key={item.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', background: item.read ? 'transparent' : '#e6f4ff', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, marginRight: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: !item.read ? '#1677ff' : '#d9d9d9', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: item.read ? 400 : 600, color: '#262626' }}>{item.title}</span>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4, paddingLeft: 12 }}>{item.desc}</div>
                <div style={{ fontSize: 11, color: '#bfbfbf', paddingLeft: 12 }}>{item.time}</div>
              </div>
              <Button type="text" size="small" icon={<CloseOutlined style={{ fontSize: 10 }} />} onClick={(e) => { e.stopPropagation(); deleteNotice(item.id); }} style={{ color: '#bfbfbf', padding: 0, width: 20, height: 20 }} />
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      {/* 用户信息卡片 — Framer Motion 滑入淡入 */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <Card
          style={{ marginBottom: 20, borderRadius: borderRadiusLG }}
          bodyStyle={{ padding: '20px 24px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* 用户头像（纯图标，不加载图片）*/}
            <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>
                {state.user?.username || '管理员'}，早上好！👋
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                <span>用户ID: {state.user?.id || '--'}</span>
                <span>邮箱: {state.user?.email || '--'}</span>
                <span>手机: {state.user?.phone || '--'}</span>
                <span>岗位: <Tag color="blue">{state.user?.position || '--'}</Tag></span>
                <span>部门: <Tag color="green">{state.user?.department || '--'}</Tag></span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* 实时数据指示器（呼吸灯效果）*/}
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 12, color: '#52c41a', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#52c41a' }} />
                实时
              </motion.span>

              {/* ==========================================
                  亮点 6：消息通知下拉（Dashboard 右上角）
                  ==========================================*/}
              <Dropdown dropdownRender={() => noticeContent} trigger={['click']} placement="bottomRight">
                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: '#f0f5ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: unreadCount > 0 ? '#1677ff' : '#8c8c8c',
                      cursor: 'pointer',
                    }}
                  >
                    <BellOutlined style={{ fontSize: 16 }} />
                  </div>
                </Badge>
              </Dropdown>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 核心数据统计 — 错峰入场 + hover 悬浮 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <motion.div
              // 【亮点】错峰入场：每个卡片延迟 0.08s 入场，形成波浪效果
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * index, duration: 0.4, ease: 'easeOut' }}
              // 【亮点】hover 悬浮效果：向上移动 4px
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card
                style={{ borderRadius: borderRadiusLG, cursor: 'pointer' }}
                bodyStyle={{ padding: '18px 20px' }}
                hoverable
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ color: '#8c8c8c', marginBottom: 6, fontSize: 13 }}>{card.title}</p>
                    {/* 【亮点 3】数字跳动动画：animDriverCount/animRevenue/animOrders/animCities */}
                    <Statistic
                      value={card.value}
                      prefix={card.prefix}
                      suffix={card.suffix}
                      valueStyle={{ fontSize: 26, fontWeight: 'bold', color: card.color }}
                    />
                  </div>
                  {/* 【亮点 2】图标弹簧旋转动画 */}
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `${card.color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      color: card.color,
                    }}
                  >
                    {card.icon}
                  </motion.div>
                </div>
                {/* 趋势箭头 + 百分比 */}
                <div style={{ marginTop: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {card.trendUp ? (
                    <ArrowUpOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <ArrowDownOutlined style={{ color: '#f5222d' }} />
                  )}
                  <span style={{ color: card.trendUp ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
                    {card.trend}%
                  </span>
                  <span style={{ color: '#bfbfbf', marginLeft: 4 }}>较上月</span>
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* 快捷操作 + 通知 + 任务进度 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* 快捷入口 */}
        <Col xs={24} lg={8}>
          <Card
            title="快捷入口"
            style={{ borderRadius: borderRadiusLG, height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={[12, 12]}>
              {quickActions.map((item) => (
                <Col span={8} key={item.label}>
                  <div
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      padding: '12px 0',
                      borderRadius: 10,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${item.color}12`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 12, color: '#595959' }}>{item.label}</span>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 本周任务进度 */}
        <Col xs={24} lg={8}>
          <Card
            title="本周任务进度"
            style={{ borderRadius: borderRadiusLG, height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {weeklyTasks.map((task) => (
                <div key={task.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                    <span style={{ color: '#262626' }}>{task.name}</span>
                    <span style={{ color: task.color, fontWeight: 600 }}>{task.percent}%</span>
                  </div>
                  <Progress
                    percent={task.percent}
                    showInfo={false}
                    strokeColor={task.color}
                    trailColor="#f0f0f0"
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 最新通知（静态列表，与消息通知不同）*/}
        <Col xs={24} lg={8}>
          <Card
            title="最新动态"
            style={{ borderRadius: borderRadiusLG, height: '100%' }}
            bodyStyle={{ padding: '8px 0' }}
          >
            <List
              dataSource={notices.slice(0, 4)}  // 只显示前 4 条
              renderItem={(item) => (
                <List.Item style={{ padding: '10px 20px', cursor: 'pointer' }}>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: !item.read
                            ? '#1677ff'
                            : item.type === 'warning'
                            ? '#fa8c16'
                            : item.type === 'success'
                            ? '#52c41a'
                            : '#8c8c8c',
                          marginTop: 6,
                        }}
                      />
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{item.title}</span>
                        <span style={{ fontSize: 11, color: '#bfbfbf' }}>{item.time}</span>
                      </div>
                    }
                    description={
                      <span style={{ fontSize: 12, color: '#8c8c8c' }}>{item.desc}</span>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
      </motion.div>

      {/* 图表区域 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: borderRadiusLG }}>
            {/* 【亮点 7】ECharts 图表：订单和流水走势 */}
            <ReactECharts option={orderTrendOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: borderRadiusLG }}>
            {/* 【亮点 7】ECharts 图表：模型诊断雷达图 */}
            <ReactECharts option={radarOption} style={{ height: 350 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: borderRadiusLG }}>
            {/* 【亮点 7】ECharts 图表：司机城市分布饼图 */}
            <ReactECharts option={cityPieOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: borderRadiusLG }}>
            {/* 【亮点 7】ECharts 图表：司机年龄分布饼图 */}
            <ReactECharts option={agePieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
      </motion.div>
    </div>
  );
};

export default Dashboard;
