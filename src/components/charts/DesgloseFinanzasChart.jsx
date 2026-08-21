import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import EmptyState from '../feedback/EmptyState';

/**
 * Gráfico de barras con el desglose de recaudación por concepto, ordenado
 * de mayor a menor monto. Muestra un `EmptyState` si no hay datos.
 * @param {{ datos: Array<{ concepto: string, monto: number }> }} props
 */
export function DesgloseFinanzasChart({ datos }) {
  if (!datos || datos.length === 0) {
    return <EmptyState mensaje="No hay datos financieros para este período." />;
  }

  const datosOrdenados = [...datos].sort((a, b) => b.monto - a.monto);

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer>
        <BarChart
          data={datosOrdenados}
          margin={{ top: 20, right: 30, left: 20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
          <XAxis 
            dataKey="concepto" 
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border-medium)' }}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip 
            formatter={(value) => [`$${value.toLocaleString('es-AR')}`, 'Recaudación']}
            contentStyle={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-medium)' }}
          />
          <Bar 
            dataKey="monto" 
            fill="var(--color-text-primary)" 
            radius={[4, 4, 0, 0]} 
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}