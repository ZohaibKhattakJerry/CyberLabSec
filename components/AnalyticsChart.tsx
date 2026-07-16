"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsChart({ data }: { data: unknown[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-muted)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            cursor={{ fill: "rgba(168,85,247,0.05)" }}
            contentStyle={{ 
              background: "#121220", 
              border: "1px solid var(--border-accent)", 
              borderRadius: 8,
              boxShadow: "var(--shadow-purple)"
            }}
            itemStyle={{ color: "var(--text-primary)", fontWeight: 600 }}
            labelStyle={{ color: "var(--text-muted)", marginBottom: 4 }}
          />
          <Bar dataKey="tasks" fill="var(--purple)" radius={[4, 4, 0, 0]} maxBarSize={40} name="Completed Tasks" />
          <Bar dataKey="submissions" fill="var(--blue)" radius={[4, 4, 0, 0]} maxBarSize={40} name="Submissions" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
