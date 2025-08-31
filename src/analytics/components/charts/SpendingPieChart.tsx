import { useMemo } from 'react';
import type { CategoryStats } from '../../types/analytics.types';

interface SpendingPieChartProps {
  data: CategoryStats[];
  preferredCurrency?: 'THB' | 'USD';
  size?: 'sm' | 'md' | 'lg';
  showLegend?: boolean;
  showValues?: boolean;
}

export function SpendingPieChart({ 
  data, 
  preferredCurrency = 'THB',
  size = 'md',
  showLegend = true,
  showValues = false
}: SpendingPieChartProps) {
  
  const { chartData, totalAmount, colors } = useMemo(() => {
    // Define a consistent color palette
    const colorPalette = [
      { bg: '#3B82F6', border: '#1D4ED8', hover: '#2563EB' }, // Blue
      { bg: '#10B981', border: '#047857', hover: '#059669' }, // Green
      { bg: '#F59E0B', border: '#D97706', hover: '#E65100' }, // Orange
      { bg: '#EF4444', border: '#DC2626', hover: '#C53030' }, // Red
      { bg: '#8B5CF6', border: '#7C3AED', hover: '#6D28D9' }, // Purple
      { bg: '#06B6D4', border: '#0891B2', hover: '#0E7490' }, // Cyan
      { bg: '#84CC16', border: '#65A30D', hover: '#4D7C0F' }, // Lime
      { bg: '#F97316', border: '#EA580C', hover: '#C2410C' }, // Orange-red
      { bg: '#EC4899', border: '#DB2777', hover: '#BE185D' }, // Pink
      { bg: '#6B7280', border: '#4B5563', hover: '#374151' }, // Gray
    ];

    const total = data.reduce((sum, item) => 
      sum + (preferredCurrency === 'THB' ? item.total_amount_thb : item.total_amount_usd), 0
    );

    const processedData = data.map((item, index) => ({
      ...item,
      color: colorPalette[index % colorPalette.length],
      value: preferredCurrency === 'THB' ? item.total_amount_thb : item.total_amount_usd
    }));

    return {
      chartData: processedData,
      totalAmount: total,
      colors: colorPalette
    };
  }, [data, preferredCurrency]);

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };

  const formatAmount = (amount: number) => {
    const currency = preferredCurrency === 'THB' ? 'THB' : 'USD';
    const locale = preferredCurrency === 'THB' ? 'en-US' : 'en-US';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: preferredCurrency === 'THB' ? 0 : 2,
    }).format(amount);
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No spending data available</p>
        </div>
      </div>
    );
  }

  // Calculate SVG path data for pie slices
  const createPieSlices = () => {
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    let currentAngle = -90; // Start from top

    return chartData.map((item) => {
      const percentage = (item.value / totalAmount) * 100;
      const sliceAngle = (percentage / 100) * 360;
      
      if (percentage < 0.1) return null; // Skip very small slices
      
      const startAngle = (currentAngle * Math.PI) / 180;
      const endAngle = ((currentAngle + sliceAngle) * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      currentAngle += sliceAngle;
      
      return {
        ...item,
        pathData,
        percentage,
        sliceAngle
      };
    }).filter(Boolean);
  };

  const pieSlices = createPieSlices();

  return (
    <div className="space-y-4">
      {/* Chart Container */}
      <div className="flex justify-center">
        <div className={`${sizeClasses[size]} relative`}>
          <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full transform -rotate-90"
          >
            {/* Pie slices */}
            {pieSlices.map((slice, index) => (
              <g key={slice?.group_id || `slice-${index}`}>
                <path
                  d={slice?.pathData}
                  fill={slice?.color.bg}
                  stroke={slice?.color.border}
                  strokeWidth="1"
                  className="transition-all duration-200 hover:brightness-110 cursor-pointer"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              </g>
            ))}
            
            {/* Center circle for donut effect */}
            <circle
              cx="100"
              cy="100"
              r="30"
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="1"
              className="dark:fill-gray-800 dark:stroke-gray-600"
            />
          </svg>
          
          {/* Center total */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatAmount(totalAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-2">
          {chartData.map((item, index) => {
            const percentage = (item.value / totalAmount) * 100;
            
            return (
              <div key={item.group_id || `legend-${index}`} className="flex items-center gap-3 text-sm">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color.bg }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {item.group_name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.expense_count} {item.expense_count === 1 ? 'expense' : 'expenses'}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  {showValues && (
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatAmount(item.value)}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
