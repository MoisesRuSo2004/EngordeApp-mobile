import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CSS_BASE } from './estilos';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cop(n: number): string {
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000)
    return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString('es-CO')}`;
}

function copFull(n: number): string {
  return `$${Math.abs(n).toLocaleString('es-CO')} COP`;
}

function fmtFecha(iso: string): string {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function fmtFechaCorta(iso: string): string {
  if (!iso) return '—';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function ahora(): string {
  return new Date().toLocaleString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function wrap(titulo: string, subtitulo: string, etiqueta: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>${CSS_BASE}</style>
</head>
<body>

  <!-- ENCABEZADO -->
  <div class="header">
    <div class="header-inner">
      <div class="header-left">
        <div class="header-eyebrow">EngordeApp · Reporte</div>
        <div class="header-title">${titulo}</div>
        <div class="header-sub">${subtitulo}</div>
      </div>
      <div class="header-right">
        <div class="header-logo">Engorde<span class="header-logo-dot">.</span>App</div>
        <div class="header-tag">${etiqueta}</div>
        <div class="header-date">Generado: ${ahora()}</div>
      </div>
    </div>
  </div>

  <!-- CUERPO -->
  <div class="body">
    ${cuerpo}
  </div>

  <!-- PIE DE PÁGINA -->
  <div style="padding: 0 32px 28px;">
    <div class="footer">
      <div class="footer-left">
        Documento generado automáticamente por EngordeApp.<br/>
        La información refleja los datos registrados a la fecha de generación.<br/>
        Para uso interno del productor ganadero.
      </div>
      <div class="footer-right">Engorde<span>.</span>App</div>
    </div>
  </div>

</body>
</html>`;
}

async function compartir(html: string, nombre: string) {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: nombre,
    UTI: 'com.adobe.pdf',
  });
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface AnimalResumen {
  arete?: string;
  raza?: string;
  pesoInicialKg: number;
  pesoActualKg: number;
  gdpKgDia: number;
  precioCompraCop: number;
  valorHoyCop: number;
  utilidadHoyCop: number;
}

export interface LoteResumenData {
  loteNombre: string;
  finca?: string;
  fechaCompra?: string;
  animales: AnimalResumen[];
  totalInvertidoCop: number;
  valorHoyTotalCop: number;
  utilidadTotalCop: number;
  gdpPromedio: number;
  precioKiloCop: number;
}

export interface GastoData {
  fecha: string;
  categoria: string;
  descripcion?: string;
  montoCop: number;
}

export interface GastosReporteData {
  loteNombre: string;
  gastos: GastoData[];
  totalCop: number;
  porCategoria: Record<string, number>;
}

export interface PesajeReporte {
  animalArete?: string;
  animalRaza?: string;
  fecha: string;
  pesoKg: number;
  nota?: string;
}

export interface PesajesReporteData {
  loteNombre: string;
  pesajes: PesajeReporte[];
}

// ─── 1. Resumen del Lote ──────────────────────────────────────────────────────

export async function exportarResumenLotePDF(data: LoteResumenData) {
  const util = data.utilidadTotalCop;
  const positivo = util >= 0;
  const margenPct = data.totalInvertidoCop > 0
    ? ((util / data.totalInvertidoCop) * 100).toFixed(1)
    : '0.0';

  const filas = data.animales.map((a, i) => {
    const u = a.utilidadHoyCop;
    const gdpClass = a.gdpKgDia >= 0.9 ? 'badge-verde' : a.gdpKgDia >= 0.6 ? 'badge-amarillo' : 'badge-rojo';
    const utilClass = u >= 0 ? 'positivo' : 'negativo';
    const ganancia = a.pesoActualKg - a.pesoInicialKg;
    return `
      <tr>
        <td class="td-center td-muted">${i + 1}</td>
        <td class="td-bold">${a.arete ? `#${a.arete}` : '—'}</td>
        <td>${a.raza ?? '<span class="td-muted">—</span>'}</td>
        <td class="td-right">${a.pesoInicialKg} kg</td>
        <td class="td-right td-bold">${a.pesoActualKg} kg</td>
        <td class="td-right ${ganancia >= 0 ? 'positivo' : 'negativo'}">${ganancia >= 0 ? '+' : ''}${ganancia.toFixed(1)} kg</td>
        <td class="td-center"><span class="badge ${gdpClass}">${a.gdpKgDia.toFixed(3)}</span></td>
        <td class="td-right">${cop(a.precioCompraCop)}</td>
        <td class="td-right td-bold">${cop(a.valorHoyCop)}</td>
        <td class="td-right"><span class="${utilClass}">${u >= 0 ? '+' : ''}${cop(u)}</span></td>
      </tr>`;
  }).join('');

  const totalGananciaKg = data.animales.reduce((s, a) => s + (a.pesoActualKg - a.pesoInicialKg), 0);

  const cuerpo = `
    <!-- KPIs -->
    <div class="kpis">
      <div class="kpi primario">
        <div class="kpi-label">Total invertido</div>
        <div class="kpi-value primario">${cop(data.totalInvertidoCop)}</div>
        <div class="kpi-sub">${copFull(data.totalInvertidoCop)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Valor hoy en mercado</div>
        <div class="kpi-value">${cop(data.valorHoyTotalCop)}</div>
        <div class="kpi-sub">${data.precioKiloCop.toLocaleString('es-CO')} COP/kg</div>
      </div>
      <div class="kpi ${positivo ? 'verde' : 'rojo'}">
        <div class="kpi-label">Utilidad estimada</div>
        <div class="kpi-value ${positivo ? 'verde' : 'rojo'}">${positivo ? '+' : ''}${cop(util)}</div>
        <div class="kpi-sub">Margen: ${positivo ? '+' : ''}${margenPct}%</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">GDP promedio</div>
        <div class="kpi-value">${data.gdpPromedio.toFixed(3)}</div>
        <div class="kpi-sub">kg / día por animal</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Animales</div>
        <div class="kpi-value">${data.animales.length}</div>
        <div class="kpi-sub">+${totalGananciaKg.toFixed(0)} kg ganados</div>
      </div>
    </div>

    <!-- Tabla de animales -->
    <div class="section">
      <div class="section-title">Detalle por animal</div>
      <table>
        <thead>
          <tr>
            <th class="td-center">#</th>
            <th>Arete</th>
            <th>Raza</th>
            <th class="td-right">Peso inicial</th>
            <th class="td-right">Peso actual</th>
            <th class="td-right">Ganancia</th>
            <th class="td-center">GDP kg/d</th>
            <th class="td-right">Compra</th>
            <th class="td-right">Valor hoy</th>
            <th class="td-right">Utilidad</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
          <tr class="tr-total">
            <td colspan="3">TOTALES</td>
            <td class="td-right">—</td>
            <td class="td-right">—</td>
            <td class="td-right">+${totalGananciaKg.toFixed(0)} kg</td>
            <td class="td-center">${data.gdpPromedio.toFixed(3)}</td>
            <td class="td-right">${cop(data.totalInvertidoCop)}</td>
            <td class="td-right">${cop(data.valorHoyTotalCop)}</td>
            <td class="td-right">${positivo ? '+' : ''}${cop(util)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  const subtitulo = [
    data.finca ? `<span>📍 ${data.finca}</span>` : '',
    data.fechaCompra ? `<span>📅 Compra: ${fmtFecha(data.fechaCompra)}</span>` : '',
  ].filter(Boolean).join('');

  const html = wrap(data.loteNombre, subtitulo, 'Resumen de rentabilidad', cuerpo);
  await compartir(html, `Resumen_${data.loteNombre}.pdf`);
}

// ─── 2. Gastos ────────────────────────────────────────────────────────────────

export async function exportarGastosPDF(data: GastosReporteData) {
  const categoriasSorted = Object.entries(data.porCategoria).sort((a, b) => b[1] - a[1]);

  const barrasCategoria = categoriasSorted.map(([cat, total]) => {
    const pct = ((total / data.totalCop) * 100).toFixed(1);
    const barW = Math.round((total / data.totalCop) * 100);
    return `
      <tr>
        <td class="td-bold">${cat}</td>
        <td style="width:200px;">
          <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden;">
            <div style="width:${barW}%;background:#15803d;height:100%;border-radius:4px;"></div>
          </div>
        </td>
        <td class="td-right td-bold">${cop(total)}</td>
        <td class="td-right td-muted">${pct}%</td>
      </tr>`;
  }).join('');

  const filas = data.gastos.map((g) => `
    <tr>
      <td class="td-muted">${fmtFechaCorta(g.fecha)}</td>
      <td><span class="badge badge-gris">${g.categoria}</span></td>
      <td>${g.descripcion ?? '<span class="td-muted">Sin descripción</span>'}</td>
      <td class="td-right td-bold">${cop(g.montoCop)}</td>
    </tr>`).join('');

  const cuerpo = `
    <div class="kpis">
      <div class="kpi rojo">
        <div class="kpi-label">Total gastos</div>
        <div class="kpi-value rojo">${cop(data.totalCop)}</div>
        <div class="kpi-sub">${copFull(data.totalCop)}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Registros</div>
        <div class="kpi-value">${data.gastos.length}</div>
        <div class="kpi-sub">${categoriasSorted.length} categorías</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Mayor gasto</div>
        <div class="kpi-value">${cop(categoriasSorted[0]?.[1] ?? 0)}</div>
        <div class="kpi-sub">${categoriasSorted[0]?.[0] ?? '—'}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Distribución por categoría</div>
      <table>
        <thead>
          <tr><th>Categoría</th><th>Participación</th><th class="td-right">Total</th><th class="td-right">%</th></tr>
        </thead>
        <tbody>${barrasCategoria}</tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Detalle de gastos</div>
      <table>
        <thead>
          <tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th class="td-right">Monto</th></tr>
        </thead>
        <tbody>
          ${filas}
          <tr class="tr-total">
            <td colspan="3">TOTAL</td>
            <td class="td-right">${cop(data.totalCop)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;

  const html = wrap(data.loteNombre, '<span>📋 Historial de gastos del lote</span>', 'Reporte de gastos', cuerpo);
  await compartir(html, `Gastos_${data.loteNombre}.pdf`);
}

// ─── 3. Historial de pesajes ──────────────────────────────────────────────────

export async function exportarPesajesPDF(data: PesajesReporteData) {
  const pesos = data.pesajes.map((p) => p.pesoKg);
  const pesoMin = pesos.length ? Math.min(...pesos) : 0;
  const pesoMax = pesos.length ? Math.max(...pesos) : 0;
  const pesoPromedio = pesos.length ? pesos.reduce((a, b) => a + b, 0) / pesos.length : 0;

  const animalesUnicos = [...new Set(data.pesajes.map((p) => p.animalArete ?? 'Sin arete'))];

  const filas = data.pesajes.map((p, i) => {
    const prev = data.pesajes[i - 1];
    const diff = prev && prev.animalArete === p.animalArete
      ? p.pesoKg - prev.pesoKg
      : null;
    const diffStr = diff !== null
      ? `<span class="${diff >= 0 ? 'positivo' : 'negativo'}">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}</span>`
      : '<span class="td-muted">—</span>';
    return `
      <tr>
        <td class="td-bold">${p.animalArete ? `#${p.animalArete}` : '<span class="td-muted">—</span>'}</td>
        <td>${p.animalRaza ?? '<span class="td-muted">—</span>'}</td>
        <td class="td-muted">${fmtFechaCorta(p.fecha)}</td>
        <td class="td-right td-bold">${p.pesoKg} kg</td>
        <td class="td-right">${diffStr}</td>
        <td class="td-muted">${p.nota ?? ''}</td>
      </tr>`;
  }).join('');

  const cuerpo = `
    <div class="kpis">
      <div class="kpi">
        <div class="kpi-label">Total registros</div>
        <div class="kpi-value">${data.pesajes.length}</div>
        <div class="kpi-sub">${animalesUnicos.length} animales</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Peso mínimo</div>
        <div class="kpi-value">${pesoMin} kg</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Peso promedio</div>
        <div class="kpi-value">${pesoPromedio.toFixed(1)} kg</div>
      </div>
      <div class="kpi verde">
        <div class="kpi-label">Peso máximo</div>
        <div class="kpi-value verde">${pesoMax} kg</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Registros de peso</div>
      <table>
        <thead>
          <tr>
            <th>Arete</th>
            <th>Raza</th>
            <th>Fecha</th>
            <th class="td-right">Peso</th>
            <th class="td-right">Variación</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    </div>`;

  const html = wrap(data.loteNombre, '<span>⚖️ Historial completo de pesajes</span>', 'Reporte de pesajes', cuerpo);
  await compartir(html, `Pesajes_${data.loteNombre}.pdf`);
}
