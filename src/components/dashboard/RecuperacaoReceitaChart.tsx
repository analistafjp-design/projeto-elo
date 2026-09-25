import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RecuperacaoMes } from "@/services/dashboardService";
import { SemDados } from "./NegociacoesPorMesChart";

export function RecuperacaoReceitaChart({ data }: { data: RecuperacaoMes[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperação de receita</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <SemDados />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="negociado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B2A4A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0B2A4A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="recuperado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="negociado"
                name="Negociado"
                stroke="#0B2A4A"
                fill="url(#negociado)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="recuperado"
                name="Recuperado"
                stroke="#16A34A"
                fill="url(#recuperado)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
