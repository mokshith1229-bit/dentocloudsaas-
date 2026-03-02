import React, { useState, useMemo } from 'react';
import {
    FlaskConical, Search, Filter, Clock, CheckCircle2,
    AlertCircle, Truck, User, Calendar, ExternalLink,
    MoreVertical, FileText, IndianRupee, Trash2, X,
    Printer, MessageSquare
} from 'lucide-react';
import { useApp } from '../App';
import { LabOrder, LabOrderStatus, Vendor } from '../types';

export default function LabOrders() {
    const { labOrders, updateLabOrder, confirmLabOrder, vendors, currentUser } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<LabOrderStatus | 'ALL'>('ALL');
    const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    const isAdminOrReceptionist = currentUser.role === 'ADMIN' || currentUser.role === 'RECEPTIONIST';

    const filteredOrders = useMemo(() => {
        return labOrders.filter(order => {
            const matchesSearch =
                order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.workType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [labOrders, searchTerm, statusFilter]);

    const handleAssignVendor = (vendor: Vendor) => {
        if (!selectedOrder) return;
        updateLabOrder({
            ...selectedOrder,
            vendorId: vendor.id,
            vendorName: vendor.name,
            status: 'ASSIGNED'
        });
        setShowAssignModal(false);
        setSelectedOrder(null);
    };

    const handleConfirmOrder = (order: LabOrder) => {
        confirmLabOrder(order.id);
    };

    const handleCompleteOrder = (order: LabOrder) => {
        updateLabOrder({
            ...order,
            status: 'COMPLETED'
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <FlaskConical className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Clinic Lab Workbench</h1>
                        <p className="text-sm text-slate-500 font-medium">Tracking external laboratory work & technician logistics</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search patient or work..."
                            className="pl-11 pr-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold w-64 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING_ASSIGNMENT">Pending Assignment</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                    </select>
                </div>
            </div>

            {/* Stats Quick View */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatSummary title="Total Jobs" value={labOrders.length} color="indigo" icon={FlaskConical} />
                <StatSummary title="Pending Assignment" value={labOrders.filter(o => o.status === 'PENDING_ASSIGNMENT').length} color="amber" icon={AlertCircle} />
                <StatSummary title="In-Progress" value={labOrders.filter(o => o.status === 'ASSIGNED' || o.status === 'CONFIRMED').length} color="indigo" icon={Clock} />
                <StatSummary title="Completed" value={labOrders.filter(o => o.status === 'COMPLETED').length} color="emerald" icon={CheckCircle2} />
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-8 py-6">Order ID / Date</th>
                            <th className="px-8 py-6">Patient & Work Type</th>
                            <th className="px-8 py-6">Doctor</th>
                            <th className="px-8 py-6">Vendor / Technician</th>
                            <th className="px-8 py-6">Job Status</th>
                            <th className="px-8 py-6">Payment</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                                        <FlaskConical className="w-8 h-8" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">No lab orders found</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-xs font-black text-slate-900 mb-1">{order.id}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{order.date}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xs font-black shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                {order.patientName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{order.patientName}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{order.workType}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5 text-slate-300" />
                                            <span className="text-xs font-bold text-slate-600 tracking-tight">{order.doctorName}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {order.vendorName ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-white transition-all">
                                                    <Truck className="w-4 h-4" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{order.vendorName}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-300 uppercase italic">Not Assigned</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            order.status === 'CONFIRMED' ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-100' :
                                                order.status === 'ASSIGNED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}>
                                            {order.status === 'CONFIRMED' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                                            {order.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-[8px] font-black uppercase ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {order.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {order.status === 'PENDING_ASSIGNMENT' && isAdminOrReceptionist && (
                                                <button
                                                    onClick={() => { setSelectedOrder(order); setShowAssignModal(true); }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                                >
                                                    Assign Lab
                                                </button>
                                            )}

                                            {order.status === 'ASSIGNED' && isAdminOrReceptionist && (
                                                <button
                                                    onClick={() => handleConfirmOrder(order)}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                                                >
                                                    Confirm
                                                </button>
                                            )}

                                            {order.status === 'CONFIRMED' && (
                                                <button
                                                    onClick={() => handleCompleteOrder(order)}
                                                    className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-bold"
                                                >
                                                    Mark Delivered
                                                </button>
                                            )}

                                            <button
                                                disabled
                                                className="p-2.5 bg-slate-50 text-slate-300 rounded-xl cursor-not-allowed group/tip relative"
                                            >
                                                <Printer className="w-4 h-4" />
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] rounded opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap">Print Lab Details (Soon)</span>
                                            </button>

                                            <button
                                                disabled
                                                className="p-2.5 bg-slate-50 text-slate-300 rounded-xl cursor-not-allowed group/tip relative"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] rounded opacity-0 group-hover/tip:opacity-100 transition-opacity whitespace-nowrap">WhatsApp (Soon)</span>
                                            </button>

                                            <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Assign Vendor Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowAssignModal(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Assign Technician</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Select a laboratory for this job</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-10 space-y-3 max-h-[400px] overflow-y-auto">
                            {vendors.filter(v => v.category === 'LAB').length === 0 ? (
                                <div className="text-center py-10">
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No Lab Vendors Registered</p>
                                    <p className="text-[10px] font-medium text-slate-400 mt-2">Add labs in the Vendor Module first</p>
                                </div>
                            ) : (
                                vendors.filter(v => v.category === 'LAB').map(vendor => (
                                    <button
                                        key={vendor.id}
                                        onClick={() => handleAssignVendor(vendor)}
                                        className="w-full flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-[32px] hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                <Truck className="w-6 h-6" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{vendor.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Balance: ₹{vendor.balance}</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-300 group-hover:text-indigo-600 group-hover:bg-indigo-100 transition-all border border-slate-100">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const StatSummary = ({ title, value, icon: Icon, color }: any) => {
    const colorMap: any = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-indigo-50',
        amber: 'bg-amber-50 text-amber-600 border-amber-100 shadow-amber-50',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-emerald-50'
    };

    return (
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${colorMap[color]}`}>
                <Icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <p className={`text-3xl font-black tracking-tight text-slate-900`}>{value}</p>
        </div>
    );
};
