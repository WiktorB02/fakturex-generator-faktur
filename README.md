# Fakturex – Generator faktur i magazyn

Nowoczesna aplikacja do fakturowania, obsługi magazynu i dokumentów sprzedaży z pełnym backendem API.

## Funkcje
- Faktury VAT, proformy, zaliczkowe, końcowe, korekty, paragony
- Faktury bez VAT, duplikaty, numeracja wg wzorców
- PDF, wersje językowe, wysyłka mail
- Kontrahenci (NIP, tagi, historia), produkty, stany magazynowe
- Płatności, statusy, należności
- Raporty (miesięczny przychód, VAT, top klienci) + CSV/XLSX
- Multi‑company + RBAC (Właściciel/Księgowy/Podgląd)
- Faktury cykliczne (scheduler)

## Stack
- Frontend: Vue 3 + Vite
- Backend: NestJS + Prisma + SQLite (dev) / PostgreSQL (prod)
- PDF: Puppeteer
- Mail: nodemailer (SMTP)

## Wymagania
- Node.js 18+

## Uruchomienie (szybki start - SQLite)

### 1) Backend API
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

Backend startuje na porcie `3002`.

### 2) Frontend
```bash
cd ..
npm install
npm run dev
```

Frontend: http://localhost:3000/ (Dostęp przez proxy live preview)

## Konfiguracja środowiska
Domyślna konfiguracja deweloperska używa SQLite (`backend/dev.db`).
Aby użyć PostgreSQL, należy zmienić `provider` w `backend/prisma/schema.prisma` i ustawić `DATABASE_URL`.

## Dane testowe
Zarejestrowane konta demo (backend):
- admin@fakturex.pl / admin123 (Właściciel)
- ksiegowy@fakturex.pl / demo123 (Księgowość)
- podglad@fakturex.pl / demo123 (Podgląd)

## Struktura
- [src/](src/) – frontend
- [backend/](backend/) – backend API

## Licencja
MIT
