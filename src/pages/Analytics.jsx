import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../context/AppContext';
import { TrendingUp, Users, Calendar, DollarSign, Award, Activity } from 'lucide-react';

export default function Analytics() {
  const { customers, attendance, memberships, shakeLogs, paymentLogs, visitors, otherClubMembers, closings, fetchData } = useAppContext();
  const [layoutReady, setLayoutReady] = useState(false);
  const [historicalLoaded, setHistoricalLoaded] = useState(false);

  useEffect(() => {
    if (!historicalLoaded && fetchData) {
      fetchData({ loadHistorical: true }).then(() => setHistoricalLoaded(true));
    }
  }, [historicalLoaded, fetchData]);

  useEffect(() => {
    const id = setTimeout(() => setLayoutReady(true), 500);
    return () => clearTimeout(id);
  }, []);

  // Color theme variables
  const COLORS = ['#1F4D3A', '#C2A878', '#7A9B8E', '#D97706'];

  // Calculations
  const calculations = useMemo(() => {
    // Plans distribution
    const planCounts = {};
    memberships.forEach(m => {
      planCounts[m.plan] = (planCounts[m.plan] || 0) + 1;
    });
    const planData = Object.keys(planCounts).map(planName => ({
      name: planName,
      value: planCounts[planName]
    }));

    // Focus / Purpose distribution
    const purposeCounts = { Health: 0, Business: 0, Mental: 0 };
    customers.forEach(c => {
      if (c.purpose) {
        purposeCounts[c.purpose] = (purposeCounts[c.purpose] || 0) + 1;
      } else {
        purposeCounts.Health = purposeCounts.Health + 1; // Default fallback
      }
    });
    const focusData = Object.keys(purposeCounts).map(k => ({
      name: k === 'Health' ? 'Health & Vitality' : k === 'Business' ? 'Entrepreneurial Harmony' : 'Holistic Mental Clarity',
      value: purposeCounts[k]
    }));

    // Expected Monthly Yield (Active plans total)
    const monthlyYield = memberships
      .filter(m => m.status === 'Active')
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    // Active attendance rate
    const totalPossible = customers.length;
    const presentToday = attendance.filter(a => a.status === 'Present').length;
    const attendanceRate = totalPossible ? Math.round((presentToday / totalPossible) * 100) : 0;

    return {
      planData,
      focusData,
      monthlyYield,
      attendanceRate
    };
  }, [customers, memberships, attendance]);

  const mockRevenueTrend = [
    { name: 'Jan', revenue: 45000 },
    { name: 'Feb', revenue: 52000 },
    { name: 'Mar', revenue: 48000 },
    { name: 'Apr', revenue: 61000 },
    { name: 'May', revenue: 59000 },
    { name: 'Jun', revenue: calculations.monthlyYield || 75000 },
  ];

  const mockAttendanceTrend = [
    { name: 'Mon', rate: 75 },
    { name: 'Tue', rate: 82 },
    { name: 'Wed', rate: 68 },
    { name: 'Thu', rate: 90 },
    { name: 'Fri', rate: 85 },
    { name: 'Sat', rate: 95 },
    { name: 'Sun', rate: calculations.attendanceRate || 60 },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-forest tracking-tight">Intelligence & Analytics</h1>
        <p className="text-muted mt-2 font-medium">Deep data-driven insights into your wellness sanctuary's operations.</p>
      </div>

      {/* Grid Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="luxury-card p-6 border-l-4 border-l-forest flex items-center space-x-6">
          <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-forest shadow-sm">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.2em] mb-1">Expected Yield</p>
            <p className="text-2xl font-semibold text-forest">₹{(calculations.monthlyYield).toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="luxury-card p-6 border-l-4 border-l-gold flex items-center space-x-6">
          <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-gold shadow-sm">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.2em] mb-1">Attendance Today</p>
            <p className="text-2xl font-semibold text-forest">{calculations.attendanceRate}%</p>
          </div>
        </div>

        <div className="luxury-card p-6 border-l-4 border-l-sage flex items-center space-x-6">
          <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-sage shadow-sm">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.2em] mb-1">Active Accounts</p>
            <p className="text-2xl font-semibold text-forest">{memberships.filter(m => m.status === 'Active').length}</p>
          </div>
        </div>

        <div className="luxury-card p-6 border-l-4 border-l-amber-500 flex items-center space-x-6">
          <div className="w-12 h-12 bg-offwhite border border-beige rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-muted uppercase tracking-[0.2em] mb-1">Total Enrollment</p>
            <p className="text-2xl font-semibold text-forest">{customers.length}</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="luxury-card p-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-forest tracking-tight">Revenue Progression</h3>
            <span className="px-3 py-1.5 bg-offwhite border border-beige rounded-xl text-[9px] font-semibold text-forest uppercase tracking-widest">Year-to-date</span>
          </div>
          <div className="h-[300px]">
            {layoutReady && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={mockRevenueTrend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1F4D3A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1F4D3A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#1F4D3A" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="luxury-card p-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-forest tracking-tight">Daily Presence Rate</h3>
            <span className="px-3 py-1.5 bg-offwhite border border-beige rounded-xl text-[9px] font-semibold text-forest uppercase tracking-widest">Weekly</span>
          </div>
          <div className="h-[300px]">
            {layoutReady && (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={mockAttendanceTrend} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 700 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip cursor={{ fill: '#F7F6F2' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="rate" fill="#C2A878" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="luxury-card p-8 sm:p-10">
          <h3 className="text-xl font-bold text-forest tracking-tight mb-8">Practitioner Focus Distribution</h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="w-[200px] h-[200px] shrink-0">
              {layoutReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={calculations.focusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {calculations.focusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-4 w-full">
              {calculations.focusData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-offwhite rounded-xl border border-beige/40">
                  <div className="flex items-center space-x-3">
                    <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-xs font-bold text-forest">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-forest">{item.value} ({Math.round(item.value / (customers.length || 1) * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="luxury-card p-8 sm:p-10">
          <h3 className="text-xl font-bold text-forest tracking-tight mb-8">Selected Engagement Plans</h3>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="w-[200px] h-[200px] shrink-0">
              {layoutReady && (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={calculations.planData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {calculations.planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-4 w-full">
              {calculations.planData.length > 0 ? (
                calculations.planData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-offwhite rounded-xl border border-beige/40">
                    <div className="flex items-center space-x-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-xs font-bold text-forest">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-forest">{item.value} ({Math.round(item.value / (memberships.length || 1) * 100)}%)</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 w-full text-muted text-[10px] font-semibold uppercase tracking-widest">
                  No memberships found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
