# Fakturex – Generator faktur i magazyn

Nowoczesna aplikacja do fakturowania, obsługi magazynu i dokumentów sprzedaży z pełnym backendem API.

## Funkcje
- Faktury VAT, proformy, zaliczkowe, końcowe, korekty, paragony
- Faktury bez VAT, duplikaty, numeracja wg wzorców
- PDF, wersje językowe, wysyłka mail
- Kontrahenci (NIP, tagi, historia), produkty, stany magazynowe
- Płatności, statusy, należności
- Raporty (miesięczny przychód, VAT, top klienci) + CSV/XLSX
- Multi‑company + RBAC (Owner/Accountant/Viewer)
- Faktury cykliczne (scheduler)

## Stack
- Frontend: Vue 3 + Vite
- Backend: NestJS + Prisma + PostgreSQL
- PDF: Puppeteer
- Mail: nodemailer (SMTP)

## Wymagania
- Node.js 18+
- Docker Desktop (PostgreSQL w kontenerze) lub lokalny PostgreSQL

## Uruchomienie (lokalnie)

### 1) Baza danych (Docker)
```bash
cd backend
docker compose up -d
```

### 2) Backend API
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run start:dev
```

Backend domyślnie startuje na porcie `3001` (ustawiane przez `PORT`).

### 3) Frontend
```bash
cd ..
npm install
npm run dev
```

Frontend: http://127.0.0.1:5173/

## Konfiguracja środowiska
Pliki:
- [backend/.env](backend/.env)
- [.env](.env)

Przykład backend/.env:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fakturex?schema=public
PORT=3001
JWT_SECRET=secret
```

Przykład .env (root):
```
VITE_API_URL=http://localhost:3001
```

## Dane testowe
Zarejestrowane konta demo (backend):
- admin@fakturex.pl / admin123
- ksiegowy@fakturex.pl / demo123
- podglad@fakturex.pl / demo123

## Struktura
- [src/](src/) – frontend
- [backend/](backend/) – backend API

## Licencja
MIT
