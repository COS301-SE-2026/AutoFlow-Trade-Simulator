'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { RechartsDevtools } from '@recharts/devtools';

// #region Sample data
const data = [
  {
    name: 'Jan 1',
    uv: 0.29,
  },
  {
    name: 'Jan 8',
    uv: 0.31,
  },
  {
    name: 'Jan 15',
    uv: 0.27,
  },
  {
    name: 'Jan 22',
    uv: 0.35,
  },
  {
    name: 'Jan 29',
    uv: 0.38,
  },
  {
    name: 'Feb 5',
    uv: 0.42,
  },
  {
    name: 'Feb 12',
    uv: 0.45,
  },
];

// #endregion
export const SimpleAreaChart = () => {
  return (
    <AreaChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
      }}
      onContextMenu={(_, e) => e.preventDefault()}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" niceTicks="snap125" />
      <YAxis width="auto" niceTicks="snap125" />
      <Tooltip />
      <Area type="monotone" dataKey="uv" stroke="#00a79d" fill="#00a79d" opacity={0.6} />
      <RechartsDevtools />
    </AreaChart>
  );
};

export default SimpleAreaChart;
