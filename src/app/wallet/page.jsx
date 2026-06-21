"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Camera,
  CheckCircle,
  CreditCard,
  FileText,
  History,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  Wallet
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_BASE || '';

const fallbackHistory = [
  {
    transaction_id: "LT-882104",
    description: "System Initialized - Welcome Bonus",
    created_at: "2024-01-12T08:30:00.000Z",
    status: "COMPLETED",
    amount: 0,
    type: "CREDIT"
  },
  {
    transaction_id: "LT-882103",
    description: "Account Verification Pending",
    created_at: "2024-01-10T08:30:00.000Z",
    status: "PENDING",
    amount: null,
    type: "PENDING"
  }
];

export default function WalletDashboard() {
  const [walletBalance, setWalletBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          "X-Tenant-ID": "TENANT-001"
        };

        const [balanceRes, historyRes] = await Promise.all([
          fetch(`${API}/api/logistics/wallet`, { headers }),
          fetch(`${API}/api/logistics/wallet/history`, { headers })
        ]);

        const balanceData = await balanceRes.json();
        const historyData = await historyRes.json();

        if (balanceData.success) setWalletBalance(balanceData.balance);
        if (historyData.success) setHistory(historyData.history || []);
      } catch (error) {
        console.error("Wallet fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const ledgerRows = history.length > 0 ? history.slice(0, 5) : fallbackHistory;

  return (
    <main className="min-h-full bg-white px-6 py-5 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=280&q=80"
                  alt="Vikram Singh"
                  className="h-full w-full object-cover"
                />
                <button className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm">
                  <Camera size={15} />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-950">Vikram Singh</h1>
                  <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    Pro Verified
                  </span>
                </div>
                <p className="mt-2 text-lg font-semibold text-slate-700">Principal Logistics Architect</p>

                <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    <span>Member Since January 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>Global Operations Hub</span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="rounded-md border border-slate-900 bg-white px-5 py-2 text-sm font-semibold text-slate-950">
                    Edit Profile
                  </button>
                  <button className="rounded-md px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={17} className="text-slate-700" />
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Logistics Wallet</span>
              </div>
              <MoreVertical size={17} className="text-slate-500" />
            </div>

            <div className="mt-7">
              <p className="text-sm text-slate-500">Available Balance</p>
              <div className="mt-1 text-4xl font-bold tracking-tight text-slate-950">
                {loading ? "â‚¹0.00" : `â‚¹${Number(walletBalance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
              </div>
            </div>

            <div className="mt-10 flex gap-3">
              <button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                <Plus size={15} />
                Recharge
              </button>
              <button className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">
                <History size={15} />
                History
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <FileText size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-950">Contact Information</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-md bg-slate-50 p-4">
                <Mail size={17} className="text-slate-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Email Address</p>
                  <p className="text-sm font-medium text-slate-800">vikram@insora.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-md bg-slate-50 p-4">
                <Phone size={17} className="text-slate-500" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Phone Number</p>
                  <p className="text-sm font-medium text-slate-800">+91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                <BarChart3 size={16} />
              </div>
              <h2 className="text-base font-bold text-slate-950">Quarterly Performance</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md border border-slate-200 p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Success Rate</p>
                <div className="mt-8 flex items-end justify-between gap-3">
                  <strong className="text-2xl">99.4%</strong>
                  <span className="text-xs font-bold text-emerald-600">+ 2.1%</span>
                </div>
              </div>
              <div className="rounded-md border border-slate-200 p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total Volume</p>
                <div className="mt-8 flex items-end justify-between gap-3">
                  <strong className="text-2xl">1.2M</strong>
                  <span className="text-[10px] font-bold uppercase text-slate-500">Units</span>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full rounded-md border border-dashed border-slate-300 py-2 text-sm font-semibold text-slate-600">
              View Detailed Logistics Audit
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950">Recent Ledger Activity</h2>
            <button className="text-sm font-semibold text-slate-950">View All â†’</button>
          </div>

          <div className="overflow-hidden rounded-md border border-slate-100">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-white text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((transaction) => {
                  const completed = transaction.status === "SUCCESS" || transaction.status === "COMPLETED";
                  return (
                    <tr key={transaction.transaction_id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-4 font-mono text-xs font-semibold text-slate-500">
                        #{transaction.transaction_id}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-800">{transaction.description}</td>
                      <td className="px-4 py-4 text-slate-700">
                        {new Date(transaction.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                          completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          <CheckCircle size={11} />
                          {completed ? "Completed" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-slate-950">
                        {transaction.amount === null || transaction.amount === undefined
                          ? "--"
                          : `â‚¹${Number(transaction.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
