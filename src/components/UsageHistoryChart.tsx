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
        backgroundColor: history.map((_, index) => (index === lastIndex ? '#5b5bf6' : 'rgba(91, 91, 246, 0.35)')),
        borderRadius: 6,
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
            return `${displayFormatter.number(point.tokens)} tokens · ${point.requests} solicitudes`
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8b8fa3' } },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(139, 143, 163, 0.15)' },
        ticks: { color: '#8b8fa3', callback: (value) => displayFormatter.number(Number(value)) },
      },
    },
  }

  return (
    <section className="card">
      <header className="card__header">
        <h2 className="card__title">Uso de los últimos 7 días</h2>
        <span className="card__caption">
          {displayFormatter.number(totalTokens)} tokens · {displayFormatter.number(totalRequests)} solicitudes
        </span>
      </header>
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
