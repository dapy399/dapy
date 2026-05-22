import type { User, MenuItem, Role, Department, Order, Driver } from '@/types/index';
import { generateId } from '@/utils/index';
// formatDate 保留以备后续使用

// Mock 用户数据
export const mockUsers: User[] = [
  { id: 1, username: 'admin', email: 'admin@example.com', phone: '13800138000', avatar: '', role: '超级管理员', roleId: 1, status: 1, department: '技术部', departmentId: 1, position: '技术总监', registerTime: '2024-01-01 10:00:00', lastLoginTime: '2024-05-06 08:30:00' },
  { id: 2, username: 'zhangsan', email: 'zhangsan@example.com', phone: '13800138001', avatar: '', role: '运营经理', roleId: 2, status: 1, department: '运营部', departmentId: 2, position: '运营经理', registerTime: '2024-02-15 09:00:00', lastLoginTime: '2024-05-05 18:00:00' },
  { id: 3, username: 'lisi', email: 'lisi@example.com', phone: '13800138002', avatar: '', role: '客服人员', roleId: 3, status: 1, department: '客服部', departmentId: 3, position: '客服专员', registerTime: '2024-03-01 14:00:00', lastLoginTime: '2024-05-04 17:30:00' },
  { id: 4, username: 'wangwu', email: 'wangwu@example.com', phone: '13800138003', avatar: '', role: '财务人员', roleId: 4, status: 0, department: '财务部', departmentId: 4, position: '会计', registerTime: '2024-03-10 10:30:00', lastLoginTime: '2024-04-20 16:00:00' },
  { id: 5, username: 'zhaoliu', email: 'zhaoliu@example.com', phone: '13800138004', avatar: '', role: '市场专员', roleId: 5, status: 1, department: '市场部', departmentId: 5, position: '市场专员', registerTime: '2024-04-01 09:00:00', lastLoginTime: '2024-05-06 08:00:00' },
];

// Mock 菜单数据
export const mockMenus: MenuItem[] = [
  { id: 1, parentId: 0, name: 'dashboard', title: '工作台', icon: 'DashboardOutlined', type: 'menu', permission: 'dashboard', path: '/dashboard', component: 'Dashboard', status: 1, sort: 1 },
  { id: 2, parentId: 0, name: 'system', title: '系统管理', icon: 'SettingOutlined', type: 'menu', permission: 'system', path: '/system', component: '', status: 1, sort: 2 },
  { id: 3, parentId: 2, name: 'user', title: '用户管理', icon: 'UserOutlined', type: 'menu', permission: 'system:user', path: '/system/user', component: 'UserManage', status: 1, sort: 1 },
  { id: 4, parentId: 2, name: 'menu', title: '菜单管理', icon: 'MenuOutlined', type: 'menu', permission: 'system:menu', path: '/system/menu', component: 'MenuManage', status: 1, sort: 2 },
  { id: 5, parentId: 2, name: 'role', title: '角色管理', icon: 'SafetyOutlined', type: 'menu', permission: 'system:role', path: '/system/role', component: 'RoleManage', status: 1, sort: 3 },
  { id: 6, parentId: 2, name: 'dept', title: '部门管理', icon: 'ApartmentOutlined', type: 'menu', permission: 'system:dept', path: '/system/dept', component: 'DeptManage', status: 1, sort: 4 },
  { id: 7, parentId: 0, name: 'order', title: '订单管理', icon: 'FileTextOutlined', type: 'menu', permission: 'order', path: '/order', component: '', status: 1, sort: 3 },
  { id: 8, parentId: 7, name: 'orderList', title: '订单列表', icon: 'OrderedListOutlined', type: 'menu', permission: 'order:list', path: '/order/list', component: 'OrderList', status: 1, sort: 1 },
  { id: 9, parentId: 7, name: 'orderCluster', title: '订单聚合', icon: 'ClusterOutlined', type: 'menu', permission: 'order:cluster', path: '/order/cluster', component: 'OrderCluster', status: 1, sort: 2 },
  { id: 10, parentId: 7, name: 'driver', title: '司机列表', icon: 'CarOutlined', type: 'menu', permission: 'order:driver', path: '/order/driver', component: 'DriverList', status: 1, sort: 3 },
  // 按钮权限
  { id: 11, parentId: 3, name: 'userAdd', title: '新增用户', icon: '', type: 'button', permission: 'system:user:add', path: '', component: '', status: 1, sort: 1 },
  { id: 12, parentId: 3, name: 'userEdit', title: '编辑用户', icon: '', type: 'button', permission: 'system:user:edit', path: '', component: '', status: 1, sort: 2 },
  { id: 13, parentId: 3, name: 'userDelete', title: '删除用户', icon: '', type: 'button', permission: 'system:user:delete', path: '', component: '', status: 1, sort: 3 },
  { id: 14, parentId: 5, name: 'rolePermission', title: '设置权限', icon: '', type: 'button', permission: 'system:role:permission', path: '', component: '', status: 1, sort: 1 },
];

// Mock 角色数据
export const mockRoles: Role[] = [
  { id: 1, name: '超级管理员', remark: '拥有所有权限', menuIds: [1,2,3,4,5,6,7,8,9,10,11,12,13,14], createTime: '2024-01-01', updateTime: '2024-05-01' },
  { id: 2, name: '运营经理', remark: '负责运营管理', menuIds: [1,7,8,9,10], createTime: '2024-02-01', updateTime: '2024-05-01' },
  { id: 3, name: '客服人员', remark: '处理客户问题', menuIds: [1,7,8], createTime: '2024-03-01', updateTime: '2024-04-01' },
  { id: 4, name: '财务人员', remark: '财务报表查看', menuIds: [1,7,8], createTime: '2024-03-15', updateTime: '2024-04-15' },
  { id: 5, name: '市场专员', remark: '市场推广', menuIds: [1,7,9,10], createTime: '2024-04-01', updateTime: '2024-04-20' },
];

// Mock 部门数据
export const mockDepts: Department[] = [
  { id: 1, parentId: 0, name: '技术部', manager: '张三', createTime: '2024-01-01', updateTime: '2024-05-01' },
  { id: 2, parentId: 0, name: '运营部', manager: '李四', createTime: '2024-01-01', updateTime: '2024-05-01' },
  { id: 3, parentId: 0, name: '客服部', manager: '王五', createTime: '2024-02-01', updateTime: '2024-04-01' },
  { id: 4, parentId: 0, name: '财务部', manager: '赵六', createTime: '2024-02-15', updateTime: '2024-04-15' },
  { id: 5, parentId: 0, name: '市场部', manager: '钱七', createTime: '2024-03-01', updateTime: '2024-04-20' },
  { id: 6, parentId: 1, name: '前端组', manager: '前端组长', createTime: '2024-01-15', updateTime: '2024-04-01' },
  { id: 7, parentId: 1, name: '后端组', manager: '后端组长', createTime: '2024-01-15', updateTime: '2024-04-01' },
];

// Mock 订单数据
export const mockOrders: Order[] = [
  { id: 1, orderNo: 'DD202405010001', city: '长沙', startAddress: '长沙市岳麓区麓谷大道', endAddress: '长沙市天心区黄兴路', orderTime: '2024-05-01 08:30:00', price: 28.5, status: 1, username: '用户A', driverName: '王师傅', driverId: 1, userId: 101 },
  { id: 2, orderNo: 'DD202405010002', city: '武汉', startAddress: '武汉市武昌区中南路', endAddress: '武汉市洪山区光谷广场', orderTime: '2024-05-01 09:00:00', price: 35.0, status: 2, username: '用户B', driverName: '李师傅', driverId: 2, userId: 102 },
  { id: 3, orderNo: 'DD202405010003', city: '长沙', startAddress: '长沙市开福区湘江中路', endAddress: '长沙市雨花区万家丽路', orderTime: '2024-05-01 10:15:00', price: 42.0, status: 3, username: '用户C', driverName: '张师傅', driverId: 3, userId: 103 },
  { id: 4, orderNo: 'DD202405010004', city: '郑州', startAddress: '郑州市金水区花园路', endAddress: '郑州市二七区德化街', orderTime: '2024-05-01 11:00:00', price: 22.5, status: 1, username: '用户D', driverName: '刘师傅', driverId: 4, userId: 104 },
  { id: 5, orderNo: 'DD202405010005', city: '武汉', startAddress: '武汉市江汉区解放大道', endAddress: '武汉市汉阳区龙阳大道', orderTime: '2024-05-01 14:30:00', price: 48.0, status: 2, username: '用户E', driverName: '陈师傅', driverId: 5, userId: 105 },
  { id: 6, orderNo: 'DD202405020001', city: '长沙', startAddress: '长沙市岳麓区梅溪湖', endAddress: '长沙市芙蓉区五一广场', orderTime: '2024-05-02 08:00:00', price: 31.0, status: 3, username: '用户F', driverName: '杨师傅', driverId: 6, userId: 106 },
  { id: 7, orderNo: 'DD202405020002', city: '郑州', startAddress: '郑州市郑东新区CBD', endAddress: '郑州市管城区火车站', orderTime: '2024-05-02 09:30:00', price: 26.0, status: 1, username: '用户G', driverName: '赵师傅', driverId: 7, userId: 107 },
  { id: 8, orderNo: 'DD202405020003', city: '武汉', startAddress: '武汉市青山区建设一路', endAddress: '武汉市东西湖区金银湖', orderTime: '2024-05-02 16:00:00', price: 55.0, status: 2, username: '用户H', driverName: '周师傅', driverId: 8, userId: 108 },
];

// Mock 司机数据
export const mockDrivers: Driver[] = [
  { id: 1, name: '王师傅', phone: '13800138101', registerCity: '长沙', memberLevel: '钻石', driverLevel: 'S级', status: 1, licensePlate: '湘A12345', brand: '比亚迪', vehicleModel: '汉EV', onlineTimeYesterday: 8.5, revenueYesterday: 420, rating: 4.9, behaviorScore: 98, pushOrdersYesterday: 25, completedOrdersYesterday: 22, joinTime: '2023-06-01' },
  { id: 2, name: '李师傅', phone: '13800138102', registerCity: '武汉', memberLevel: '铂金', driverLevel: 'A级', status: 1, licensePlate: '鄂A67890', brand: '特斯拉', vehicleModel: 'Model 3', onlineTimeYesterday: 7.0, revenueYesterday: 380, rating: 4.8, behaviorScore: 95, pushOrdersYesterday: 20, completedOrdersYesterday: 18, joinTime: '2023-08-15' },
  { id: 3, name: '张师傅', phone: '13800138103', registerCity: '长沙', memberLevel: '黄金', driverLevel: 'A级', status: 1, licensePlate: '湘B11111', brand: '广汽埃安', vehicleModel: 'S Plus', onlineTimeYesterday: 9.0, revenueYesterday: 450, rating: 4.7, behaviorScore: 92, pushOrdersYesterday: 28, completedOrdersYesterday: 25, joinTime: '2023-10-01' },
  { id: 4, name: '刘师傅', phone: '13800138104', registerCity: '郑州', memberLevel: '白银', driverLevel: 'B级', status: 1, licensePlate: '豫A22222', brand: '吉利', vehicleModel: '帝豪EV', onlineTimeYesterday: 6.5, revenueYesterday: 280, rating: 4.5, behaviorScore: 88, pushOrdersYesterday: 18, completedOrdersYesterday: 15, joinTime: '2024-01-10' },
  { id: 5, name: '陈师傅', phone: '13800138105', registerCity: '武汉', memberLevel: '铂金', driverLevel: 'A级', status: 2, licensePlate: '鄂B33333', brand: '小鹏', vehicleModel: 'P7', onlineTimeYesterday: 5.0, revenueYesterday: 200, rating: 4.2, behaviorScore: 75, pushOrdersYesterday: 12, completedOrdersYesterday: 10, joinTime: '2024-02-20' },
  { id: 6, name: '杨师傅', phone: '13800138106', registerCity: '长沙', memberLevel: '黄金', driverLevel: 'B级', status: 1, licensePlate: '湘C44444', brand: '蔚来', vehicleModel: 'ET5', onlineTimeYesterday: 7.5, revenueYesterday: 350, rating: 4.6, behaviorScore: 90, pushOrdersYesterday: 22, completedOrdersYesterday: 19, joinTime: '2023-09-05' },
  { id: 7, name: '赵师傅', phone: '13800138107', registerCity: '郑州', memberLevel: '白银', driverLevel: 'C级', status: 1, licensePlate: '豫B55555', brand: '长安', vehicleModel: '奔奔EV', onlineTimeYesterday: 4.5, revenueYesterday: 180, rating: 4.0, behaviorScore: 82, pushOrdersYesterday: 10, completedOrdersYesterday: 8, joinTime: '2024-03-15' },
  { id: 8, name: '周师傅', phone: '13800138108', registerCity: '武汉', memberLevel: '钻石', driverLevel: 'S级', status: 1, licensePlate: '鄂C66666', brand: '理想', vehicleModel: 'L7', onlineTimeYesterday: 10.0, revenueYesterday: 520, rating: 5.0, behaviorScore: 99, pushOrdersYesterday: 30, completedOrdersYesterday: 28, joinTime: '2023-05-20' },
];

// Mock Dashboard 数据
export const dashboardStats = {
  driverCount: 1248,
  totalRevenue: 3584200,
  totalOrders: 89560,
  cityCount: 45,
};

export const dashboardCharts = {
  orderTrend: {
    months: ['1月', '2月', '3月', '4月', '5月', '6月'],
    orders: [12500, 14200, 13800, 15600, 16900, 16500],
    revenue: [380, 450, 420, 510, 580, 560],
  },
  driverCity: [
    { name: '长沙', value: 320 },
    { name: '武汉', value: 280 },
    { name: '郑州', value: 210 },
    { name: '南昌', value: 150 },
    { name: '合肥', value: 120 },
    { name: '其他', value: 168 },
  ],
  driverAge: [
    { name: '25岁以下', value: 180 },
    { name: '25-30岁', value: 350 },
    { name: '30-35岁', value: 320 },
    { name: '35-40岁', value: 240 },
    { name: '40岁以上', value: 158 },
  ],
  modelDiagnosis: [
    { indicator: '服务态度', score: 92 },
    { indicator: '准点率', score: 88 },
    { indicator: '在线时长', score: 85 },
    { indicator: '接单率', score: 90 },
    { indicator: '评分', score: 94 },
    { indicator: '投诉率', score: 96 },
  ],
};
