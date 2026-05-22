import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Breadcrumb, Button, Avatar, Dropdown, theme as antTheme, Tooltip, Badge, List, Tag } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useAppStore, useTheme } from '@/store/index';

const { Header } = Layout;

// ===========================================
// 亮点 6：消息通知系统（HeaderBar.tsx）
// ===========================================
// 【功能说明】
// 右上角铃铛图标，点击弹出消息下拉列表。
// 支持：单条删除（✕按钮）、全部已读、未读高亮显示。
//
// 【技术亮点】
// 1. Dropdown + dropdownRender：自定义下拉内容（不用 Menu 组件）
// 2. 未读消息蓝色背景高亮（#e6f4ff）
// 3. 未读圆点指示（蓝色小圆点）
// 4. Badge 数字实时同步未读数量
// 5. 全部已读按钮（仅当 unreadCount > 0 时显示）

interface HeaderBarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const { theme, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ===========================================
  // 消息通知数据状态
  // ===========================================
  // 【数据结构】
  // - id：唯一标识（用于删除）
  // - title：消息标题
  // - desc：消息描述
  // - time：时间显示（"10分钟前"、"2小时前"）
  // - type：消息类型（warning/processing/success/default，控制圆点颜色）
  // - read：是否已读（控制背景高亮）
  const [notices, setNotices] = useState([
    { id: 1, title: '新订单待处理', desc: '您有 12 笔新订单等待分配司机', time: '10分钟前', type: 'warning', read: false },
    { id: 2, title: '司机入驻审核', desc: '3 位新司机提交入驻申请', time: '30分钟前', type: 'processing', read: false },
    { id: 3, title: '系统公告', desc: 'v2.1.0 版本更新完成，新增地图轨迹功能', time: '2小时前', type: 'success', read: false },
    { id: 4, title: '流水日报', desc: '昨日流水 ¥58,320，环比增长 8.5%', time: '今天 09:00', type: 'default', read: true },
    { id: 5, title: '客户投诉处理', desc: '订单 DD202405010003 客户投诉已处理完成', time: '昨天 16:30', type: 'warning', read: true },
  ]);

  // 计算未读消息数量（用于 Badge 数字 + 全部已读按钮显示）
  const unreadCount = notices.filter((n) => !n.read).length;

  // 【功能】删除单条消息
  const deleteNotice = (id: number) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  // 【功能】标记全部已读
  const markAllRead = () => {
    setNotices((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ===========================================
  // 消息下拉内容（JSX）
  // ===========================================
  // 【布局】
  // - 顶部：标题 + 全部已读按钮（仅未读 > 0 时显示）
  // - 列表：每条消息占一行
  //   - 左侧：圆点（未读=蓝色，已读=灰色）+ 标题 + 描述 + 时间
  //   - 右侧：✕ 删除按钮
  // - 空状态："暂无消息" 提示
  const noticeContent = (
    <div style={{ width: 320, maxHeight: 420, overflow: 'auto' }}>
      {/* 顶部标题栏 */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>消息通知</span>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllRead}>
            全部已读
          </Button>
        )}
      </div>

      {/* 消息列表 */}
      {notices.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#bfbfbf' }}>暂无消息</div>
      ) : (
        notices.map((item) => (
          <div
            key={item.id}
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #f5f5f5',
              background: item.read ? 'transparent' : '#e6f4ff',  // 【关键】未读消息蓝色背景高亮
              transition: 'background 0.2s',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, marginRight: 8 }}>
                {/* 标题行：圆点 + 标题 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {/* 【关键】未读圆点：蓝色；已读圆点：根据 type 显示颜色 */}
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: !item.read
                        ? '#1677ff'         // 未读：蓝色圆点
                        : item.type === 'warning'
                        ? '#fa8c16'         // 已读 + 警告：橙色
                        : item.type === 'success'
                        ? '#52c41a'         // 已读 + 成功：绿色
                        : '#d9d9d9',        // 已读 + 默认：灰色
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: item.read ? 400 : 600, color: '#262626' }}>
                    {item.title}
                  </span>
                </div>
                {/* 描述 */}
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4, paddingLeft: 12 }}>{item.desc}</div>
                {/* 时间 */}
                <div style={{ fontSize: 11, color: '#bfbfbf', paddingLeft: 12 }}>{item.time}</div>
              </div>
              {/* 删除按钮（✕）*/}
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined style={{ fontSize: 10 }} />}
                onClick={(e) => {
                  e.stopPropagation();  // 阻止事件冒泡（避免触发其他点击事件）
                  deleteNotice(item.id);
                }}
                style={{ color: '#bfbfbf', padding: 0, width: 20, height: 20, flexShrink: 0 }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );

  const {
    token: { colorBgContainer },
  } = antTheme.useToken();

  // 监听全屏变化（F11 或 API 触发的全屏）
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  // 面包屑映射表
  const breadcrumbMap: Record<string, { title: string; path?: string }[]> = {
    '/dashboard': [{ title: '工作台' }],
    '/system/user': [{ title: '系统管理' }, { title: '用户管理' }],
    '/system/menu': [{ title: '系统管理' }, { title: '菜单管理' }],
    '/system/role': [{ title: '系统管理' }, { title: '角色管理' }],
    '/system/dept': [{ title: '系统管理' }, { title: '部门管理' }],
    '/order/list': [{ title: '订单管理' }, { title: '订单列表' }],
    '/order/cluster': [{ title: '订单管理' }, { title: '订单聚合' }],
    '/order/driver': [{ title: '订单管理' }, { title: '司机列表' }],
  };

  const breadcrumbs = breadcrumbMap[location.pathname] || [{ title: '工作台' }];

  return (
    <Header
      style={{
        padding: '0 24px',
        background: colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* 左侧：折叠按钮 + 面包屑 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: 16, marginRight: 16 }}
        />
        <Breadcrumb>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index}>{item.title}</Breadcrumb.Item>
          ))}
        </Breadcrumb>
      </div>

      {/* 右侧：主题切换 + 全屏 + 消息通知 + 用户头像 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 主题切换（浅色/深色）*/}
        <Tooltip title={theme === 'light' ? '切换深色' : '切换浅色'}>
          <Button
            type="text"
            icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
            onClick={toggleTheme}
          />
        </Tooltip>

        {/* 全屏切换 */}
        <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
          <Button
            type="text"
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          />
        </Tooltip>

        {/* ===========================================}
        {* 亮点 6：消息通知下拉 *}
        {* ===========================================*/}
        <Dropdown
          dropdownRender={() => noticeContent}  // 【关键】自定义下拉内容（不用 Menu）
          trigger={['click']}                   // 点击触发（不是 hover）
          placement="bottomRight"
        >
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={
                <BellOutlined
                  style={{ color: unreadCount > 0 ? '#1677ff' : undefined, fontSize: 16 }}
                />
              }
            />
          </Badge>
        </Dropdown>

        {/* 用户头像 + 下拉菜单 */}
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: ({ key }) => {
              if (key === 'logout') handleLogout();
            },
          }}
          placement="bottomRight"
        >
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
            <span style={{ fontSize: 14 }}>{state.user?.username || '管理员'}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderBar;
