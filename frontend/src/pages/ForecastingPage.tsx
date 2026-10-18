import React, { useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { ForecastResponse, ForecastItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface ForecastingPageProps {
  forecastData: ForecastResponse | null;
  onRecalculate: () => Promise<void>;
  onAdjustParameters: (safetyDays: number) => void;
  isLoading: boolean;
}

export const ForecastingPage: React.FC<ForecastingPageProps> = ({
  forecastData,
  onRecalculate,
  onAdjustParameters,
  isLoading
}) => {
  const [safetyDays, setSafetyDays] = useState<number>(3.0);
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<ForecastItem | null>(null);

  if (!forecastData) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mb-3" />
        <p className="font-semibold text-sm">Evaluating time-series consumption heuristics...</p>
      </div>
    );
  }

  const items = forecastData.items.filter((item) => {
    if (riskFilter === 'All') return true;
    return item.risk_level === riskFilter;
  });

  const handleSafetyChange = (days: number) => {
    setSafetyDays(days);
    onAdjustParameters(days);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Medicine Demand Forecasting
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Explainable Time-Series
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Proactively project 7-day & 30-day consumption to prevent stockouts before patient care is impacted.
          </p>
        </div>

        <button
          onClick={onRecalculate}
          disabled={isLoading}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Recalculate Forecast</span>
        </button>
      </div>

      {/* Control Sliders & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Formulations Evaluated</span>
          <div className="text-3xl font-black text-slate-900 mt-2">{forecastData.total_forecasted}</div>
          <p className="text-xs text-slate-500 mt-1">Based on multi-week facility dispensing</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-rose-200 shadow-2xs bg-rose-50/20">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Critical Stockout Risk</span>
          <div className="text-3xl font-black text-rose-600 mt-2">{forecastData.critical_risk_count}</div>
          <p className="text-xs text-rose-700 mt-1">Stockout within lead-time window</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">High / Medium Watch</span>
          <div className="text-3xl font-black text-amber-700 mt-2">
            {forecastData.high_risk_count + forecastData.medium_risk_count}
          </div>
          <p className="text-xs text-amber-700 mt-1">Below safety replenishment buffer</p>
        </div>

        {/* Safety buffer adjuster */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              <span>Safety Buffer</span>
            </span>
            <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
              {safetyDays} Days
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="14"
            step="0.5"
            value={safetyDays}
            onChange={(e) => handleSafetyChange(Number(e.target.value))}
            className="w-full accent-teal-600 cursor-pointer mt-2"
          />
          <span className="text-[10px] text-slate-400 mt-1">Slide to adjust buffer days</span>
        </div>
      </div>

      {/* Transparent Model Explanation Accordion */}
      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-900 leading-relaxed">
          <strong>Explainable Forecasting Methodology:</strong> The baseline model utilizes a 3-week Weighted Moving Average (WMA) where recent 7 days receive 50% weighting, prior week 30%, and week 3 receives 20%. Stockout horizon is determined as <code>current_stock / daily_rate</code>. Suggested replenishment is dynamically calculated as <code>max(0, (lead_time + planning_horizon) × daily_rate + safety_buffer - effective_stock)</code>.
          <span className="block mt-1 font-bold text-teal-950">
            Note: Illustrative decision-support estimate on synthetic demonstration data. Not autonomous clinical advice.
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs">
        {['All', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
          <button
            key={lvl}
            onClick={() => setRiskFilter(lvl)}
            className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
              riskFilter === lvl
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {lvl === 'All' ? 'All Risk Levels' : `${lvl} Risk`}
          </button>
        ))}
      </div>

      {/* Forecast Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Medicine & Formulation</th>
                <th className="py-3 px-4">Current Stock</th>
                <th className="py-3 px-4">Daily Rate</th>
                <th className="py-3 px-4">Stockout In</th>
                <th className="py-3 px-4">7-Day Demand</th>
                <th className="py-3 px-4">Suggested Reorder</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Proactive Rationale & Recommended Next Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr
                  key={item.medicine_id}
                  onClick={() => setSelectedItem(item)}
                  className={`hover:bg-slate-50/80 transition cursor-pointer ${
                    item.risk_level === 'CRITICAL' ? 'bg-rose-50/15' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{item.medicine_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.generic_name} · <span className="text-teal-700">{item.category}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-extrabold text-slate-900">
                    {item.current_stock.toLocaleString()} {item.unit}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    ~{item.avg_daily_consumption} / day
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`font-black ${
                        item.days_until_stockout <= item.lead_time_days
                          ? 'text-rose-600'
                          : item.days_until_stockout <= item.lead_time_days * 1.5
                          ? 'text-amber-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {item.days_until_stockout < 900 ? `~${item.days_until_stockout} days` : 'Secure'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    ~{item.forecast_7_day_demand} {item.unit}
                  </td>

                  <td className="py-3.5 px-4">
                    {item.suggested_reorder_qty > 0 ? (
                      <span className="font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {item.suggested_reorder_qty} {item.unit}
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        0 (Adequate)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge status={item.risk_level} size="sm" />
                  </td>

                  <td className="py-3.5 px-4 max-w-md">
                    <div className="text-slate-900 font-semibold leading-tight">{item.risk_reason}</div>
                    <div className="text-[11px] text-teal-800 font-medium mt-1">
                      👉 {item.recommended_action}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
