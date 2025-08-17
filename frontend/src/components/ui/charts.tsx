import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Types pour les props des graphiques
type ChartProps = {
  data: ChartData<any>;
  options?: ChartOptions<any>;
  className?: string;
};

// Composant LineChart
export function LineChart({ data, options, className }: ChartProps) {
  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    hover: {
      mode: 'nearest' as const,
      intersect: true,
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className={className}>
      <Line data={data} options={options || defaultOptions} />
    </div>
  );
}

// Composant BarChart
export function BarChart({ data, options, className }: ChartProps) {
  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className={className}>
      <Bar data={data} options={options || defaultOptions} />
    </div>
  );
}

// Composant PieChart
export function PieChart({ data, options, className }: ChartProps) {
  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className={className}>
      <Pie data={data} options={options || defaultOptions} />
    </div>
  );
}
