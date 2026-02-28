<template>
  <div class="preview-page">
    <div class="preview-toolbar no-print">
      <div class="toolbar-left">
        <button class="btn btn-secondary" @click="goBack">
          <i class="fa fa-arrow-left"></i> Wróć
        </button>
      </div>
      <div class="toolbar-center">
        <h2>Podgląd dokumentu</h2>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-primary" @click="print">
          <i class="fa fa-print"></i> Drukuj / PDF
        </button>
      </div>
    </div>

    <div class="preview-container">
      <div class="a4-page" id="invoice-content">
        <!-- Header -->
        <header class="doc-header">
          <div class="brand-section">
            <h1 class="company-name">{{ issuer.name }}</h1>
            <div class="company-details">
              <p v-if="issuer.nip">NIP: {{ issuer.nip }}</p>
              <p>{{ issuer.address }}</p>
            </div>
          </div>
          <div class="doc-meta">
            <h2 class="doc-title">{{ docTitle }}</h2>
            <p class="doc-number">{{ document.number }}</p>
            <div class="meta-grid">
              <div class="meta-row">
                <span>Data wystawienia:</span>
                <strong>{{ formatDate(document.issueDate) }}</strong>
              </div>
              <div class="meta-row">
                <span>Data sprzedaży:</span>
                <strong>{{ formatDate(document.saleDate) }}</strong>
              </div>
              <div class="meta-row" v-if="document.dueDate">
                <span>Termin płatności:</span>
                <strong>{{ formatDate(document.dueDate) }}</strong>
              </div>
            </div>
          </div>
        </header>

        <!-- Parties -->
        <section class="parties-section">
          <div class="party-box seller">
            <h3>Sprzedawca</h3>
            <p class="party-name">{{ issuer.name }}</p>
            <p>NIP: {{ issuer.nip }}</p>
            <p>{{ issuer.address }}</p>
          </div>
          <div class="party-box buyer">
            <h3>Nabywca</h3>
            <p class="party-name">{{ counterparty.name }}</p>
            <p v-if="counterparty.nip">NIP: {{ counterparty.nip }}</p>
            <p>{{ counterparty.address }}</p>
          </div>
        </section>

        <!-- Items -->
        <section class="items-section">
          <table class="doc-table">
            <thead>
              <tr>
                <th class="col-idx">Lp.</th>
                <th class="col-name">Nazwa towaru / usługi</th>
                <th class="col-qty text-right">Ilość</th>
                <th class="col-unit">Jm.</th>
                <th class="col-price text-right">Cena netto</th>
                <th class="col-vat text-right">VAT</th>
                <th class="col-gross text-right">Wartość brutto</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in items" :key="index">
                <td class="col-idx">{{ index + 1 }}</td>
                <td class="col-name">{{ item.description }}</td>
                <td class="col-qty text-right">{{ item.quantity }}</td>
                <td class="col-unit">szt.</td>
                <td class="col-price text-right">{{ formatMoney(item.price) }}</td>
                <td class="col-vat text-right">{{ item.vat === 'zw' ? 'zw' : item.vat + '%' }}</td>
                <td class="col-gross text-right">{{ formatGross(item) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- Summary -->
        <section class="summary-section">
          <div class="summary-notes">
            <div v-if="document.paymentMethod" class="payment-info">
              <p>Sposób płatności: <strong>{{ document.paymentMethod }}</strong></p>
              <p v-if="document.paymentStatus === 'paid'" class="status-paid">ZAPŁACONO</p>
            </div>
            <div v-if="document.notes" class="doc-notes">
              <h4>Uwagi:</h4>
              <p>{{ document.notes }}</p>
            </div>
          </div>
          <div class="summary-totals">
            <div class="total-row">
              <span>Razem netto:</span>
              <span>{{ totals.netto }} {{ currency }}</span>
            </div>
            <div class="total-row">
              <span>Razem VAT:</span>
              <span>{{ totals.vat }} {{ currency }}</span>
            </div>
            <div class="total-row grand-total">
              <span>Do zapłaty:</span>
              <span>{{ totals.brutto }} {{ currency }}</span>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="doc-footer">
          <p>Dokument wygenerowany elektronicznie w systemie Fakturex.</p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const issuer = ref({})
const counterparty = ref({})
const document = ref({})
const items = ref([])
const totals = ref({ netto: 0, vat: 0, brutto: 0 })
const currency = ref('PLN')

const typeLabels = {
  invoice: 'Faktura VAT',
  proforma: 'Proforma',
  advance: 'Faktura Zaliczkowa',
  final: 'Faktura Końcowa',
  correction: 'Korekta',
  receipt: 'Paragon',
  wz: 'Wydanie Zewnętrzne (WZ)',
  pz: 'Przyjęcie Zewnętrzne (PZ)'
}

const docTitle = computed(() => typeLabels[document.value.type] || 'Dokument')

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('pl-PL')
}

const formatMoney = (val) => Number(val).toFixed(2)

const formatGross = (item) => {
  const discount = Number(item.discountPercent || 0) / 100
  const vatRate = item.vat === 'zw' ? 0 : Number(item.vat) / 100
  const net = item.price * item.quantity * (1 - discount)
  return (net * (1 + vatRate)).toFixed(2)
}

const goBack = () => router.back()
const print = () => window.print()

onMounted(() => {
  if (route.query.data) {
    try {
      const data = JSON.parse(decodeURIComponent(route.query.data))
      issuer.value = data.issuer || {}
      counterparty.value = data.counterparty || {}
      document.value = data.document || {}
      items.value = data.items || []
      totals.value = data.totals || { netto: 0, vat: 0, brutto: 0 }
      currency.value = data.currency || 'PLN'
    } catch (e) {
      console.error('Błąd odczytu danych:', e)
    }
  }
})
</script>

<style scoped>
.preview-page {
  background: var(--app-bg);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
}

.preview-toolbar {
  width: 100%;
  max-width: 210mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  color: var(--app-text);
}

.toolbar-center h2 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--app-text);
}

.preview-container {
  background: var(--app-surface-elevated);
  border: 1px solid var(--app-border);
  padding: var(--spacing-sm);
  box-shadow: var(--shadow-xl);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.a4-page {
  --doc-primary: #1d4ed8;
  --doc-text: #0f172a;
  --doc-muted: #475569;
  --doc-soft: #f1f5f9;
  --doc-line: #cbd5e1;

  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  background: white;
  color: var(--doc-text);
  font-size: 10pt;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

:global(.dark) .preview-page {
  background: color-mix(in srgb, var(--app-bg) 86%, #000);
}

:global(.dark) .preview-container {
  background: color-mix(in srgb, var(--app-surface-elevated) 72%, #0b1220);
  border-color: color-mix(in srgb, var(--app-border) 65%, #94a3b8);
  box-shadow: 0 24px 56px rgba(2, 6, 23, 0.7);
}

:global(.dark) .a4-page {
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.55),
    0 18px 36px rgba(2, 6, 23, 0.35);
}

/* Header */
.doc-header {
  display: flex;
  justify-content: space-between;
  border-bottom: 2px solid var(--doc-primary);
  padding-bottom: 20px;
  margin-bottom: 30px;
}

.company-name {
  font-size: 18pt;
  font-weight: bold;
  color: var(--doc-primary);
  margin: 0 0 5px 0;
}

.company-details {
  color: var(--doc-muted);
  line-height: 1.4;
}

.doc-meta {
  text-align: right;
}

.doc-title {
  font-size: 16pt;
  font-weight: bold;
  color: var(--doc-text);
  margin: 0;
  text-transform: uppercase;
}

.doc-number {
  font-size: 12pt;
  color: var(--doc-muted);
  margin: 5px 0 15px 0;
}

.meta-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-row {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Parties */
.parties-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 40px;
}

.party-box {
  flex: 1;
}

.party-box h3 {
  font-size: 9pt;
  text-transform: uppercase;
  color: var(--doc-muted);
  margin-bottom: 10px;
  border-bottom: 1px solid var(--doc-line);
  padding-bottom: 5px;
}

.party-name {
  font-weight: bold;
  font-size: 11pt;
  margin-bottom: 5px;
}

/* Table */
.items-section {
  flex: 1;
}

.doc-table {
  width: 100%;
  border-collapse: collapse;
}

.doc-table th {
  background: var(--doc-soft);
  padding: 8px;
  text-align: left;
  font-weight: bold;
  font-size: 9pt;
  border-bottom: 1px solid var(--doc-line);
}

.doc-table td {
  padding: 8px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.text-right { text-align: right; }

.col-idx { width: 40px; color: var(--doc-muted); }
.col-qty { width: 80px; }
.col-unit { width: 50px; }
.col-price { width: 100px; }
.col-vat { width: 60px; }
.col-gross { width: 120px; font-weight: bold; }

/* Summary */
.summary-section {
  margin-top: 30px;
  display: flex;
  justify-content: space-between;
  page-break-inside: avoid;
}

.summary-notes {
  flex: 1;
  padding-right: 40px;
}

.payment-info {
  margin-bottom: 20px;
}

.status-paid {
  display: inline-block;
  background: var(--success-light);
  color: var(--success);
  border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 8pt;
  margin-top: 5px;
  font-weight: bold;
}

.doc-notes h4 {
  font-size: 9pt;
  margin-bottom: 5px;
}

.doc-notes p {
  font-size: 9pt;
  color: var(--doc-muted);
  font-style: italic;
}

.summary-totals {
  width: 250px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid var(--doc-line);
}

.total-row.grand-total {
  border-top: 2px solid var(--doc-line);
  border-bottom: none;
  font-size: 14pt;
  font-weight: bold;
  margin-top: 10px;
  padding-top: 10px;
  color: var(--doc-primary);
}

/* Footer */
.doc-footer {
  margin-top: 50px;
  padding-top: 10px;
  border-top: 1px solid var(--doc-line);
  text-align: center;
  color: var(--doc-muted);
  font-size: 8pt;
}

@media print {
  .no-print { display: none !important; }
  .preview-page { background: white; padding: 0; }
  .preview-container { box-shadow: none; padding: 0; border: none; }
  .a4-page { width: 100%; min-height: 0; padding: 0; }
  @page { margin: 15mm; }
}
</style>
