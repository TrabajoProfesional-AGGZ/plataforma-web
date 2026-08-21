import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Convierte cada mes de `{ mes, a_termino, fuera_de_termino }` (valores absolutos)
 * a porcentajes sobre el total del mes, para graficar barras 100% apiladas.
 */
function calcularPorcentajes(datos) {
  return datos.map((t) => {
    const total = (t.a_termino ?? 0) + (t.fuera_de_termino ?? 0);
    const pctATermino = total > 0 ? (t.a_termino / total) * 100 : 0;
    const pctFueraDeTermino = total > 0 ? (t.fuera_de_termino / total) * 100 : 0;
    return { mes: t.mes, pctATermino, pctFueraDeTermino };
  });
}

/**
 * Gráfico de barras 100% apiladas con la proporción mensual de pagos a término
 * vs. fuera de término. Muestra un mensaje si no hay datos en el rango.
 * @param {{ datos: Array<{ mes: string, a_termino: number, fuera_de_termino: number }> }} props
 */
export function TendenciasPagoChart({ datos }) {
  if (!datos || datos.length === 0) {
    return (
      <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
        No hay datos de tendencias de pago para este rango.
      </p>
    );
  }

  const datosPorcentaje = calcularPorcentajes(datos);

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={datosPorcentaje} margin={{ top: 20, right: 30, left: 20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-medium)" />
          <XAxis
            dataKey="mes"
            tick={{ fill: 'var(--color-text-secondary)', fontSize: '0.75rem' }}
            axisLine={{ stroke: 'var(--color-border-medium)' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: '0.75rem' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            formatter={(value) => `${value.toFixed(1)}%`}
            contentStyle={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-medium)' }}
          />
          <Legend />
          <Bar dataKey="pctATermino" name="A término" stackId="pct" fill="var(--color-text-primary)" />
          <Bar dataKey="pctFueraDeTermino" name="Fuera de término" stackId="pct" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
