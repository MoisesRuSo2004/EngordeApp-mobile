import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AnimalResumen, LoteResumenData, GastoData, PesajeReporte } from './pdf';

// CSV compatible con Excel (BOM UTF-8 para que Excel lo abra correctamente)
const BOM = '﻿';

function esc(v: string | number | undefined): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cols: (string | number | undefined)[]) {
  return cols.map(esc).join(',') + '\n';
}

async function compartirCSV(contenido: string, nombre: string) {
  const archivo = new File(Paths.cache, nombre);
  archivo.write(BOM + contenido);
  await Sharing.shareAsync(archivo.uri, {
    mimeType: 'text/csv',
    dialogTitle: nombre,
    UTI: 'public.comma-separated-values-text',
  });
}

// ─── Animales del lote ────────────────────────────────────────────────────────

export async function exportarAnimalesCSV(data: LoteResumenData) {
  let csv = row(
    'Nº', 'Arete', 'Raza',
    'Peso inicial (kg)', 'Peso actual (kg)', 'Ganancia (kg)', 'GDP (kg/día)',
    'Precio compra (COP)', 'Valor hoy (COP)', 'Utilidad (COP)', 'Margen (%)',
  );

  data.animales.forEach((a, i) => {
    const ganancia = a.pesoActualKg - a.pesoInicialKg;
    const margen = a.precioCompraCop > 0
      ? ((a.utilidadHoyCop / a.precioCompraCop) * 100).toFixed(1)
      : '0.0';
    csv += row(
      i + 1,
      a.arete ? `#${a.arete}` : '',
      a.raza,
      a.pesoInicialKg,
      a.pesoActualKg,
      ganancia.toFixed(1),
      a.gdpKgDia.toFixed(3),
      a.precioCompraCop,
      a.valorHoyCop,
      a.utilidadHoyCop,
      margen,
    );
  });

  // Fila de totales
  csv += row();
  csv += row(
    '', 'TOTAL', '',
    '', '', '', '',
    data.totalInvertidoCop,
    data.valorHoyTotalCop,
    data.utilidadTotalCop,
    data.totalInvertidoCop > 0
      ? ((data.utilidadTotalCop / data.totalInvertidoCop) * 100).toFixed(1) + '%'
      : '—',
  );

  await compartirCSV(csv, `Animales_${data.loteNombre.replace(/\s/g, '_')}.csv`);
}

// ─── Gastos del lote ──────────────────────────────────────────────────────────

export async function exportarGastosCSV(gastos: GastoData[], loteNombre: string) {
  let csv = row('Fecha', 'Categoría', 'Descripción', 'Monto (COP)');
  gastos.forEach((g) => {
    csv += row(g.fecha, g.categoria, g.descripcion, g.montoCop);
  });
  const total = gastos.reduce((s, g) => s + g.montoCop, 0);
  csv += row();
  csv += row('', '', 'TOTAL', total);

  await compartirCSV(csv, `Gastos_${loteNombre.replace(/\s/g, '_')}.csv`);
}

// ─── Historial de pesajes ─────────────────────────────────────────────────────

export async function exportarPesajesCSV(pesajes: PesajeReporte[], loteNombre: string) {
  let csv = row('Arete', 'Raza', 'Fecha', 'Peso (kg)', 'Observaciones');
  pesajes.forEach((p) => {
    csv += row(
      p.animalArete ? `#${p.animalArete}` : '',
      p.animalRaza,
      p.fecha,
      p.pesoKg,
      p.nota,
    );
  });

  await compartirCSV(csv, `Pesajes_${loteNombre.replace(/\s/g, '_')}.csv`);
}
