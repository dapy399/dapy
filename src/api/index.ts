import request from '@utils/request';
import type { User, MenuItem, Role, Department, Order, Driver } from '@/types/index';

// 登录
export const loginApi = (data: { username: string; password: string }) => {
  return request.post('/auth/login', data);
};

export const getUserInfoApi = () => {
  return request.get('/auth/info');
};

// 用户管理
export const getUserListApi = (params: Record<string, unknown>) => {
  return request.get('/user/list', { params });
};

export const createUserApi = (data: Partial<User>) => {
  return request.post('/user', data);
};

export const updateUserApi = (id: number, data: Partial<User>) => {
  return request.put(`/user/${id}`, data);
};

export const deleteUserApi = (id: number) => {
  return request.delete(`/user/${id}`);
};

export const batchDeleteUserApi = (ids: number[]) => {
  return request.post('/user/batch-delete', { ids });
};

// 菜单管理
export const getMenuListApi = () => {
  return request.get('/menu/list');
};

export const createMenuApi = (data: Partial<MenuItem>) => {
  return request.post('/menu', data);
};

export const updateMenuApi = (id: number, data: Partial<MenuItem>) => {
  return request.put(`/menu/${id}`, data);
};

export const deleteMenuApi = (id: number) => {
  return request.delete(`/menu/${id}`);
};

// 角色管理
export const getRoleListApi = () => {
  return request.get('/role/list');
};

export const createRoleApi = (data: Partial<Role>) => {
  return request.post('/role', data);
};

export const updateRoleApi = (id: number, data: Partial<Role>) => {
  return request.put(`/role/${id}`, data);
};

export const deleteRoleApi = (id: number) => {
  return request.delete(`/role/${id}`);
};

export const assignRolePermissionApi = (id: number, menuIds: number[]) => {
  return request.put(`/role/${id}/permission`, { menuIds });
};

// 部门管理
export const getDeptListApi = () => {
  return request.get('/dept/list');
};

export const createDeptApi = (data: Partial<Department>) => {
  return request.post('/dept', data);
};

export const updateDeptApi = (id: number, data: Partial<Department>) => {
  return request.put(`/dept/${id}`, data);
};

export const deleteDeptApi = (id: number) => {
  return request.delete(`/dept/${id}`);
};

// 订单管理
export const getOrderListApi = (params: Record<string, unknown>) => {
  return request.get('/order/list', { params });
};

export const createOrderApi = (data: Partial<Order>) => {
  return request.post('/order', data);
};

export const deleteOrderApi = (id: number) => {
  return request.delete(`/order/${id}`);
};

export const exportOrderApi = (params: Record<string, unknown>) => {
  return request.get('/order/export', { params, responseType: 'blob' });
};

// 司机管理
export const getDriverListApi = (params: Record<string, unknown>) => {
  return request.get('/driver/list', { params });
};

// Dashboard
export const getDashboardStatsApi = () => {
  return request.get('/dashboard/stats');
};

export const getDashboardChartsApi = () => {
  return request.get('/dashboard/charts');
};
