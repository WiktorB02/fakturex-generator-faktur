export enum Role {
  OWNER = 'OWNER',
  ACCOUNTANT = 'ACCOUNTANT',
  VIEWER = 'VIEWER',
}

export enum InvoiceType {
  INVOICE = 'INVOICE',
  PROFORMA = 'PROFORMA',
  ADVANCE = 'ADVANCE',
  FINAL = 'FINAL',
  CORRECTION = 'CORRECTION',
  RECEIPT = 'RECEIPT',
  NO_VAT = 'NO_VAT',
}

export enum ResetPeriod {
  NONE = 'NONE',
  YEARLY = 'YEARLY',
  MONTHLY = 'MONTHLY',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export enum PaymentMethod {
  TRANSFER = 'TRANSFER',
  CASH = 'CASH',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
}

export enum Currency {
  PLN = 'PLN',
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CZK = 'CZK',
}

export enum Unit {
  PCS = 'PCS',
  HOUR = 'HOUR',
  KG = 'KG',
}
