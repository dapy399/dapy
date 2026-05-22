import { useState, useEffect } from 'react';
import { Layout, theme as antTheme } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore, useTheme } from '@/store/index';
import Sidebar from './Sidebar';
import HeaderBar from './HeaderBar';
import TabBar from './TabBar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Content } = Layout;

// ===========================================
// 亮点 2：Framer Motion 页面过渡动画（MainLayout.tsx）
// ===========================================
// 【功能说明】
// 路由切换时，旧页面先向上淡出，新页面再从下方淡入。
// 使用 AnimatePresence + motion.div 实现。
//
// 【技术亮点】
// 1. AnimatePresence mode="wait"：
//    确保旧页面完全退出后，新页面才进入（避免两个页面同时显示）
// 2. key={location.pathname}：
//    每次路径变化，React 会认为是不同组件，触发 AnimatePresence 进出场动画
// 3. 进出场动画参数：
//    - initial：页面刚创建时的状态（透明 + 向下偏移 12px）
//    - animate：动画目标状态（完全显示 + 归位）
//    - exit：页面销毁前的状态（透明 + 向上偏移 12px）
//    - transition：动画时长 0.15s，easeOut 缓动

const MainLayout: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = antTheme.useToken();

  // 【功能】监听路由变化，自动添加标签页
  // 每次路径变化，都会 dispatch ADD_TAB  action
  useEffect(() => {
    const path = location.pathname;
    const menuMap: Record<string, string> = {
      '/dashboard': '工作台',
      '/system/user': '用户管理',
      '/system/menu': '菜单管理',
      '/system/role': '角色管理',
      '/system/dept': '部门管理',
      '/order/list': '订单列表',
      '/order/cluster': '订单聚合',
      '/order/driver': '司机列表',
    };

    if (menuMap[path]) {
      dispatch({
        type: 'ADD_TAB',
        payload: { key: path, label: menuMap[path], path, closable: path !== '/dashboard' },
      });
    }
  }, [location.pathname, dispatch]);

  return (
    <Layout style={{ minHeight: '100vh', width: '100%' }} className={theme === 'dark' ? 'dark-theme' : ''}>
      <Sidebar collapsed={collapsed} />
      <Layout style={{ flex: 1, overflow: 'hidden' }}>
        <HeaderBar collapsed={collapsed} setCollapsed={setCollapsed} />
        <TabBar />
        <Content
          style={{
            margin: 0,
            padding: '16px 24px',
            background: colorBgContainer,
            minHeight: 280,
            overflow: 'auto',
            flex: 1,
          }}
        >
          {/* ===== 亮点 2：页面过渡动画 ===== */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}  // 【关键】路径变化时，触发进出场动画
              initial={{ opacity: 0, y: 12 }}       // 进场初始状态：透明 + 向下偏移
              animate={{ opacity: 1, y: 0 }}        // 进场动画：淡入 + 上移归位
              exit={{ opacity: 0, y: -12 }}        // 出场动画：淡出 + 向上移出
              transition={{ duration: 0.15, ease: 'easeOut' }}  // 0.15秒，先快后慢
            >
              {/* Outlet 渲染子路由组件（Dashboard/UserManage/...）*/}
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
