import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import type { Category, Transaction } from '../types';
import {
  categoryBreakdown,
  computeMonthSummary,
  detectAnomalousCategories,
  detectRecurringExpenses,
  formatCurrency,
  monthLabel,
  transactionsForMonth,
} from './calculations';

// jsPDF's built-in Helvetica font mangles the narrow no-break space that
// Intl.NumberFormat('fr-FR') uses as a thousands separator (it renders as a
// stray "/"). Swap it for a plain space so amounts stay readable in the PDF.
function pdfCurrency(amount: number): string {
  return formatCurrency(amount).replace(/[\u00A0\u202F]/g, ' ');
}

export function exportMonthPDF(month: string, transactions: Transaction[], categories: Category[]) {
  const summary = computeMonthSummary(transactions, month);
  const breakdown = categoryBreakdown(transactions, categories, month, 'expense');
  const recurring = detectRecurringExpenses(transactions).filter((r) =>
    transactionsForMonth(transactions, month).some((t) => t.categoryId === r.categoryId && t.description === r.description),
  );
  const anomalies = detectAnomalousCategories(transactions, categories, month);
  const monthTx = transactionsForMonth(transactions, month).sort((a, b) => a.date.localeCompare(b.date));

  const doc = new jsPDF();
  const label = monthLabel(month);

  doc.setFontSize(18);
  doc.text(`Budget mensuel — ${label}`, 14, 18);

  autoTable(doc, {
    startY: 25,
    head: [['Solde', 'Revenus', 'Dépenses', "Taux d'épargne"]],
    body: [[
      pdfCurrency(summary.balance),
      pdfCurrency(summary.income),
      pdfCurrency(summary.expense),
      `${summary.savingsRate.toFixed(0)}%`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10, halign: 'center' },
  });
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (breakdown.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [['Catégorie', 'Montant', '% du total']],
      body: breakdown.map((b) => [b.name, pdfCurrency(b.total), `${b.percent.toFixed(0)}%`]),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (recurring.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text('Dépenses récurrentes détectées', 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Description', 'Coût mensuel']],
      body: recurring.map((r) => [r.description, pdfCurrency(r.monthlyTotal)]),
      theme: 'striped',
      headStyles: { fillColor: [180, 83, 9] },
      styles: { fontSize: 9 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (anomalies.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text('Catégories anormalement élevées ce mois-ci', 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Catégorie', 'Ce mois', 'Moyenne', 'Écart']],
      body: anomalies.map((a) => [
        a.name,
        pdfCurrency(a.current),
        pdfCurrency(a.average),
        `+${a.percentAboveAverage.toFixed(0)}%`,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [180, 83, 9] },
      styles: { fontSize: 9 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  if (monthTx.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(20);
    doc.text('Détail des entrées et sorties', 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Description', 'Catégorie', 'Type', 'Montant']],
      body: monthTx.map((t) => {
        const cat = categories.find((c) => c.id === t.categoryId);
        return [
          new Date(t.date).toLocaleDateString('fr-FR'),
          t.description,
          cat?.name ?? '',
          t.type === 'income' ? 'Revenu' : 'Dépense',
          `${t.type === 'income' ? '+' : '-'}${pdfCurrency(t.amount)}`,
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 8 },
    });
  }

  doc.save(`budget-${month}.pdf`);
}
