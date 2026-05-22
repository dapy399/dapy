// ============================================
// 亮点 1：Web Worker 异步导出 Excel（export.worker.ts）
// ============================================
// 【功能说明】
// 这个文件运行在独立的 Web Worker 线程中，不阻塞主线程 UI。
// 主线程（React 组件）负责页面渲染，Worker 负责耗时的 Excel 生成。
//
// 【技术亮点】
// 1. 多线程：Excel 生成在 Worker 线程，主线程 UI 完全不卡顿
// 2. 零拷贝传递：ArrayBuffer 是 Transferable 对象，
//    通过 postMessage 的第二个参数 transfer 传递，
//    内存直接从 Worker 转移到主线程，无需拷贝（性能提升数倍）
// 3. 自动列宽：遍历每列最长内容，自动调整列宽，导出文件更美观
// 4. 类型安全：用 TypeScript 接口约束入参和出参
//
// 【与主控通信协议】
// 主线程 → Worker：{ data: 导出数据[], filename: '文件名.xlsx' }
// Worker → 主线程成功：{ success: true, data: ArrayBuffer, filename }
// Worker → 主线程失败：{ success: false, error: '错误信息' }

import * as XLSX from 'xlsx';

/** 主线程发给 Worker 的数据格式 */
interface ExportPayload {
  /** 导出数据（key 已是中文列名，可直接写入 sheet） */
  data: Record<string, unknown>[];
  /** 导出文件名（含 .xlsx 后缀） */
  filename: string;
}

/** Worker 成功回传的数据格式 */
interface ExportSuccess {
  success: true;
  data: ArrayBuffer;
  filename: string;
}

/** Worker 失败回传的数据格式 */
interface ExportError {
  success: false;
  error: string;
}

type ExportResult = ExportSuccess | ExportError;

/**
 * Worker 主监听函数
 * 接收主线程消息，生成 Excel，回传 ArrayBuffer
 */
addEventListener('message', (e: MessageEvent<ExportPayload>) => {
  const { data, filename } = e.data;

  try {
    // 防御性检查：数据为空时直接返回错误
    if (!data || data.length === 0) {
      postMessage({ success: false, error: '没有数据可导出' } satisfies ExportError);
      return;
    }

    // ===== 步骤 1：创建 Worksheet =====
    // json_to_sheet 自动把数组对象的 key 作为表头，value 作为单元格
    const ws = XLSX.utils.json_to_sheet(data);

    // ===== 步骤 2：自动列宽计算 =====
    // 遍历每个单元格，找到每列最长内容的字符数，+4 作为列宽余量
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    const colWidths: { wch: number }[] = [];
    
    for (let c = range.s.c; c <= range.e.c; c++) {
      let maxLen = 0;
      for (let r = range.s.r; r <= range.e.r; r++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        // cell.v 是单元格的原始值（string/number/date 等）
        if (cell && cell.v != null) {
          maxLen = Math.max(maxLen, String(cell.v).length);
        }
      }
      // 列宽 = 最长内容 + 4 字符余量，最小 10，最大 60（避免过宽）
      colWidths.push({ wch: Math.min(Math.max(maxLen + 4, 10), 60) });
    }
    ws['!cols'] = colWidths;

    // ===== 步骤 3：创建 Workbook（工作簿）=====
    const wb = XLSX.utils.book_new();
    // 把 worksheet 追加到 workbook，命名为 Sheet1
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // ===== 步骤 4：写出为 ArrayBuffer =====
    // type: 'array' 表示输出 ArrayBuffer（Worker 中不能用 Blob，因为不涉及 DOM）
    const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // ===== 步骤 5：回传主线程（零拷贝）=====
    postMessage(
      { success: true, data: arrayBuffer, filename } satisfies ExportSuccess,
      // 【关键】ArrayBuffer 是 Transferable 对象
      // 通过 transfer 传递后，Worker 端的 arrayBuffer 会变为不可用（已转移）
      // 这样避免了内存拷贝，大文件导出性能提升显著
      { transfer: [arrayBuffer] }
    );
  } catch (error) {
    // 捕获所有异常，回传错误信息
    postMessage({
      success: false,
      error: error instanceof Error ? error.message : '导出过程发生未知错误',
    } satisfies ExportError);
  }
});
