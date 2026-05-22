import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  MenuOutlined,
  SafetyOutlined,
  ApartmentOutlined,
  FileTextOutlined,
  OrderedListOutlined,
  ClusterOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { useAppStore, usePermission } from '@/store/index';
import type { MenuItem } from '@/types/index';

const { Sider } = Layout;

const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  SettingOutlined: <SettingOutlined />,
  UserOutlined: <UserOutlined />,
  MenuOutlined: <MenuOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  ApartmentOutlined: <ApartmentOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  OrderedListOutlined: <OrderedListOutlined />,
  ClusterOutlined: <ClusterOutlined />,
  CarOutlined: <CarOutlined />,
};

interface SidebarProps {
  collapsed: boolean;
}

const defaultMenus: MenuItem[] = [
  { id: 1, parentId: 0, name: 'dashboard', title: '工作台', icon: 'DashboardOutlined', type: 'menu', permission: 'dashboard', path: '/dashboard', component: '', status: 1, sort: 1 },
  { id: 2, parentId: 0, name: 'system', title: '系统管理', icon: 'SettingOutlined', type: 'menu', permission: 'system', path: '/system', component: '', status: 1, sort: 2 },
  { id: 3, parentId: 2, name: 'user', title: '用户管理', icon: 'UserOutlined', type: 'menu', permission: 'system:user', path: '/system/user', component: '', status: 1, sort: 1 },
  { id: 4, parentId: 2, name: 'menu', title: '菜单管理', icon: 'MenuOutlined', type: 'menu', permission: 'system:menu', path: '/system/menu', component: '', status: 1, sort: 2 },
  { id: 5, parentId: 2, name: 'role', title: '角色管理', icon: 'SafetyOutlined', type: 'menu', permission: 'system:role', path: '/system/role', component: '', status: 1, sort: 3 },
  { id: 6, parentId: 2, name: 'dept', title: '部门管理', icon: 'ApartmentOutlined', type: 'menu', permission: 'system:dept', path: '/system/dept', component: '', status: 1, sort: 4 },
  { id: 7, parentId: 0, name: 'order', title: '订单管理', icon: 'FileTextOutlined', type: 'menu', permission: 'order', path: '/order', component: '', status: 1, sort: 3 },
  { id: 8, parentId: 7, name: 'orderList', title: '订单列表', icon: 'OrderedListOutlined', type: 'menu', permission: 'order:list', path: '/order/list', component: '', status: 1, sort: 1 },
  { id: 9, parentId: 7, name: 'orderCluster', title: '订单聚合', icon: 'ClusterOutlined', type: 'menu', permission: 'order:cluster', path: '/order/cluster', component: '', status: 1, sort: 2 },
  { id: 10, parentId: 7, name: 'driver', title: '司机列表', icon: 'CarOutlined', type: 'menu', permission: 'order:driver', path: '/order/driver', component: '', status: 1, sort: 3 },
];

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppStore();
  const { hasPermission } = usePermission();
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const menuList = state.menuList.length > 0 ? state.menuList : defaultMenus;

  // 根据当前路径计算应该展开的父菜单
  useEffect(() => {
    const path = location.pathname;
    const parentPaths: string[] = [];
    const parts = path.split('/').filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      parentPaths.push('/' + parts.slice(0, i).join('/'));
    }
    setOpenKeys(parentPaths);
  }, [location.pathname]);

  // 构建菜单项
  const buildMenuItems = () => {
    const topMenus = menuList.filter((m) => m.parentId === 0 && m.type === 'menu');

    return topMenus
      .filter((m) => hasPermission(m.permission))
      .map((m) => {
        const children = menuList.filter((child) => child.parentId === m.id && child.type === 'menu');
        const item: any = {
          key: m.path,
          icon: iconMap[m.icon] || null,
          label: m.title,
        };
        if (children.length > 0) {
          item.children = children
            .filter((c) => hasPermission(c.permission))
            .map((child) => ({
              key: child.path,
              icon: iconMap[child.icon] || null,
              label: child.title,
            }));
        }
        return item;
      });
  };

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key);
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      collapsedWidth={80}
      width={220}
      style={{
        overflow: 'auto',
        height: '100vh',
        background: '#001529',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {collapsed ? 'RA' : 'React Admin'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        openKeys={openKeys}
        onOpenChange={handleOpenChange}
        items={buildMenuItems()}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );
};

export default Sidebar;
