"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Truck,
  MapPin,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Weight,
  Gauge,
  Fuel,
  CloudSun,
  BarChart3,
} from "lucide-react";

const BRAND_PURPLE = "#5850EC";

const VEHICLE_LABELS = {
  bike: "Bike",
  three_wheeler: "3 Wheeler",
  pickup: "Pickup / Tata Ace",
  mini_truck: "Mini Truck (Tata 407)",
  truck: "Truck (10+ wheeler)",
};

const WEATHER_LABELS = { clear: "Clear", rain: "Rain", heavy_rain: "Heavy Rain", storm: "Storm" };
const TRAFFIC_LABELS = { low: "Low", medium: "Medium", high: "High", extreme: "Extreme" };

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: accent || `${BRAND_PURPLE}15`, color: accent || BRAND_PURPLE }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate text-base font-bold text-slate-900">
          {typeof value === "number" ? value.toLocaleString("en-IN") : value || "—"}
        </p>
      </div>
    </div>
  );
}

function CostRow({ label, value, isTotal, indent }) {
  return (
    <div
      className={`flex items-center justify-between py-1.5 text-sm ${isTotal ? "border-t-2 border-slate-200 pt-3" : ""} ${indent ? "pl-4" : ""}`}
    >
      <span className={isTotal ? "font-bold text-slate-900" : "text-slate-600"}>{label}</span>
      <span className={`font-mono ${isTotal ? "text-base font-bold text-slate-900" : "text-slate-700"}`}>
        ₹{typeof value === "number" ? value.toLocaleString("en-IN") : value || 0}
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

export default function LogisticsEstimateCard({ data, onVisualize }) {
  const [showCostBreakdown, setShowCostBreakdown] = useState(true);
  const [showTransferAnalysis, setShowTransferAnalysis] = useState(true);

  if (!data) return null;

  const {
    source,
    destination,
    distanceKm,
    product,
    quantity,
    totalWeightKg,
    chargeableWeightKg,
    vehicleSuggested,
    vehicleLabel,
    costBreakdown = {},
    transferAnalysis = {},
    confidence,
  } = data;

  const sourceName = source || "Source";
  const destName = destination || "Destination";

  const costRows = useMemo(() => [
    { label: "Base Fare", value: costBreakdown.baseFare },
    { label: `Distance (${distanceKm || "~100"} km)`, value: costBreakdown.distanceCost },
    { label: `Weight (${chargeableWeightKg || 0} kg)`, value: costBreakdown.weightCost },
    { label: "Vehicle Cost", value: costBreakdown.vehicleCost },
    ...(costBreakdown.fuelAdjustment > 0 ? [{ label: "Fuel Adjustment", value: costBreakdown.fuelAdjustment }] : []),
    ...(costBreakdown.weatherMultiplier !== 1 || costBreakdown.trafficMultiplier !== 1
      ? [{ label: `Weather × Traffic (${costBreakdown.weatherMultiplier || 1} × ${costBreakdown.trafficMultiplier || 1})`, value: 0 }]
      : []),
    { label: "Subtotal", value: costBreakdown.subtotal, indent: true },
    { label: "GST (5%)", value: costBreakdown.gst, indent: true },
  ], [costBreakdown, distanceKm, chargeableWeightKg]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <Truck className="h-3.5 w-3.5" style={{ color: BRAND_PURPLE }} />
            Logistics Cost Estimate
          </p>
          <h3 className="mt-1.5 flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900">
            <span>{sourceName}</span>
            <span className="text-slate-300">→</span>
            <span>{destName}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              ~{distanceKm || 100} km
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">
            {typeof confidence === 'object' ? `${confidence.score || 0}%` : confidence} confidence
          </span>
          {onVisualize && vehicleSuggested && (
            <button
              type="button"
              onClick={() => onVisualize?.(
                [
                  { label: "Base Fare", value: costBreakdown.baseFare || 0 },
                  { label: "Distance Cost", value: costBreakdown.distanceCost || 0 },
                  { label: "Weight Cost", value: costBreakdown.weightCost || 0 },
                  { label: "Vehicle Cost", value: costBreakdown.vehicleCost || 0 },
                  ...(costBreakdown.fuelAdjustment > 0 ? [{ label: "Fuel Adj", value: costBreakdown.fuelAdjustment }] : []),
                  { label: "GST", value: costBreakdown.gst || 0 },
                ],
                ["label", "value"],
                "Cost Breakdown"
              )}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <BarChart3 className="h-3.5 w-3.5" style={{ color: BRAND_PURPLE }} />
              Graph
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {product?.name && (
            <StatCard icon={Package} label="Product" value={product.name} accent="#2563EB" />
          )}
          <StatCard icon={Weight} label="Weight" value={`${totalWeightKg || 0} kg`} accent="#14B8A6" />
          <StatCard icon={Gauge} label="Vehicle" value={vehicleLabel || vehicleSuggested || "—"} accent={BRAND_PURPLE} />
          <StatCard icon={IndianRupee} label="Est. Cost" value={`₹${(costBreakdown.total || 0).toLocaleString("en-IN")}`} accent="#F59E0B" />
        </div>

        {/* Cost Breakdown */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <button
            type="button"
            onClick={() => setShowCostBreakdown(!showCostBreakdown)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <IndianRupee className="h-4 w-4" style={{ color: BRAND_PURPLE }} />
              Cost Breakdown
            </span>
            <span className="text-xs text-slate-400">{showCostBreakdown ? "Hide" : "Show"}</span>
          </button>
          {showCostBreakdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-3 space-y-0.5"
            >
              {costRows.map((row) => (
                row.value === 0 && row.label.includes("Weather") ? null : (
                  <CostRow key={row.label} label={row.label} value={row.value} indent={row.indent} />
                )
              ))}
              <CostRow label="Total" value={costBreakdown.total} isTotal />
            </motion.div>
          )}
        </div>

        {/* Transfer Analysis */}
        {transferAnalysis && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <button
              type="button"
              onClick={() => setShowTransferAnalysis(!showTransferAnalysis)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <TrendingUp className="h-4 w-4" style={{ color: BRAND_PURPLE }} />
                Transfer Analysis
              </span>
              <span className="text-xs text-slate-400">{showTransferAnalysis ? "Hide" : "Show"}</span>
            </button>
            {showTransferAnalysis && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-3 space-y-3"
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">Pending Orders</p>
                    <p className="text-lg font-bold text-slate-900">{transferAnalysis.pendingOrders || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Avg Price</p>
                    <p className="text-lg font-bold text-slate-900">
                      ₹{(transferAnalysis.avgSellingPrice || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Revenue Saved</p>
                    <p className="text-lg font-bold text-emerald-600">
                      ₹{(transferAnalysis.revenueSaved || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Net Benefit</p>
                    <p className={`text-lg font-bold ${(transferAnalysis.netBenefit || 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      ₹{(transferAnalysis.netBenefit || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">Transfer Score:</span>
                    <span className="text-lg font-bold text-slate-900">{transferAnalysis.transferScore || 0}</span>
                  </div>
                  <TransferBadge recommendation={transferAnalysis.recommendation} />
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Environmental factors */}
        {(costBreakdown.weatherMultiplier !== 1 || costBreakdown.trafficMultiplier !== 1) && (
          <div className="flex flex-wrap gap-4 rounded-lg border border-slate-100 bg-white px-4 py-3 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <CloudSun className="h-3.5 w-3.5 text-amber-500" />
              Weather: {WEATHER_LABELS[Object.keys(WEATHER_LABELS).find(k => costBreakdown.weatherMultiplier === { clear: 1.0, rain: 1.15, heavy_rain: 1.3, storm: 1.5 }[k])] || "Clear"} × {costBreakdown.weatherMultiplier}
            </span>
            <span className="flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 text-orange-500" />
              Traffic: {TRAFFIC_LABELS[Object.keys(TRAFFIC_LABELS).find(k => costBreakdown.trafficMultiplier === { low: 1.0, medium: 1.1, high: 1.25, extreme: 1.5 }[k])] || "Low"} × {costBreakdown.trafficMultiplier}
            </span>
            {costBreakdown.fuelAdjustment > 0 && (
              <span className="flex items-center gap-1.5">
                <Fuel className="h-3.5 w-3.5 text-blue-500" />
                Fuel Adj: ₹{costBreakdown.fuelAdjustment.toLocaleString("en-IN")}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
