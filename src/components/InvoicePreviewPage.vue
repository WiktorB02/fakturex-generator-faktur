<template>
  <div class="preview-page">
    <div class="actions-bar">
      <div>
        <button class="btn btn-ghost" @click="goBack">
          <i class="fa fa-arrow-left"></i> Powrót
        </button>
      </div>

      <div class="action-buttons">
        <button class="btn btn-secondary" @click="window.print()">
          <i class="fa fa-print"></i> Drukuj
        </button>
        <button class="btn btn-primary" @click="downloadPDF">
          <i class="fa fa-download"></i> Pobierz PDF
        </button>
      </div>
    </div>

    <div class="preview-container">
      <div
        id="pdf"
        class="invoice-document"
        :class="`layout-${template.layout}`"
        :style="{ '--accent': template.accentColor }"
      >
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-logo" v-if="template.logo">
            <img :src="template.logo" alt="Logo" />
          </div>
          <div class="document-meta">
            <h1>{{ typeLabel }}</h1>
            <div class="meta-row">
              <span class="label">{{ labels.number }}:</span>
              <span class="value">{{ doc.number }}</span>
            </div>
            <div class="meta-row">
              <span class="label">{{ labels.issueDate }}:</span>
              <span class="value">{{ invoiceDate }}</span>
            </div>
            <div class="meta-row">
              <span class="label">{{ labels.saleDate }}:</span>
              <span class="value">{{ saleDate }}</span>
            </div>
          </div>
        </div>

        <!-- Parties -->
        <div class="invoice-parties">
          <div class="party issuer">
            <h3>{{ labels.issuer }}</h3>
            <div class="party-details">
              <strong>{{ issuer.name }}</strong>
              <div>{{ issuer.address }}</div>
              <div>{{ issuer.nip ? `NIP: ${issuer.nip}` : '' }}</div>
            </div>
          </div>
          <div class="party counterparty">
            <h3>{{ counterpartyTitle }}</h3>
            <div class="party-details">
              <strong>{{ counterparty.name }}</strong>
              <div>{{ counterparty.address }}</div>
              <div>{{ counterparty.nip ? `NIP: ${counterparty.nip}` : '' }}</div>
            </div>
          </div>
        </div>

        <div v-if="doc.relatedNumber" class="related-doc">
          Powiązany dokument: <strong>{{ doc.relatedNumber }}</strong>
        </div>

        <!-- Items -->
        <table class="invoice-items">
          <thead>
            <tr>
              <th class="text-left">{{ labels.description }}</th>
              <th class="text-center">{{ labels.quantity }}</th>
              <th class="text-right">{{ labels.netPrice }}</th>
              <th class="text-right">VAT</th>
              <th class="text-right">{{ labels.netValue }}</th>
              <th class="text-right">{{ labels.grossValue }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td class="text-left">{{ item.description }}</td>
              <td class="text-center">{{ item.quantity }}</td>
              <td class="text-right">{{ formatCurrency(item.price) }}</td>
              <td class="text-right">{{ item.vat }}{{ item.vat === 'zw' ? '' : '%' }}</td>
              <td class="text-right">{{ formatCurrency(item.quantity * item.price) }}</td>
              <td class="text-right">{{ formatCurrency(item.quantity * item.price * (1 + vatToNumber(item.vat) / 100)) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Summary -->
        <div class="invoice-footer-section">
          <div class="invoice-notes" v-if="doc.notes || showPaymentInfo || template.terms">
            <div v-if="showPaymentInfo" class="payment-info">
              <h3>{{ labels.paymentInfo }}</h3>
              <p>
                <span class="label">{{ labels.dueDate }}:</span> {{ dueDate }}
              </p>
              <p>
                <span class="label">{{ labels.paymentMethod }}:</span> {{ doc.paymentMethod }}
              </p>
              <p v-if="settings.payment.bankAccount">
                <span class="label">{{ labels.bankAccount }}:</span> {{ settings.payment.bankAccount }}
              </p>
              <p v-if="settings.payment.bankName">
                <span class="label">{{ labels.bankName }}:</span> {{ settings.payment.bankName }}
              </p>
            </div>

            <div v-if="doc.notes" class="notes-block">
              <h3>{{ labels.notes }}</h3>
              <p>{{ doc.notes }}</p>
            </div>

            <div v-if="template.terms" class="terms-block">
              <h3>{{ labels.terms }}</h3>
              <p>{{ template.terms }}</p>
            </div>
          </div>

          <div class="invoice-totals">
            <div class="total-row">
              <span>{{ labels.netTotal }}:</span>
              <span>{{ totalNetto }} {{ currency }}</span>
            </div>
            <div class="total-row">
              <span>VAT:</span>
              <span>{{ totalVat }} {{ currency }}</span>
            </div>
            <div class="total-row grand-total">
              <span>{{ labels.grossTotal }}:</span>
              <span>{{ totalBrutto }} {{ currency }}</span>
            </div>
          </div>
        </div>

        <div class="invoice-footer-note">
          <p>{{ template.footerNote }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getSettings } from '@/services/settings'

const route = useRoute()
const router = useRouter()

const issuer = ref({})
const counterparty = ref({})
const doc = ref({})
const items = ref([])
const currency = ref('PLN')
const settings = ref(getSettings())
const template = computed(() => settings.value.template)
const language = computed(() => doc.value.language || template.value.language || 'pl')
let filename = 'dokument.pdf'

if (route.query.data) {
  try {
    const parsed = JSON.parse(decodeURIComponent(route.query.data))
    issuer.value = parsed.issuer || {}
    counterparty.value = parsed.counterparty || parsed.client || {}
    doc.value = parsed.document || parsed.invoice || {}
    items.value = parsed.items || []
    currency.value = parsed.currency || 'PLN'
    filename = parsed.filename || filename
  } catch (error) {
    console.error('Błąd podczas dekodowania danych faktury:', error)
  }
}

const invoiceDate = computed(() => {
  if (doc.value.issueDate) {
    const parsedDate = new Date(doc.value.issueDate)
    return isNaN(parsedDate) ? 'Data nieprawidłowa' : parsedDate.toLocaleDateString('pl-PL')
  }
  return 'Brak daty'
})

const saleDate = computed(() => {
  if (doc.value.saleDate) {
    const parsedDate = new Date(doc.value.saleDate)
    return isNaN(parsedDate) ? 'Data nieprawidłowa' : parsedDate.toLocaleDateString('pl-PL')
  }
  return 'Brak daty'
})

const vatToNumber = (vat) => {
  if (vat === 'zw') return 0
  const parsed = parseFloat(String(vat))
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatCurrency = (val) => {
  return Number(val).toFixed(2)
}

const totalNetto = computed(() =>
  items.value.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)
)

const totalVat = computed(() =>
  items.value.reduce((sum, item) => sum + item.quantity * item.price * (vatToNumber(item.vat) / 100), 0).toFixed(2)
)

const totalBrutto = computed(() =>
  items.value.reduce((sum, item) => sum + item.quantity * item.price * (1 + vatToNumber(item.vat) / 100), 0).toFixed(2)
)

const typeLabel = computed(() => {
  const labels = {
    invoice: 'Faktura VAT',
    proforma: 'Proforma',
    advance: 'Faktura zaliczkowa',
    final: 'Faktura końcowa',
    correction: 'Korekta',
    receipt: 'Paragon',
    pz: 'PZ (przyjęcie zewnętrzne)',
    wz: 'WZ (wydanie zewnętrzne)',
    rw: 'RW (rozchód wewnętrzny)',
    mm: 'MM (przesunięcie)',
    inw: 'INW (inwentaryzacja)',
    so: 'Zamówienie sprzedaży',
    po: 'Zamówienie zakupu',
    rma: 'Zwrot/RMA',
    expense: 'Wydatek'
  }
  return labels[doc.value.type] || 'Dokument'
})

const labels = computed(() => {
  const translations = {
    pl: {
      number: 'Numer',
      issueDate: 'Data wystawienia',
      saleDate: 'Data sprzedaży',
      issuer: 'Wystawca',
      description: 'Opis',
      quantity: 'Ilość',
      netPrice: 'Cena netto',
      netValue: 'Wartość netto',
      grossValue: 'Wartość brutto',
      netTotal: 'Suma netto',
      grossTotal: 'Suma brutto',
      paymentInfo: 'Informacje o płatności',
      dueDate: 'Termin płatności',
      paymentMethod: 'Metoda płatności',
      bankAccount: 'Konto',
      bankName: 'Bank',
      notes: 'Uwagi',
      terms: 'Warunki'
    },
    en: {
      number: 'Number',
      issueDate: 'Issue date',
      saleDate: 'Sale date',
      issuer: 'Issuer',
      description: 'Description',
      quantity: 'Qty',
      netPrice: 'Net price',
      netValue: 'Net value',
      grossValue: 'Gross value',
      netTotal: 'Net total',
      grossTotal: 'Gross total',
      paymentInfo: 'Payment details',
      dueDate: 'Due date',
      paymentMethod: 'Payment method',
      bankAccount: 'Account',
      bankName: 'Bank',
      notes: 'Notes',
      terms: 'Terms'
    }
  }
  return translations[language.value] || translations.pl
})

const counterpartyTitle = computed(() => {
  const isEn = language.value === 'en'
  if (doc.value.type === 'pz') return isEn ? 'Supplier' : 'Dostawca'
  if (doc.value.type === 'wz') return isEn ? 'Recipient' : 'Odbiorca'
  if (doc.value.type === 'rw') return isEn ? 'Internal' : 'Rozchód'
  if (doc.value.type === 'mm') return isEn ? 'Transfer' : 'Przesunięcie'
  if (doc.value.type === 'inw') return isEn ? 'Inventory' : 'Inwentaryzacja'
  if (doc.value.type === 'expense') return isEn ? 'Counterparty' : 'Kontrahent'
  return isEn ? 'Buyer' : 'Nabywca'
})

const showPaymentInfo = computed(() =>
  settings.value.template.showPaymentInfo &&
  ['invoice', 'proforma', 'advance', 'final', 'correction'].includes(doc.value.type)
)

const dueDate = computed(() => {
  if (!doc.value.dueDate) return '—'
  const parsed = new Date(doc.value.dueDate)
  return isNaN(parsed) ? '—' : parsed.toLocaleDateString('pl-PL')
})

const downloadPDF = async () => {
  const element = window.document.getElementById('pdf')
  const canvas = await html2canvas(element, { scale: 2 })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(filename)
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.preview-page {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  align-items: center;
  padding-bottom: var(--spacing-3xl);
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 210mm; /* A4 width */
}

.action-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

.preview-container {
  width: 100%;
  max-width: 210mm;
  background: #525659;
  padding: 40px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.invoice-document {
  background: white;
  width: 100%;
  min-height: 297mm; /* A4 height */
  padding: 40px;
  box-sizing: border-box;
  font-family: var(--font-sans);
  color: #0f172a;
  position: relative;
}

/* Layout variants could be added here based on .layout-compact etc */

.invoice-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  border-bottom: 2px solid var(--accent, #6366f1);
  padding-bottom: 20px;
}

.company-logo img {
  max-height: 80px;
  max-width: 200px;
}

.document-meta {
  text-align: right;
  flex: 1;
}

.document-meta h1 {
  color: var(--accent, #6366f1);
  margin: 0 0 10px 0;
  font-size: 24px;
  text-transform: uppercase;
}

.meta-row {
  margin-bottom: 4px;
  font-size: 14px;
}

.meta-row .label {
  color: #64748b;
  margin-right: 8px;
}

.meta-row .value {
  font-weight: 600;
}

.invoice-parties {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  gap: 40px;
}

.party {
  flex: 1;
}

.party h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 4px;
}

.party-details {
  font-size: 14px;
  line-height: 1.6;
}

.related-doc {
  margin-bottom: 20px;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 14px;
}

.invoice-items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 40px;
}

.invoice-items th {
  background: var(--accent, #6366f1);
  color: white;
  padding: 10px;
  font-size: 12px;
  text-transform: uppercase;
}

.invoice-items td {
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.invoice-items tr:last-child td {
  border-bottom: none;
}

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.invoice-footer-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
}

.invoice-notes {
  flex: 1;
  padding-right: 40px;
  font-size: 13px;
}

.invoice-notes h3 {
  font-size: 12px;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
  margin-top: 16px;
}

.invoice-notes h3:first-child {
  margin-top: 0;
}

.invoice-totals {
  width: 300px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.total-row.grand-total {
  border-bottom: none;
  font-size: 18px;
  font-weight: bold;
  color: var(--accent, #6366f1);
  border-top: 2px solid #e2e8f0;
  margin-top: 8px;
  padding-top: 16px;
}

.invoice-footer-note {
  position: absolute;
  bottom: 40px;
  left: 40px;
  right: 40px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
}

@media print {
  .preview-page {
    padding: 0;
    background: white;
  }
  .actions-bar, .preview-container {
    box-shadow: none;
    padding: 0;
    background: transparent;
  }
  .actions-bar {
    display: none;
  }
  .preview-container {
    width: 100%;
    max-width: none;
  }
  .invoice-document {
    padding: 0;
    min-height: auto;
  }
}
</style>
