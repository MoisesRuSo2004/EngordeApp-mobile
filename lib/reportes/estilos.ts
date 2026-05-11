export const CSS_BASE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    color: #1e293b;
    background: #ffffff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── Encabezado ─────────────────────────────────────────── */
  .header {
    background: linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%);
    padding: 28px 32px 24px;
    position: relative;
    overflow: hidden;
  }
  .header::after {
    content: '';
    position: absolute;
    top: -40px; right: -40px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .header::before {
    content: '';
    position: absolute;
    bottom: -60px; right: 60px;
    width: 120px; height: 120px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
  .header-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    position: relative;
    z-index: 1;
  }
  .header-left {}
  .header-eyebrow {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.6);
    margin-bottom: 6px;
  }
  .header-title {
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.5px;
    line-height: 1.15;
  }
  .header-sub {
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .header-sub span { display: inline-flex; align-items: center; gap: 4px; }
  .header-right { text-align: right; }
  .header-logo {
    font-size: 15px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -0.3px;
  }
  .header-logo-dot { color: #4ade80; }
  .header-tag {
    font-size: 10px;
    color: rgba(255,255,255,0.55);
    margin-top: 4px;
    font-weight: 500;
  }
  .header-date {
    font-size: 10px;
    color: rgba(255,255,255,0.5);
    margin-top: 2px;
  }

  /* ── Cuerpo ─────────────────────────────────────────────── */
  .body { padding: 28px 32px; }

  /* ── KPIs ───────────────────────────────────────────────── */
  .kpis {
    display: flex;
    gap: 12px;
    margin-bottom: 28px;
  }
  .kpi {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 14px 16px;
    position: relative;
    overflow: hidden;
  }
  .kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    background: #15803d;
    border-radius: 10px 0 0 10px;
  }
  .kpi.verde::before  { background: #16a34a; }
  .kpi.rojo::before   { background: #dc2626; }
  .kpi.azul::before   { background: #2563eb; }
  .kpi.morado::before { background: #7c3aed; }
  .kpi.naranja::before { background: #ea580c; }

  .kpi-label {
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: #94a3b8;
    margin-bottom: 5px;
  }
  .kpi-value {
    font-size: 19px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    line-height: 1;
  }
  .kpi-value.verde   { color: #16a34a; }
  .kpi-value.rojo    { color: #dc2626; }
  .kpi-value.primario { color: #15803d; }
  .kpi-sub {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 3px;
    font-weight: 500;
  }

  /* ── Sección ─────────────────────────────────────────────── */
  .section { margin-bottom: 28px; }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #64748b;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .section-title::before {
    content: '';
    display: inline-block;
    width: 3px; height: 12px;
    background: #15803d;
    border-radius: 2px;
  }

  /* ── Tabla ───────────────────────────────────────────────── */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 10.5px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }
  thead tr th {
    background: #0f172a;
    color: #ffffff;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    font-size: 9.5px;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    white-space: nowrap;
  }
  thead tr th:first-child { border-radius: 0; }
  tbody tr { transition: background 0.1s; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:last-child td { border-bottom: none; }
  tbody td {
    padding: 9px 12px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }
  .td-right { text-align: right; font-variant-numeric: tabular-nums; }
  .td-center { text-align: center; }
  .td-bold { font-weight: 700; }
  .td-muted { color: #94a3b8; font-size: 10px; }

  /* Fila de total al pie de tabla */
  .tr-total td {
    background: #0f172a;
    color: #ffffff;
    font-weight: 700;
    border-bottom: none;
    font-size: 11px;
  }

  /* ── Badges ──────────────────────────────────────────────── */
  .badge {
    display: inline-flex;
    align-items: center;
    border-radius: 20px;
    padding: 3px 9px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }
  .badge-verde   { background: #dcfce7; color: #15803d; }
  .badge-rojo    { background: #fee2e2; color: #b91c1c; }
  .badge-amarillo { background: #fef9c3; color: #92400e; }
  .badge-azul    { background: #dbeafe; color: #1d4ed8; }
  .badge-gris    { background: #f1f5f9; color: #475569; }

  /* ── Pie de página ───────────────────────────────────────── */
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-left {
    font-size: 9px;
    color: #94a3b8;
    font-weight: 500;
    line-height: 1.6;
  }
  .footer-right {
    font-size: 11px;
    font-weight: 800;
    color: #15803d;
    letter-spacing: -0.2px;
  }
  .footer-right span { color: #4ade80; }

  /* ── Resaltado de utilidad inline ────────────────────────── */
  .positivo { color: #16a34a; font-weight: 700; }
  .negativo { color: #dc2626; font-weight: 700; }
  .neutro   { color: #64748b; }
`;
