# QuotaGate IA · Frontend

Interfaz en React + TypeScript (Vite) para consumir un servicio de IA protegido por proxies de rate limiting y cuotas.

- **Backend:** https://github.com/FelipeCeron1404/quotagate-backend

## Funcionalidades

- Interfaz tipo chat para enviar prompts al servicio de IA.
- Barra de progreso de tokens usados vs. disponibles, actualizada después de cada solicitud.
- Contador de solicitudes por minuto con cuenta regresiva hasta el reinicio.
- Al alcanzar el rate limit (429) se deshabilita el botón de envío y se muestra el tiempo que falta, leído del encabezado `Retry-After`.
- Al agotar la cuota mensual (402) aparece un modal de upgrade con pago simulado.
- Gráfica de barras con el uso diario de los últimos 7 días (Chart.js).
- Badge del plan actual con colores diferenciados (FREE, PRO, ENTERPRISE).
- Estimador de tokens antes de enviar el prompt.
- Visualización del recorrido de cada solicitud por la cadena de proxies.

## Estructura

```
src/
├── api/          Cliente HTTP (QuotaApiClient) y tipos de la API
├── domain/       TokenEstimator, PlanCatalog, PaymentSimulator, formateadores
├── hooks/        useQuotaDashboard, useCountdown
├── components/   ChatPanel, QuotaMeter, RateLimitMeter, UsageHistoryChart, UpgradeModal…
└── styles/       Estilos con tema claro y oscuro
```

## Ejecutar en local

```bash
npm install
npm run dev
```

La URL del backend se configura con `VITE_API_BASE_URL` (ver `.env.example`). El build de producción usa `.env.production`.

## Pago simulado

El modal de upgrade valida el formulario en el navegador y genera una referencia `SIM-…`. No se realiza ningún cobro y los datos de la tarjeta nunca se envían al servidor. Tarjeta de prueba: `4242 4242 4242 4242`.
