import React, { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function Histogram({ result }) {
  const probabilitiesSource = result?.probabilities || result?.sampled_probabilities

  if (!probabilitiesSource) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>No measurement data</p>
      </div>
    )
  }

  // Format data for chart
  const bitstrings = Object.keys(probabilitiesSource)
    .sort((a, b) => probabilitiesSource[b] - probabilitiesSource[a])
    .slice(0, 8)
  const probabilities = bitstrings.map((bs) => probabilitiesSource[bs] * 100)

  const data = {
    labels: bitstrings,
    datasets: [
      {
        label: 'Probability (%)',
        data: probabilities,
        backgroundColor: [
          'rgba(0, 217, 255, 0.6)',
          'rgba(124, 58, 237, 0.6)',
          'rgba(236, 72, 153, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(168, 85, 247, 0.6)',
          'rgba(244, 63, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
        ],
        borderColor: [
          'rgba(0, 217, 255, 1)',
          'rgba(124, 58, 237, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(244, 63, 94, 1)',
          'rgba(59, 130, 246, 1)',
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(15, 15, 35, 0.9)',
        titleColor: '#00d9ff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(0, 217, 255, 0.3)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => `${context.raw.toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
    },
  }

  return <Bar data={data} options={options} />
}

export default Histogram
