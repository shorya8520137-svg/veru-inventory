"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Truck, MapPin, IndianRupee, TrendingUp, AlertTriangle,
  CheckCircle2, Package, Weight, Gauge, Fuel, CloudSun,
  BarChart3, Search, ArrowRightLeft, Calculator, RefreshCw,
} from "lucide-react";

const BRAND_PURPLE = "#5850EC";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.giftgala.in";

function authHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function LogisticsPage() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [weather, setWeather] = useState("clear");
  const [traffic, setTraffic] = useState("low");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleEstimate(e) {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) {
      setError("Source and destination are required");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const body = {
        sourceWarehouse: source.trim(),
        destWarehouse: destination.trim(),
        productName: productName.trim() || null,
        quantity: parseInt(quantity) || 1,
        weather,
        traffic,
      };
      const response = await fetch(`${API_BASE}/api/inventorygpt/logistics-estimate`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (data.success) setResult(data);
      else setError(data.error || "Failed to calculate estimate");
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  const cb = result?.costBreakdown || {};
  const ta = result?.transferAnalysis || {};

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Logistics Cost Estimator</h1>
              <p className="text-sm text-slate-500">
                Estimate warehouse-to-warehouse transfer costs and get transfer recommendations.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Input Form */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-800">
                <Calculator className="h-4 w-4" style={{ color: BRAND_PURPLE }} />
                Transfer Details
              </h2>
              <form onSubmit={handleEstimate} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Source Warehouse
                  </label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. Mumbai Bhiwandi"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Destination Warehouse
                  </label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Delhi TLiknagar"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Product (optional)
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Dove Shampoo 200ml"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Weather
                    </label>
                    <select
                      value={weather}
                      onChange={(e) => setWeather(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    >
                      <option value="clear">Clear</option>
                      <option value="rain">Rain</option>
                      <option value="heavy_rain">Heavy Rain</option>
                      <option value="storm">Storm</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Traffic
                  </label>
                  <select
                    value={traffic}
                    onChange={(e) => setTraffic(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: BRAND_PURPLE }}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Calculator className="h-4 w-4" />
                  )}
                  {loading ? "Calculating..." : "Calculate Estimate"}
                </button>
              </form>
              {error && (
                <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
              )}
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            {!result ? (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <Truck className="mb-4 h-12 w-12 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-700">Ready to Estimate</h3>
                <p className="mt-2 max-w-md text-sm text-slate-500">
                  Fill in the source and destination warehouse details to get a cost estimate and transfer recommendation.
                </p>
                <p className="mt-4 text-xs text-slate-400">
                  Powered by Insora Logistics Engine &bull; Connect and operate your business from insora.in
                </p>
                <div className="mt-6 flex items-center gap-3 text-xs text-slate-400">
                  <span>ShipRocket Integration</span>
                  <span className="text-slate-300">|</span>
                  <span>Flipkart</span>
                  <span className="text-slate-300">|</span>
                  <span>Amazon</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Route Header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{result.source}</p>
                        <p className="text-xs text-slate-500">Source</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <ArrowRightLeft className="h-5 w-5 text-slate-400" />
                        <span className="mt-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          ~{result.distanceKm || 100} km
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{result.destination}</p>
                        <p className="text-xs text-slate-500">Destination</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        ₹{(cb.total || 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-500">Estimated Total</p>
                    </div>
                  </div>
                </div>

                {/* Product & Vehicle Info */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {result.product?.name && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <p className="text-xs text-slate-500">Product</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{result.product.name}</p>
                    </div>
                  )}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Weight</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{result.totalWeightKg || 0} kg</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Chargeable</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{result.chargeableWeightKg || 0} kg</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Vehicle</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{result.vehicleLabel || result.vehicleSuggested || "—"}</p>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <IndianRupee className="h-4 w-4" style={{ color: BRAND_PURPLE }} />
                    Cost Breakdown
                  </h3>
                  <div className="space-y-2">
                    <CostRow label="Base Fare" value={cb.baseFare} />
                    <CostRow label={`Distance (${result.distanceKm || 100} km × ₹${result.vehicleSuggested ? { bike: 8, three_wheeler: 12, pickup: 18, mini_truck: 25, truck: 35 }[result.vehicleSuggested] || 18 : 18}/km)`} value={cb.distanceCost} />
                    <CostRow label={`Weight (${result.chargeableWeightKg || 0} kg)`} value={cb.weightCost} />
                    <CostRow label="Vehicle Cost" value={cb.vehicleCost} />
                    {cb.fuelAdjustment > 0 && <CostRow label="Fuel Adjustment" value={cb.fuelAdjustment} />}
                    {(cb.weatherMultiplier !== 1 || cb.trafficMultiplier !== 1) && (
                      <CostRow label={`Weather × Traffic (${cb.weatherMultiplier || 1} × ${cb.trafficMultiplier || 1})`} value={0} dim />
                    )}
                    <div className="border-t border-slate-200 pt-2" />
                    <CostRow label="Subtotal" value={cb.subtotal} indent />
                    <CostRow label="GST (5%)" value={cb.gst} indent />
                    <div className="border-t-2 border-slate-300 pt-2">
                      <CostRow label="Total" value={cb.total} bold />
                    </div>
                  </div>
                </div>

                {/* Transfer Analysis */}
                {ta && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <TrendingUp className="h-4 w-4" style={{ color: BRAND_PURPLE }} />
                      Transfer Analysis
                    </h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-500">Pending Orders</p>
                        <p className="text-xl font-bold text-slate-900">{ta.pendingOrders || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Avg Price</p>
                        <p className="text-xl font-bold text-slate-900">₹{(ta.avgSellingPrice || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Revenue Saved</p>
                        <p className="text-xl font-bold text-emerald-600">₹{(ta.revenueSaved || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Net Benefit</p>
                        <p className={`text-xl font-bold ${(ta.netBenefit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          ₹{(ta.netBenefit || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-600">Transfer Score:</span>
                        <span className="text-lg font-bold text-slate-900">{ta.transferScore || 0}</span>
                      </div>
                      <TransferBadge recommendation={ta.recommendation} />
                    </div>
                  </div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-slate-400">
                  Powered by Insora Logistics Engine &bull; Connect and operate your business from insora.in
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CostRow({ label, value, indent, bold, dim }) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? "font-bold text-slate-900" : dim ? "text-slate-400" : indent ? "pl-4 text-slate-600" : "text-slate-600"}`}>
      <span>{label}</span>
      <span className="font-mono">
        {value === 0 && dim ? "—" : `₹${(value || 0).toLocaleString("en-IN")}`}
      </span>
    </div>
  );
}

function TransferBadge({ recommendation }) {
  if (recommendation === "transfer") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        RECOMMENDED
      </span>
    );
  }
  if (recommendation === "consider") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        <TrendingUp className="h-3.5 w-3.5" />
        CONSIDER
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
      <AlertTriangle className="h-3.5 w-3.5" />
      NOT RECOMMENDED
    </span>
  );
}
