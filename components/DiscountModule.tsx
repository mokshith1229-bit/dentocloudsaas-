import React, { useState } from 'react';
import { Ticket, Plus, Trash2, X, Percent, DollarSign, Calendar, Users, ShoppingCart, Gift, Target } from 'lucide-react';
import { useApp } from '../App';
import { Coupon } from '../types';
import { PROCEDURE_CATALOG } from '../constants';

export default function DiscountModule() {
    const { coupons, addCoupon, deleteCoupon, updateCoupon } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'FREE_SERVICE',
        value: '',
        expiryDate: '',
        minBillValue: '',
        minVisits: '',
        applyOn: 'TOTAL' as 'TOTAL' | 'CONSULTATION' | 'TEST' | 'SERVICE',
        targetService: '',
        freeService: '',
    });

    const handleCreateCoupon = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || (formData.type !== 'FREE_SERVICE' && !formData.value)) return;

        const newCoupon: Coupon = {
            id: `cp-${Date.now()}`,
            code: formData.code.toUpperCase(),
            type: formData.type,
            value: formData.type === 'FREE_SERVICE' ? 0 : parseFloat(formData.value),
            expiryDate: formData.expiryDate || undefined,
            isActive: true,
            usageCount: 0,
            minBillValue: formData.minBillValue ? parseFloat(formData.minBillValue) : undefined,
            minVisits: formData.minVisits ? parseInt(formData.minVisits) : undefined,
            applyOn: formData.applyOn,
            targetService: formData.targetService || undefined,
            freeService: formData.freeService || undefined,
        };

        addCoupon(newCoupon);
        setShowModal(false);
        setFormData({
            code: '', type: 'PERCENTAGE', value: '', expiryDate: '',
            minBillValue: '', minVisits: '', applyOn: 'TOTAL',
            targetService: '', freeService: ''
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Discount Management</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Create and manage patient coupons</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Create Coupon
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                    <div key={coupon.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                {coupon.type === 'FREE_SERVICE' ? <Gift className="w-6 h-6" /> : <Ticket className="w-6 h-6" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateCoupon({ ...coupon, isActive: !coupon.isActive })}
                                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${coupon.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}
                                >
                                    {coupon.isActive ? 'Active' : 'Paused'}
                                </button>
                                <button
                                    onClick={() => deleteCoupon(coupon.id)}
                                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{coupon.code}</h3>
                            <p className="text-2xl font-black text-indigo-600">
                                {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` :
                                    coupon.type === 'FIXED' ? `₹${coupon.value}` : 'FREE GIFT'}
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-1 font-bold">
                                    {coupon.type === 'FREE_SERVICE' ? `(+ ${coupon.freeService})` : 'Discount'}
                                </span>
                            </p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {coupon.minBillValue && (
                                <span className="text-[8px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100 flex items-center gap-1">
                                    <ShoppingCart className="w-2.5 h-2.5" /> Min ₹{coupon.minBillValue}
                                </span>
                            )}
                            {coupon.minVisits && (
                                <span className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100 flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5" /> {coupon.minVisits}+ Visits
                                </span>
                            )}
                            {coupon.applyOn && coupon.applyOn !== 'TOTAL' && (
                                <span className="text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1">
                                    <Target className="w-2.5 h-2.5" /> On {coupon.applyOn}
                                </span>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Usage</p>
                                    <p>{coupon.usageCount} Times</p>
                                </div>
                                {coupon.expiryDate && (
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Expires</p>
                                        <p>{new Date(coupon.expiryDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {coupons.length === 0 && (
                    <div className="lg:col-span-3 py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-center px-6">
                        <Ticket className="w-12 h-12 text-slate-300 mb-4" />
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">No Active Coupons</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-[200px]">Create your first coupon to offer patient discounts</p>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Advanced Coupon</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Set complex discount rules</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full text-slate-400 shadow-sm transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCoupon} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Basic Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coupon Code</label>
                                    <input
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 text-slate-900 uppercase"
                                        placeholder="e.g. LOYALTY50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        value={formData.expiryDate}
                                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Discount Logic */}
                            <div className="space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Discount Config</label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Discount Type</label>
                                        <div className="flex p-1 bg-slate-200/50 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.type === 'PERCENTAGE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                %
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: 'FIXED' })}
                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.type === 'FIXED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                ₹
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: 'FREE_SERVICE' })}
                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${formData.type === 'FREE_SERVICE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                            >
                                                GIFT
                                            </button>
                                        </div>
                                    </div>
                                    {formData.type !== 'FREE_SERVICE' && (
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Value</label>
                                            <input
                                                required
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                                className="w-full px-4 py-2 bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                                                placeholder="0"
                                            />
                                        </div>
                                    )}
                                </div>

                                {formData.type !== 'FREE_SERVICE' && (
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Apply On</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['TOTAL', 'CONSULTATION', 'TEST', 'SERVICE'].map((opt) => (
                                                <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, applyOn: opt as any })}
                                                    className={`py-2 rounded-lg text-[8px] font-black uppercase tracking-tight transition-all border ${formData.applyOn === opt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Conditions */}
                            <div className="space-y-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Conditions / Eligibility</label>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Bill Value (₹)</label>
                                        <input
                                            type="number"
                                            value={formData.minBillValue}
                                            onChange={(e) => setFormData({ ...formData, minBillValue: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="e.g. 500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Past Visits</label>
                                        <input
                                            type="number"
                                            value={formData.minVisits}
                                            onChange={(e) => setFormData({ ...formData, minVisits: e.target.value })}
                                            className="w-full px-4 py-2 bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="e.g. 3"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Requirement (Target Service)</label>
                                    <select
                                        value={formData.targetService}
                                        onChange={(e) => setFormData({ ...formData, targetService: e.target.value })}
                                        className="w-full px-4 py-2 bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="">No specific service required</option>
                                        {PROCEDURE_CATALOG.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>

                                {formData.type === 'FREE_SERVICE' && (
                                    <div className="space-y-2">
                                        <label className="text-[8px] font-black text-indigo-600 uppercase tracking-widest ml-1 italic animate-pulse">Gift: Select Free service to add</label>
                                        <select
                                            required
                                            value={formData.freeService}
                                            onChange={(e) => setFormData({ ...formData, freeService: e.target.value })}
                                            className="w-full px-4 py-2 bg-indigo-50 border-2 border-indigo-200 rounded-xl text-sm font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="">Select free service...</option>
                                            {PROCEDURE_CATALOG.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                            >
                                Launch Advanced Logic
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
