const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    preview: 'Aa',
    style: 'serif-header'
  },
  {
    id: 'modern',
    name: 'Modern',
    preview: 'Aa',
    style: 'sans-bold'
  },
  {
    id: 'clean',
    name: 'Clean',
    preview: 'Aa',
    style: 'minimal'
  },
  {
    id: 'bold',
    name: 'Bold',
    preview: 'Aa',
    style: 'heavy-accent'
  },
  {
    id: 'elegant',
    name: 'Elegant',
    preview: 'Aa',
    style: 'thin-lines'
  },
  {
    id: 'compact',
    name: 'Compact',
    preview: 'Aa',
    style: 'dense'
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    preview: 'Aa',
    style: 'left-accent'
  },
  {
    id: 'bordered',
    name: 'Bordered',
    preview: 'Aa',
    style: 'full-border'
  },
  {
    id: 'subtle',
    name: 'Subtle',
    preview: 'Aa',
    style: 'light-accent'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    preview: 'Aa',
    style: 'header-stripe'
  },
  {
    id: 'grid',
    name: 'Grid',
    preview: 'Aa',
    style: 'grid-lines'
  },
  {
    id: 'corner',
    name: 'Corner',
    preview: 'Aa',
    style: 'corner-accent'
  }
];

const ACCENT_COLORS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Slate', value: '#475569' },
  { name: 'Navy', value: '#1e3a5f' },
  { name: 'Forest', value: '#2d5016' },
  { name: 'Crimson', value: '#991b1b' }
];

function getDefaultSettings() {
  return {
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyWebsite: '',
    logo: null,
    template: 'modern',
    accentColor: '#2563eb',
    invoicePrefix: 'INV',
    currency: 'CAD',
    taxTPS: true,
    taxTVQ: true,
    tpsRate: 0.05,
    tvqRate: 0.09975,
    notes: '',
    paymentTerms: 'Net 30',
    labelInvoice: 'INVOICE',
    labelBillTo: 'Bill To:',
    labelSubtotal: 'Subtotal',
    labelTotal: 'Total',
    labelNotes: 'Notes',
    labelPaymentTerms: 'Payment Terms',
    labelDescription: 'Description',
    labelRate: 'Rate',
    labelHours: 'Hours',
    labelAmount: 'Amount',
    labelInvoiceNumber: 'Invoice #',
    labelDate: 'Date',
    labelDueDate: 'Due',
    labelTPS: 'TPS',
    labelTVQ: 'TVQ'
  };
}
