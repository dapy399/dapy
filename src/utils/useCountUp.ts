import { useState, useEffect, useRef } from 'react';

/**
 * ============================================
 * 亮点 2+3：数字跳动动画 Hook（useCountUp）
 * ============================================
 * 
 * 【功能说明】
 * 当目标值变化时，数字从旧值平滑过渡到新值，
 * 使用 requestAnimationFrame 驱动，60fps 流畅不卡顿。
 * 
 * 【技术亮点】
 * 1. ease-out quartic 缓动：先快后慢，视觉最舒适（竞品多用线性）
 * 2. 支持目标值频繁变化：每次新动画开始前，先 cancel 旧动画
 * 3. 不依赖 value 作为 dep：动画途中即使 target 变化，也不中断当前动画
 *    只用 cleanup 取消旧动画，新动画从头尾之差开始
 * 4. performance.now()：高精度时间戳，比 Date.now() 更准确
 *
 * 【使用场景】
 * Dashboard 页面四个核心指标的数字跳动效果：
 *   animDriverCount / animRevenue / animOrders / animCities
 *
 * 【参数】
 * @param target   目标值（数字）
 * @param duration 动画时长（ms），默认 600ms
 * @returns 当前显示值（动画过程中不断变化）
 */
export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(target);
  // 用 ref 保存 requestAnimationFrame 的 ID，用于取消动画
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // 【关键】取消上一个动画帧，应对 target 快速变化
    // 例如：实时数据每 3 秒变化一次，如果上次动画还没结束，需要先取消
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // 如果目标值和当前值相同，无需动画，直接返回
    if (target === value) return;

    // 记录动画起始值和起始时间
    const from = value;
    const startTime = performance.now();

    /**
     * 核心动画函数
     * 每一帧根据 elapsed/duration 计算进度，再套用缓动函数得到 eased
     * 最终值 = from + (target - from) * eased
     */
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 【亮点】ease-out quartic 缓动公式：1 - (1 - t)^4
      // 效果：开始变化快，接近目标时变慢，视觉上非常自然
      const eased = 1 - Math.pow(1 - progress, 4);
      
      // 根据缓动值计算当前应该显示的数字（取地板值，显示整数）
      const current = Math.floor(from + (target - from) * eased);

      if (progress < 1) {
        // 动画未结束，继续下一帧
        setValue(current);
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // 动画结束，确保最终值精确等于 target
        setValue(target);
      }
    };

    // 启动动画
    rafRef.current = requestAnimationFrame(animate);

    // 【关键】Cleanup 函数：组件卸载或 target 变化时，取消进行中的动画
    // 这样新动画会从头开始，但 from 是上次的 value，过渡更自然
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // 【注意】value 不在 deps 里！
    // 如果加了 value，每次动画帧更新 value 都会触发 useEffect，导致无限循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
