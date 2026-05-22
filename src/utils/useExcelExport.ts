import { useCallback, useRef, useState, useEffect } from 'react';
import { message } from 'antd';

// ===========================================
// 亮点 1：Web Worker 导出 Hook（useExcelExport）
// ===========================================
// 【功能说明】
// 管理 Web Worker 的完整生命周期：
//   创建 Worker → 发送数据 → 接收结果 → 触发下载 → 销毁 Worker
//
// 【技术亮点】
// 1. Vite 专用语法：new URL('./export.worker.ts', import.meta.url)
//    → 构建时自动将 Worker 文件分离为独立 chunk
//    → xlsx 库不会打进主 bundle，减少首屏体积
// 2. mountedRef：防止组件卸载后设置 state（避免内存泄漏和警告）
// 3. workerRef：随时可以 cancel（终止 Worker，停止导出）
// 4. useCallback：导出函数被缓存，子组件不会因为 props 变化重新渲染
//
// 【与 Worker 通信协议】
// 主线程 → Worker：{ data: 导出数据[], filename: '文件名.xlsx' }
// Worker → 主线程：{ success: true, data: ArrayBuffer, filename }
// Worker → 主线程：{ success: false, error: '错误信息' }

interface ExportHeaders {
  key: string;   // 数据对象的 key
  title: string;  // 导出 Excel 的表头中文名
}

interface UseExcelExportOptions {
  /** 默认导出文件名（含 .xlsx 后缀）*/
  filename?: string;
  /** 默认表头映射（将英文 key 转为中文 title）*/
  headers?: ExportHeaders[];
}

interface ExportResult {
  success: boolean;
  data?: ArrayBuffer;
  filename?: string;
  error?: string;
}

/**
 * useExcelExport Hook
 * @param options 默认选项（文件名、表头映射）
 * @returns { exportToExcel, exporting, cancel }
 *   - exportToExcel：触发导出（可在组件中调用）
 *   - exporting：是否正在导出（可用于显示 loading）
 *   - cancel：取消导出（终止 Worker）
 */
export function useExcelExport(options: UseExcelExportOptions = {}) {
  // Worker 实例引用（用于终止、发送消息）
  const workerRef = useRef<Worker | null>(null);
  // 组件挂载状态（防止组件卸载后设置 state）
  const mountedRef = useRef(true);
  // 导出中状态（驱动 UI loading 效果）
  const [exporting, setExporting] = useState(false);

  // 【关键】组件卸载时终止 Worker，防止内存泄漏
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * 核心导出函数
   * 
   * 【执行流程】
   * 1. 合并表头（将英文 key 转为中文 title）
   * 2. 创建 Worker（Vite 自动分离 chunk）
   * 3. 发送数据到 Worker（postMessage）
   * 4. 监听 Worker 返回（onmessage / onerror）
   * 5. 接收 ArrayBuffer → 转 Blob → 触发浏览器下载
   * 6. 清理 Worker
   * 
   * @param rawData    原始数据（英文 key）
   * @param overrides  覆盖默认选项（文件名、表头）
   */
  const exportToExcel = useCallback(
    (
      rawData: Record<string, unknown>[],
      overrides?: { filename?: string; headers?: ExportHeaders[] },
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        // 防御性检查：数据为空
        if (!rawData || rawData.length === 0) {
          message.warning('没有数据可导出');
          reject(new Error('数据为空'));
          return;
        }

        setExporting(true);

        // ===== 步骤 1：合并表头，构建导出数据 =====
        // 如果传了 headers，将英文 key 转为中文 title
        // 例如：{ orderNo: 'DD001' } → { '订单号': 'DD001' }
        const headers = overrides?.headers || options.headers;
        const exportData = headers
          ? rawData.map((row) => {
              const obj: Record<string, unknown> = {};
              headers.forEach(({ key, title }) => {
                obj[title] = row[key];
              });
              return obj;
            })
          : rawData;

        const filename =
          overrides?.filename ||
          options.filename ||
          `导出数据_${new Date().toLocaleDateString()}.xlsx`;

        // ===== 步骤 2：创建 Worker =====
        // 【关键】Vite 专用语法：new URL(worker 文件路径, import.meta.url)
        // 构建时 Vite 会自动：
        //   - 将 export.worker.ts 分离为独立 chunk
        //   - 把 xlsx 库打包进 Worker chunk（不进主 bundle）
        //   - 生产环境自动处理 chunk 路径
        const worker = new Worker(
          new URL('./export.worker.ts', import.meta.url),
          { type: 'module' },
        );
        workerRef.current = worker;

        // ===== 步骤 3：发送数据到 Worker =====
        worker.postMessage({ data: exportData, filename });

        // ===== 步骤 4：监听 Worker 返回（成功）=====
        worker.onmessage = (e: MessageEvent<ExportResult>) => {
          // 如果组件已卸载，不执行任何操作（防止内存泄漏）
          if (!mountedRef.current) return;

          const result = e.data;
          if (result.success && result.data) {
            // 将 ArrayBuffer 转为 Blob（Excel 文件格式）
            const blob = new Blob([result.data], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            // 触发浏览器下载
            downloadBlob(blob, result.filename || filename);
            resolve();
          } else {
            const errorMsg = result.error || '导出失败';
            message.error(errorMsg);
            reject(new Error(errorMsg));
          }

          cleanup();
        };

        // ===== 监听 Worker 异常（失败）=====
        worker.onerror = (err: ErrorEvent) => {
          if (!mountedRef.current) return;
          message.error(`导出异常：${err.message}`);
          reject(new Error(err.message));
          cleanup();
        };
      });
    },
    [options.filename, options.headers],
  );

  /** 取消导出（终止 Worker） */
  const cancel = useCallback(() => {
    cleanup();
    message.info('已取消导出');
  }, []);

  /** 清理 Worker 并重置状态 */
  function cleanup() {
    if (workerRef.current) {
      workerRef.current.terminate();  // 终止 Worker 线程
      workerRef.current = null;
    }
    if (mountedRef.current) {
      setExporting(false);
    }
  }

  return { exportToExcel, exporting, cancel } as const;
}

// ===========================================
// 浏览器下载工具函数
// ===========================================
// 【原理】
// 1. 创建 Object URL（将 Blob 映射为内存地址）
// 2. 创建 <a> 标签，设置 download 属性
// 3. 模拟点击 → 触发浏览器下载
// 4. 移除 <a> 标签
// 5. 释放 Object URL（防止内存泄漏）
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);  // 释放内存
}
