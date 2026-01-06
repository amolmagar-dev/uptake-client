import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import echarts from '../../lib/echarts';
import type { EChartsType, EChartsOption } from 'echarts';

interface EChartsWrapperProps {
  option: EChartsOption;
  style?: React.CSSProperties;
  theme?: string | object;
  onEvents?: Record<string, Function>;
  loading?: boolean;
  className?: string;
  autoResize?: boolean;
}

export interface EChartsInstance {
  getInstance: () => EChartsType | undefined;
}

const EChartsWrapper = forwardRef<EChartsInstance, EChartsWrapperProps>(({
  option,
  style = { height: '300px', width: '100%' },
  theme = 'dark', // Default to dark theme to match app style
  onEvents,
  loading,
  className,
  autoResize = true,
}, ref) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<EChartsType | null>(null);

  // Expose instance via ref
  useImperativeHandle(ref, () => ({
    getInstance: () => chartInstance.current || undefined,
  }));

  // Initialize Chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose if exists
    if (chartInstance.current) {
      chartInstance.current.dispose();
    }

    // Initialize
    chartInstance.current = echarts.init(chartRef.current, theme) as unknown as EChartsType;
    
    // Bind events
    if (onEvents) {
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        chartInstance.current?.on(eventName, handler as any);
      });
    }

    if (chartInstance.current) {
    chartInstance.current.setOption(option);
    }

    if (chartInstance.current) {
        chartInstance.current.on('click', (params: any) => {
        console.log('Chart clicked', params);
        });
    }

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [theme]); // Re-init if theme changes

  // Update Options
  useEffect(() => {
    if (!chartInstance.current) return;
    
    chartInstance.current.setOption(option, {
      notMerge: false, // Merge with existing options
      replaceMerge: ['xAxis', 'yAxis', 'series'], // Replace these components if they change
    });
  }, [option]);

  // Handle Loading
  useEffect(() => {
    if (!chartInstance.current) return;
    
    if (loading) {
      chartInstance.current.showLoading({
        text: '',
        color: '#7b2cbf',
        textColor: '#a0a0b0',
        maskColor: 'rgba(255, 255, 255, 0.05)',
        zlevel: 0,
      });
    } else {
      chartInstance.current.hideLoading();
    }
  }, [loading]);

  // Handle Resize
  useEffect(() => {
    if (!autoResize || !chartRef.current || !chartInstance.current) return;

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [autoResize]);

  return (
    <div 
      ref={chartRef} 
      style={style} 
      className={`w-full h-full ${className || ''}`}
    />
  );
});

EChartsWrapper.displayName = 'EChartsWrapper';

export default EChartsWrapper;
