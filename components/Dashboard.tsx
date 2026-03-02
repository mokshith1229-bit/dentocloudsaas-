
import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical
} from 'lucide-react';
import { useApp } from '../App';

const data = [
  { name: 'Mon', revenue: 4000, visits: 24 },
  { name: 'Tue', revenue: 3000, visits: 18 },
  { name: 'Wed', revenue: 2000, visits: 15 },
  { name: 'Thu', revenue: 2780, visits: 20 },
  { name: 'Fri', revenue: 1890, visits: 12 },
  { name: 'Sat', revenue: 2390, visits: 14 },
  { name: 'Sun', revenue: 3490, visits: 22 },
];

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'];

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-lg border border-slate-200 hover:border-slate-300 transition-all">
    <div className="flex items-center justify-between mb-3">
      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
        <Icon className="w-5 h-5" />
      </div>
      {change && (
        <span className={`text-xs font-medium flex items-center gap-1 ${trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {change}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-slate-600">{title}</h3>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const { appointments } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const todaysQueue = appointments.filter(a => a.date === today);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value="₹12,840" change="+12.5%" icon={DollarSign} trend="up" />
        <StatCard title="Total Patients" value="1,248" change="+3.2%" icon={Users} trend="up" />
        <StatCard title="Appointments" value="48" change="-4.1%" icon={Clock} trend="up" />
        <StatCard title="Check Ins" value="40" icon={Users} trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Revenue Overview</h2>
              <p className="text-sm text-slate-500 mt-0.5">Weekly earnings breakdown</p>
            </div>
            <select className="bg-white border border-slate-300 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white p-6 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Today's Queue</h2>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{todaysQueue.length} Active</span>
          </div>
          <div className="h-[300px] overflow-hidden relative group scrolling-queue-container">
            <div className="space-y-3 scrolling-queue">
              {todaysQueue.length === 0 ? (
                <div className="py-10 text-center text-slate-400 font-medium text-xs">
                  No patients in queue today
                </div>
              ) : (
                <>
                  {/* First set of items */}
                  {todaysQueue
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((apt, index) => (
                      <div key={apt.id} className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{apt.patientName}</div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase">{apt.time} • {apt.doctorName}</div>
                          </div>
                        </div>
                        <div className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${apt.status === 'CHECKED_IN' ? 'bg-amber-100 text-amber-700' :
                          apt.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white shadow-sm' :
                            apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-200 text-slate-600'
                          }`}>
                          {apt.status.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  {/* Duplicate set for seamless loop if needed */}
                  {todaysQueue.length > 4 && todaysQueue
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((apt, index) => (
                      <div key={`${apt.id}-clone`} className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{apt.patientName}</div>
                            <div className="text-[10px] text-slate-500 font-semibold uppercase">{apt.time} • {apt.doctorName}</div>
                          </div>
                        </div>
                        <div className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${apt.status === 'CHECKED_IN' ? 'bg-amber-100 text-amber-700' :
                          apt.status === 'IN_PROGRESS' ? 'bg-indigo-600 text-white shadow-sm' :
                            apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-200 text-slate-600'
                          }`}>
                          {apt.status.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
