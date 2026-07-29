"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

export function PerformanceCharts({ charts }: { charts: any }) {
  const subjectBars = charts?.subjectBars || [];
  const attendancePie = charts?.attendancePie || [];
  const progressLine = charts?.progressLine || [];
  const radar = subjectBars.map((x: any) => ({ subject: x.subject, score: Math.round((x.obtained / x.max) * 100) }));
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><h3 className="mb-4 font-bold">Performance Over Time</h3><ResponsiveContainer width="100%" height={240}><LineChart data={progressLine}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line dataKey="percentage" stroke="#147a52" strokeWidth={3} /></LineChart></ResponsiveContainer></Card>
      <Card><h3 className="mb-4 font-bold">Subject Comparison</h3><ResponsiveContainer width="100%" height={240}><BarChart data={subjectBars}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="subject" /><YAxis /><Tooltip /><Bar dataKey="obtained" fill="#0ea5e9" /></BarChart></ResponsiveContainer></Card>
      <Card><h3 className="mb-4 font-bold">Attendance</h3><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={attendancePie} dataKey="value" nameKey="name" outerRadius={80}>{attendancePie.map((_: any, i: number) => <Cell key={i} fill={i === 0 ? "#147a52" : "#d4af37"} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card>
      <Card><h3 className="mb-4 font-bold">Overall Skills</h3><ResponsiveContainer width="100%" height={240}><RadarChart data={radar}><PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis /><Radar dataKey="score" stroke="#0f3d2e" fill="#147a52" fillOpacity={0.35} /></RadarChart></ResponsiveContainer></Card>
    </div>
  );
}
