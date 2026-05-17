'use client';
 
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
 
interface OHLCV {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
 
interface PriceChartProps {
  data?: OHLCV[];
}
 
const MOCK_DATA: OHLCV[] = [
  { date: '2024-01-01', open: 1860, high: 1905, low: 1842, close: 1887, volume: 1000000 },
  { date: '2024-01-02', open: 1887, high: 1950, low: 1875, close: 1932, volume: 1200000 },
  { date: '2024-01-03', open: 1932, high: 1948, low: 1901, close: 1914, volume: 950000  },
  { date: '2024-01-04', open: 1914, high: 1988, low: 1910, close: 1975, volume: 1150000 },
  { date: '2024-01-05', open: 1975, high: 2021, low: 1968, close: 2008, volume: 1300000 },
  { date: '2024-01-06', open: 2008, high: 2065, low: 1997, close: 2047, volume: 1400000 },
  { date: '2024-01-07', open: 2047, high: 2059, low: 1983, close: 1998, volume: 1100000 },
];
 
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) 
  {
    const data = payload[0].payload as OHLCV;
    return (
      <div style={{
        backgroundColor: '#414042',
        border: '1px solid #ffffff4b',
        padding: '8px',
        borderRadius: '4px',
      }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '12px' }}>{data.date}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>OPEN: R{data.open.toFixed(2)}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>HIGH: R{data.high.toFixed(2)}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>LOW: R{data.low.toFixed(2)}</p>
        <p style={{ margin: '2px 0', fontSize: '12px' }}>CLOSE: R{data.close.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};
 
export default function PriceChart({ data = MOCK_DATA }: PriceChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    name: item.date,
  }));
 
  return (
    <ResponsiveContainer width="100%" aspect={1.618}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff59" />
        <XAxis dataKey="name" stroke="#ffffff" />
        <YAxis stroke="#ffffff" tickFormatter={(v) => `R${v}`} width={70} />
        <Tooltip
          cursor={{ stroke: '#9ca3af' }}
          content={<CustomTooltip />}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="close"
          stroke="#6950a1"
          strokeWidth={4}
          dot={{ fill: '#6950a1' }}
          activeDot={{ r: 8, stroke: '#1c75bc' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}