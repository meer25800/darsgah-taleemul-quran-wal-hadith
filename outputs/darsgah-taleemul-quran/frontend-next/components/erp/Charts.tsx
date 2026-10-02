"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";

export function PerformanceCharts({ charts }: { charts: any }) {
  const subjectBars = charts?.subjectBars || [];
  const attendancePie = charts?.attendancePie || [];
  const progressLine = charts?.progressLine || [];
  const radar = subjectBars.map((x: any) => ({ subject: x.subject, score: Math.round((x.obtained / x.max) * 100) }));
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden"><h3 className="mb-4 font-bold">Performance Over Time</h3><ResponsiveContainer width="100%" height={220}><LineChart data={progressLine} margin={{ left: -18, right: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" tick={{ fontSize: 11 }} minTickGap={12} /><YAxis tick={{ fontSize: 11 }} /><Tooltip trigger="click" /><Line dataKey="percentage" stroke="#147a52" strokeWidth={3} /></LineChart></ResponsiveContainer></Card>
      <Card className="overflow-hidden"><h3 className="mb-4 font-bold">Subject Comparison</h3><ResponsiveContainer width="100%" height={220}><BarChart data={subjectBars} margin={{ left: -18, right: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="subject" tick={{ fontSize: 10 }} interval="preserveStartEnd" minTickGap={10} /><YAxis tick={{ fontSize: 11 }} /><Tooltip trigger="click" /><Bar dataKey="obtained" fill="#0ea5e9" /></BarChart></ResponsiveContainer></Card>
      <Card className="overflow-hidden"><h3 className="mb-4 font-bold">Attendance</h3><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={attendancePie} dataKey="value" nameKey="name" outerRadius="70%">{attendancePie.map((_: any, i: number) => <Cell key={`attendance-${i}`} fill={i === 0 ? "#147a52" : "#d4af37"} />)}</Pie><Tooltip trigger="click" /></PieChart></ResponsiveContainer></Card>
      <Card className="overflow-hidden"><h3 className="mb-4 font-bold">Overall Skills</h3><ResponsiveContainer width="100%" height={220}><RadarChart data={radar}><PolarGrid /><PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} /><PolarRadiusAxis tick={{ fontSize: 10 }} /><Radar dataKey="score" stroke="#0f3d2e" fill="#147a52" fillOpacity={0.35} /></RadarChart></ResponsiveContainer></Card>
    </div>
  );
}
