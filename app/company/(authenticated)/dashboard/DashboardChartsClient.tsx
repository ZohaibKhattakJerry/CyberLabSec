"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { _motion } from "framer-_motion";

interface ChartData {
  applicationsData: unknown[];
  tasksData: unknown[];
  applicantStatusData: unknown[];
}

const COLORS = ["var(--purple)", "var(--blue)", "var(--green)", "var(--amber)", "var(--text-muted)"];

export default function DashboardChartsClient({ data }: { data: ChartData }) {
  const [activeTab, setActiveTab] = useState<"applications" | "tasks" | "applicants">("applications");

  return (
    <div className="card" style={{ padding: 24, marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Analytics Overview</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            className={`btn ${activeTab === "applications" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "6px 12px", fontSize: 13 }}
            onClick={() => setActiveTab("applications")}
          >
            Applications
          </button>
          <button 
            className={`btn ${activeTab === "tasks" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "6px 12px", fontSize: 13 }}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
          </button>
          <button 
            className={`btn ${activeTab === "applicants" ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "6px 12px", fontSize: 13 }}
            onClick={() => setActiveTab("applicants")}
          >
            Applicant Status
          </button>
        </div>
      </div>

      <div style={{ height: 400, width: "100%" }}>
        {activeTab === "applications" && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.applicationsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--purple)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <Tooltip 
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }}
                itemStyle={{ color: "var(--purple)" }}
              />
              <Area type="monotone" dataKey="count" name="Applications" stroke="var(--purple)" fillOpacity={1} fill="url(#colorApps)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === "tasks" && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.tasksData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="team" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Legend wrapperStyle={{ paddingTop: 20 }} />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="var(--amber)" radius={[0, 0, 4, 4]} />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="var(--green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === "applicants" && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.applicantStatusData}
                cx="50%"
                cy="50%"
                innerRadius={100}
                outerRadius={140}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              >
                {data.applicantStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
