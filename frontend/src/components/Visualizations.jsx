import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { BarChart3, LineChart, PieChart, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Visualizations({ metadata, fullData }) {
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [aggType, setAggType] = useState('sum'); // 'sum', 'mean', 'none'
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [recsError, setRecsError] = useState(null);

  // Auto-fetch visualization suggestions from Gemini on mount
  useEffect(() => {
    if (metadata) {
      fetchRecommendations();
      // Set defaults for manual chart selector
      const textCols = metadata.columns.filter(c => c.type === 'text');
      const numCols = metadata.columns.filter(c => c.type === 'numeric');
      
      if (textCols.length > 0) setXAxis(textCols[0].name);
      else if (metadata.columns.length > 0) setXAxis(metadata.columns[0].name);
      
      if (numCols.length > 0) setYAxis(numCols[0].name);
      else if (metadata.columns.length > 1) setYAxis(metadata.columns[1].name);
    }
  }, [metadata]);

  const fetchRecommendations = async () => {
    setLoadingRecs(true);
    setRecsError(null);
    try {
      const response = await fetch('http://localhost:5000/api/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to fetch recommendations.');
      setRecommendations(result.recommendations || []);
    } catch (err) {
      console.error(err);
      setRecsError(err.message || 'Offline Mode fallback in place.');
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleApplyRec = (rec) => {
    setChartType(rec.type);
    setXAxis(rec.xAxisColumn);
    setYAxis(rec.yAxisColumn);
    setAggType(rec.type === 'scatter' ? 'none' : 'sum');
  };

  // Aggregate data for standard charts (Bar, Line, Pie)
  const getChartData = () => {
    if (!xAxis || !yAxis || !fullData || fullData.length === 0) return null;

    if (chartType === 'scatter') {
      const points = fullData
        .map(row => ({
          x: Number(row[xAxis]),
          y: Number(row[yAxis])
        }))
        .filter(pt => !isNaN(pt.x) && !isNaN(pt.y));

      return {
        datasets: [{
          label: `${yAxis} vs ${xAxis}`,
          data: points,
          backgroundColor: 'rgba(92, 95, 255, 0.7)',
          borderColor: '#5c5fff',
          pointRadius: 6,
        }]
      };
    }

    // Categorical grouping and aggregation
    const groups = {};
    fullData.forEach(row => {
      const rawX = row[xAxis];
      const xVal = rawX === null || rawX === undefined ? 'Null' : String(rawX).trim();
      const yVal = Number(row[yAxis]);

      if (!groups[xVal]) {
        groups[xVal] = [];
      }
      if (!isNaN(yVal)) {
        groups[xVal].push(yVal);
      }
    });

    const labels = Object.keys(groups);
    let values = labels.map(label => {
      const arr = groups[label];
      if (arr.length === 0) return 0;
      if (aggType === 'mean') {
        const sum = arr.reduce((a, b) => a + b, 0);
        return parseFloat((sum / arr.length).toFixed(2));
      } else if (aggType === 'sum') {
        return parseFloat(arr.reduce((a, b) => a + b, 0).toFixed(2));
      } else {
        // Return raw first item
        return arr[0];
      }
    });

    // Limit to top 20 items to avoid canvas layout collapse
    if (labels.length > 20) {
      // Sort to show top values
      const zipped = labels.map((l, i) => ({ label: l, val: values[i] }));
      zipped.sort((a, b) => b.val - a.val);
      
      const topZipped = zipped.slice(0, 20);
      const otherZipped = zipped.slice(20);
      
      const finalLabels = topZipped.map(z => z.label);
      const finalValues = topZipped.map(z => z.val);
      
      if (otherZipped.length > 0) {
        finalLabels.push('Other (Combined)');
        const otherSum = otherZipped.reduce((acc, z) => acc + z.val, 0);
        finalValues.push(parseFloat(otherSum.toFixed(2)));
      }
      
      return createChartJSStructure(finalLabels, finalValues);
    }

    return createChartJSStructure(labels, values);
  };

  const createChartJSStructure = (labels, values) => {
    const isPie = chartType === 'pie';
    const bgColors = isPie 
      ? [
          'rgba(92, 95, 255, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(14, 165, 233, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(100, 116, 139, 0.7)',
        ]
      : 'rgba(92, 95, 255, 0.2)';

    const borderColors = isPie 
      ? [
          '#5c5fff',
          '#10b981',
          '#0ea5e9',
          '#f59e0b',
          '#ef4444',
          '#a855f7',
          '#ec4899',
          '#64748b',
        ]
      : '#5c5fff';

    return {
      labels,
      datasets: [
        {
          label: `${aggType === 'sum' ? 'Total' : aggType === 'mean' ? 'Average' : 'Value'} of ${yAxis}`,
          data: values,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: chartType === 'bar' ? 6 : 0,
          fill: chartType === 'line' ? true : false,
          tension: 0.3,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { family: 'Inter', size: 13, weight: 'bold' },
        bodyFont: { family: 'Inter', size: 12 },
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
      }
    },
    scales: chartType !== 'pie' ? {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      }
    } : {}
  };

  const renderActiveChart = () => {
    const chartData = getChartData();
    if (!chartData) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-slate-500">
          <AlertTriangle className="w-10 h-10 mb-2 text-slate-600" />
          <p>Please configure the Chart Settings correctly to render the visualization.</p>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return <Line data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'scatter':
        return <Scatter data={chartData} options={chartOptions} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Recommended Visualization Options */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h2 className="text-xl font-bold text-slate-100">AI Recommended Charts</h2>
          </div>
          <button 
            onClick={fetchRecommendations} 
            disabled={loadingRecs}
            className="p-1.5 bg-slate-950 border border-slate-900 rounded-lg hover:border-slate-800 text-slate-400 hover:text-slate-100 transition-all"
            title="Refresh recommendations"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRecs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingRecs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-950/40 border border-slate-900 rounded-xl h-24 p-4 space-y-2">
                <div className="h-4 bg-slate-900 rounded w-3/4"></div>
                <div className="h-3 bg-slate-900 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx} 
                onClick={() => handleApplyRec(rec)}
                className="bg-slate-950/40 hover:bg-brand-950/10 border border-slate-800/80 hover:border-brand-500/30 rounded-xl p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-slate-200 truncate pr-2">{rec.title}</span>
                    <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-950/40 border border-brand-900/40 px-1.5 py-0.5 rounded">
                      {rec.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{rec.description}</p>
                </div>
                <div className="border-t border-slate-900/60 mt-3 pt-2 text-[10px] text-slate-500 flex justify-between">
                  <span>X: {rec.xAxisColumn}</span>
                  <span>Y: {rec.yAxisColumn}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500 bg-slate-950/20 p-4 rounded-xl text-center border border-slate-900">
            No suggestions available. Try adding a valid Google Gemini API key to see smart chart recommendations.
          </div>
        )}
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Panel */}
        <div className="glass-panel p-6 rounded-2xl h-fit lg:col-span-1 space-y-6">
          <h3 className="font-bold text-slate-200 border-b border-slate-900 pb-3">Chart Settings</h3>

          {/* Chart Type */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Chart Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'bar', label: 'Bar', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                { type: 'line', label: 'Line', icon: <LineChart className="w-3.5 h-3.5" /> },
                { type: 'pie', label: 'Pie', icon: <PieChart className="w-3.5 h-3.5" /> },
                { type: 'scatter', label: 'Scatter', icon: <Sparkles className="w-3.5 h-3.5" /> },
              ].map(opt => (
                <button
                  key={opt.type}
                  onClick={() => {
                    setChartType(opt.type);
                    if (opt.type === 'scatter') setAggType('none');
                    else if (aggType === 'none') setAggType('sum');
                  }}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    chartType === opt.type
                      ? 'bg-brand-750 text-white border-brand-500 shadow-lg shadow-brand-500/10'
                      : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-800'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* X Axis Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">X-Axis (Labels / Features)</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="" disabled>Select Column</option>
              {metadata.columns.map((c, i) => (
                <option key={i} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          {/* Y Axis Selector */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Y-Axis (Numerical Values)</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="" disabled>Select Column</option>
              {metadata.columns.map((c, i) => (
                <option key={i} value={c.name}>{c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          {/* Aggregation Option (Hidden for scatter plot) */}
          {chartType !== 'scatter' && (
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Aggregation Method</label>
              <div className="flex gap-2">
                {[
                  { value: 'sum', label: 'Sum' },
                  { value: 'mean', label: 'Average' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAggType(opt.value)}
                    className={`flex-1 p-2 rounded-lg border text-xs font-semibold transition-all ${
                      aggType === opt.value
                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                        : 'bg-slate-950 border-slate-950 text-slate-500 hover:border-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart Canvas Card */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-3 flex flex-col justify-between h-[450px]">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
            <h3 className="font-bold text-slate-100">
              {xAxis && yAxis ? `${yAxis} analyzed by ${xAxis}` : 'Visualization Canvas'}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
              Chart.JS Sandbox
            </span>
          </div>

          <div className="flex-1 relative w-full h-[320px]">
            {renderActiveChart()}
          </div>
        </div>
      </div>
    </div>
  );
}
