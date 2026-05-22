export * from './storage';
export * from './request';

// 格式化日期
export const formatDate = (date: string | Date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
};

// 生成随机ID
export const generateId = () => {
  return Math.floor(Math.random() * 1000000);
};

// 树形数据处理
export const arrayToTree = <T extends { id: number; parentId: number; children?: T[] }>(
  list: T[],
  parentId = 0
): T[] => {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: arrayToTree(list, item.id),
    }))
    .filter((item) => item.children && item.children.length > 0 || item.parentId === parentId);
};

// 扁平化树
export const treeToArray = <T extends { children?: T[] }>(tree: T[]): T[] => {
  const result: T[] = [];
  tree.forEach((node) => {
    const { children, ...rest } = node as unknown as Record<string, unknown>;
    result.push(rest as T);
    if (children && Array.isArray(children)) {
      result.push(...treeToArray(children as T[]));
    }
  });
  return result;
};

// 下载文件
export const downloadFile = (data: Blob, filename: string) => {
  const blob = new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
