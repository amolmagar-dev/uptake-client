export interface ComponentPreset {
  id: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
}

export const COMPONENT_PRESETS: ComponentPreset[] = [
  {
    id: "kpi-card",
    name: "KPI Metric Card",
    description: "Glassmorphism stat card with metric value, label & trend pill",
    html: `<div class="kpi-card">
  <div class="kpi-header">
    <span class="kpi-label" id="kpiLabel">Total Revenue</span>
    <span class="kpi-badge" id="kpiBadge">Live Data</span>
  </div>
  <div class="kpi-value" id="kpiValue">$0.00</div>
  <div class="kpi-footer">
    <span class="kpi-trend positive" id="kpiTrend">↑ 12.5% vs last month</span>
    <span class="kpi-subtext" id="kpiSubtext">0 records processed</span>
  </div>
</div>`,
    css: `.kpi-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 24px;
  color: #ffffff;
  font-family: 'Outfit', system-ui, -apple-system, sans-serif;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 245, 212, 0.4);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.kpi-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.65);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-badge {
  background: rgba(0, 245, 212, 0.15);
  color: #00f5d4;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 20px;
  border: 1px solid rgba(0, 245, 212, 0.3);
}

.kpi-value {
  font-size: 42px;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 4px 0 16px 0;
  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.kpi-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
}

.kpi-trend {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
}

.kpi-trend.positive {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.kpi-subtext {
  color: rgba(255, 255, 255, 0.45);
}`,
    js: `// Access dataset rows via window.componentData
const data = window.componentData;

if (data && Array.isArray(data) && data.length > 0) {
  // Aggregate numerical value from data if available
  const total = data.reduce((acc, row) => {
    const val = Number(row.amount || row.value || row.price || row.total || row.sales || 100);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  document.getElementById('kpiValue').textContent = '$' + total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  document.getElementById('kpiLabel').textContent = 'Dataset Metric Total';
  document.getElementById('kpiSubtext').textContent = data.length + ' rows processed';
} else {
  // Demo static value
  document.getElementById('kpiValue').textContent = '$128,450.00';
  document.getElementById('kpiSubtext').textContent = 'Demo static view';
}
console.log('[KPI Card] Initialized with', data ? data.length : 0, 'rows');`,
  },
  {
    id: "data-table",
    name: "Data Table Widget",
    description: "Filterable HTML table consuming dataset rows",
    html: `<div class="table-widget">
  <div class="table-header">
    <h3 class="table-title">Data Explorer</h3>
    <input type="text" id="searchInput" placeholder="Search dataset records..." class="table-search" />
  </div>
  <div class="table-scroll">
    <table id="dataTable">
      <thead>
        <tr id="tableHead"></tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>
  <div class="table-footer" id="tableFooter">Showing 0 rows</div>
</div>`,
    css: `.table-widget {
  background: #12131c;
  border: 1px solid #242636;
  border-radius: 12px;
  padding: 16px;
  color: #e0e0e0;
  font-family: 'Outfit', system-ui, sans-serif;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  gap: 12px;
}

.table-title {
  font-size: 16px;
  font-weight: 700;
  color: #00f5d4;
  margin: 0;
}

.table-search {
  flex: 1;
  max-width: 260px;
  padding: 8px 12px;
  background: #1a1b26;
  border: 1px solid #2f3242;
  color: #ffffff;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease;
}

.table-search:focus {
  border-color: #00f5d4;
}

.table-scroll {
  overflow-x: auto;
  max-height: 280px;
  border-radius: 8px;
  border: 1px solid #1f2130;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

th, td {
  padding: 10px 14px;
  border-bottom: 1px solid #1f2130;
}

th {
  background: #1a1b26;
  color: #a5b4fc;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
}

tr:hover td {
  background: rgba(255, 255, 255, 0.03);
}

.table-footer {
  margin-top: 12px;
  font-size: 12px;
  color: #7a829e;
  text-align: right;
}`,
    js: `const data = window.componentData || [
  { id: 1, name: 'Alpha Container', status: 'Active', category: 'Logistics', value: 1450 },
  { id: 2, name: 'Beta Vessel', status: 'Pending', category: 'Maritime', value: 2300 },
  { id: 3, name: 'Gamma Port', status: 'Active', category: 'Infrastructure', value: 890 },
  { id: 4, name: 'Delta Fleet', status: 'Maintenance', category: 'Logistics', value: 3100 }
];

function renderTable(rows) {
  if (!rows || !rows.length) {
    document.getElementById('tableHead').innerHTML = '<th>No Data</th>';
    document.getElementById('tableBody').innerHTML = '<tr><td style="text-align:center; padding:20px;">No matching records found</td></tr>';
    document.getElementById('tableFooter').textContent = 'Showing 0 rows';
    return;
  }

  const keys = Object.keys(rows[0]);
  document.getElementById('tableHead').innerHTML = keys.map(k => '<th>' + k + '</th>').join('');
  document.getElementById('tableBody').innerHTML = rows.map(r => 
    '<tr>' + keys.map(k => '<td>' + (r[k] !== null && r[k] !== undefined ? r[k] : '-') + '</td>').join('') + '</tr>'
  ).join('');

  document.getElementById('tableFooter').textContent = 'Showing ' + rows.length + ' rows';
}

renderTable(data);

document.getElementById('searchInput').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderTable(data);
    return;
  }
  const filtered = data.filter(row =>
    Object.values(row).some(val => String(val).toLowerCase().includes(query))
  );
  renderTable(filtered);
});

console.log('[Data Table] Rendered with', data.length, 'rows');`,
  },
  {
    id: "status-ring",
    name: "Status Progress Ring",
    description: "SVG circular progress widget with status color states",
    html: `<div class="ring-widget">
  <div class="ring-container">
    <svg class="ring-svg" viewBox="0 0 100 100">
      <circle class="ring-bg" cx="50" cy="50" r="40" />
      <circle class="ring-progress" id="ringCircle" cx="50" cy="50" r="40" />
    </svg>
    <div class="ring-content">
      <span class="ring-percent" id="ringPercent">0%</span>
      <span class="ring-status-badge" id="ringStatus">Loading</span>
    </div>
  </div>
  <div class="ring-meta">
    <h4 id="ringTitle">System Operational Score</h4>
    <p id="ringSub">Based on active records compliance</p>
  </div>
</div>`,
    css: `.ring-widget {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #ffffff;
  font-family: 'Outfit', system-ui, sans-serif;
  max-width: 320px;
  margin: 0 auto;
}

.ring-container {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}

.ring-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 8;
}

.ring-progress {
  fill: none;
  stroke: #00f5d4;
  stroke-width: 8;
  stroke-dasharray: 251.2;
  stroke-dashoffset: 251.2;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease;
}

.ring-content {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ring-percent {
  font-size: 26px;
  font-weight: 800;
}

.ring-status-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 2px;
  background: rgba(0, 245, 212, 0.2);
  color: #00f5d4;
}

.ring-meta {
  text-align: center;
}

.ring-meta h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #f1f5f9;
}

.ring-meta p {
  font-size: 12px;
  margin: 0;
  color: #64748b;
}`,
    js: `const data = window.componentData;
let percentage = 82;

if (data && Array.isArray(data) && data.length > 0) {
  // Compute percentage based on data conditions (e.g. status === 'Active' or value threshold)
  const activeCount = data.filter(d => {
    const s = String(d.status || d.state || 'active').toLowerCase();
    return s === 'active' || s === 'completed' || s === 'success' || Number(d.value || 0) > 50;
  }).length;
  percentage = Math.round((activeCount / data.length) * 100);
}

const circle = document.getElementById('ringCircle');
const percentEl = document.getElementById('ringPercent');
const statusEl = document.getElementById('ringStatus');

// Circumference = 2 * PI * r = 2 * 3.14159 * 40 ≈ 251.2
const offset = 251.2 - (251.2 * percentage) / 100;
circle.style.strokeDashoffset = offset;
percentEl.textContent = percentage + '%';

if (percentage >= 80) {
  circle.style.stroke = '#10b981';
  statusEl.textContent = 'Optimal';
  statusEl.style.color = '#10b981';
  statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
} else if (percentage >= 50) {
  circle.style.stroke = '#f59e0b';
  statusEl.textContent = 'Moderate';
  statusEl.style.color = '#f59e0b';
  statusEl.style.background = 'rgba(245, 158, 11, 0.15)';
} else {
  circle.style.stroke = '#ef4444';
  statusEl.textContent = 'Critical';
  statusEl.style.color = '#ef4444';
  statusEl.style.background = 'rgba(239, 68, 68, 0.15)';
}

console.log('[Status Ring] Calculated score:', percentage, '%');`,
  },
  {
    id: "bar-chart",
    name: "Custom Bar Chart",
    description: "Canvas / CSS bar visualization for dataset values",
    html: `<div class="chart-card">
  <div class="chart-header">
    <h3>Data Category Distribution</h3>
    <span class="chart-subtitle" id="chartSub">Dataset metrics overview</span>
  </div>
  <div class="chart-bars" id="barContainer"></div>
</div>`,
    css: `.chart-card {
  background: #13141f;
  border: 1px solid #282a3c;
  border-radius: 14px;
  padding: 20px;
  color: #ffffff;
  font-family: 'Outfit', system-ui, sans-serif;
}

.chart-header h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #00f5d4;
}

.chart-subtitle {
  font-size: 12px;
  color: #6b7280;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 180px;
  margin-top: 20px;
  padding-top: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #242636;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  position: relative;
}

.bar-pill {
  width: 100%;
  max-width: 36px;
  background: linear-gradient(180deg, #00f5d4 0%, #6366f1 100%);
  border-radius: 6px 6px 2px 2px;
  transition: height 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.bar-val {
  position: absolute;
  top: -20px;
  width: 100%;
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: #a5b4fc;
}

.bar-label {
  position: absolute;
  bottom: -22px;
  width: 100%;
  text-align: center;
  font-size: 11px;
  color: #8b9bb4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}`,
    js: `const data = window.componentData || [
  { label: 'Jan', value: 45 },
  { label: 'Feb', value: 72 },
  { label: 'Mar', value: 58 },
  { label: 'Apr', value: 90 },
  { label: 'May', value: 64 },
  { label: 'Jun', value: 83 }
];

const container = document.getElementById('barContainer');
const items = data.slice(0, 8); // Display top 8 items
const maxVal = Math.max(1, ...data.map(d => Number(d.val || d.value || d.amount || 0)));

container.innerHTML = items.map(item => {
  const rawVal = Number(item.value || item.amount || item.val || item.price || 0);
  const pct = Math.max(10, Math.round((rawVal / (maxVal || 1)) * 100));
  const label = String(item.label || item.name || item.category || item.month || 'Item');

  return '<div class="bar-wrapper">' +
    '<div class="bar-pill" style="height:' + pct + '%">' +
      '<span class="bar-val">' + rawVal + '</span>' +
    '</div>' +
    '<span class="bar-label">' + label + '</span>' +
  '</div>';
}).join('');

console.log('[Bar Chart] Rendered', items.length, 'bars');`,
  },
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Clean boilerplate template with helpful comments",
    html: `<div class="custom-component">
  <h2>Custom Component Studio</h2>
  <p>Start building your HTML, CSS, and JS visual component below.</p>
</div>`,
    css: `.custom-component {
  padding: 24px;
  background: var(--color-base-200, #1d232a);
  border: 1px solid var(--color-base-300, #2a323c);
  border-radius: 12px;
  color: var(--color-base-content, #ffffff);
  font-family: sans-serif;
}

.custom-component h2 {
  color: #00f5d4;
  margin-bottom: 8px;
}`,
    js: `// Access your selected dataset array via window.componentData
console.log("Component loaded. Data:", window.componentData);`,
  },
];
