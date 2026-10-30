import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip, type ChartOptions } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import type { DailyUsagePoint } from '../api/types'
import { displayFormatter } from '../domain/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface UsageHistoryChartProps {
  history: DailyUsagePoint[]
}

export function UsageHistoryChart({ history }: UsageHistoryChartProps) {
  const totalTokens = history.reduce((sum, point) => sum + point.tokens, 0)
  const totalRequests = history.reduce((sum, point) => sum + point.requests, 0)
  const lastIndex = history.length - 1

  const data = {
    labels: history.map((point, index) => (index === lastIndex ? 'Hoy' : displayFormatter.isoDateShort(point.date))),
    datasets: [
      {
        label: 'Tokens',
        data: history.map((point) => point.tokens),
        backgroundColor: history.map((_, index) => (index === lastIndex ? '#0e7c86' : 'rgba(14, 124, 134, 0.32)')),
        borderRadius: 4,
        maxBarThickness: 36,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = history[context.dataIndex]
            return `${displayFormatter.number(point.tokens)} tokens en ${point.requests} solicitudes`
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#7a8a90', font: { family: 'IBM Plex Sans' } } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(122, 138, 144, 0.18)' },
        ticks: { color: '#7a8a90', callback: (value) => displayFormatter.number(Number(value)) },
      },
    },
  }

  return (
    <section className="panel-section" aria-labelledby="history-heading">
      <div className="panel-section__heading">
        <h2 id="history-heading">Últimos 7 días</h2>
        <span className="panel-section__aside">
          {displayFormatter.number(totalTokens)} tokens en {displayFormatter.number(totalRequests)} solicitudes
        </span>
      </div>
      <div className="chart-container">
        {history.length > 0 ? (
          <Bar data={data} options={options} aria-label="Gráfica de barras de tokens consumidos por día" />
        ) : (
          <p className="muted">Sin datos de uso todavía.</p>
        )}
      </div>
    </section>
  )
}
