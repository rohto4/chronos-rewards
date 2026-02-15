/**
 * Chartコンポーネント
 *
 * グラフ表示用コンポーネント（Recharts ラッパー）
 * - BarChart（棒グラフ）
 * - LineChart（折れ線グラフ）
 * - PieChart（円グラフ）
 * - AreaChart（エリアグラフ）
 */

'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * チャートデータポイントの型
 */
export interface ChartDataPoint {
  [key: string]: string | number;
}

/**
 * 共通のChartプロパティ
 */
interface BaseChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
}

/**
 * BarChartのプロパティ型
 */
export interface BarChartProps extends BaseChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  label?: string;
}

/**
 * BarChart（棒グラフ）
 */
export const BarChart = ({
  data,
  xKey,
  yKey,
  color = '#3b82f6',
  label,
  height = 300,
  className,
}: BarChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          {label && <Legend />}
          <Bar dataKey={yKey} fill={color} name={label} radius={[8, 8, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * LineChartのプロパティ型
 */
export interface LineChartProps extends BaseChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  label?: string;
}

/**
 * LineChart（折れ線グラフ）
 */
export const LineChart = ({
  data,
  xKey,
  yKey,
  color = '#3b82f6',
  label,
  height = 300,
  className,
}: LineChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          {label && <Legend />}
          <Line
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            name={label}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * PieChartのプロパティ型
 */
export interface PieChartProps extends BaseChartProps {
  nameKey: string;
  valueKey: string;
  colors?: string[];
}

/**
 * PieChart（円グラフ）
 */
export const PieChart = ({
  data,
  nameKey,
  valueKey,
  colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'],
  height = 300,
  className,
}: PieChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * AreaChartのプロパティ型
 */
export interface AreaChartProps extends BaseChartProps {
  xKey: string;
  yKey: string;
  color?: string;
  label?: string;
}

/**
 * AreaChart（エリアグラフ）
 */
export const AreaChart = ({
  data,
  xKey,
  yKey,
  color = '#3b82f6',
  label,
  height = 300,
  className,
}: AreaChartProps) => {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          {label && <Legend />}
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            fill={color}
            fillOpacity={0.3}
            name={label}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};
