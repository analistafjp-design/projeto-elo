import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NegociacaoPorMes } from "@/services/dashboardService";

export function NegociacoesPorMesChart({ data }: { data: NegociacaoPorMes[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Negociações por mês</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <SemDados />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#EAF2FE" }}
                contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }}
              />
              <Bar dataKey="quantidade" name="Negociações" fill="#1668E3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function SemDados() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Ainda não há dados suficientes para exibir este gráfico.
    </div>
  );
}
