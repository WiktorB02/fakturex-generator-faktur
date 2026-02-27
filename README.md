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

Frontend: http://localhost:5173/

## Konfiguracja środowiska
Pliki:
- `backend/.env` (skopiuj z `backend/.env.example`)
- `.env` (skopiuj z `.env.example`)

Przykład:
```
VITE_API_URL=http://localhost:3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fakturex?schema=public
```

## Dane testowe
Zarejestrowane konta demo (backend):
- admin@fakturex.pl / admin123
- ksiegowy@fakturex.pl / demo123
- podglad@fakturex.pl / demo123

## Struktura
```
/
├── backend/               # Backend API (NestJS)
│   ├── src/               # Kod źródłowy API (Moduły, Kontrolery, Serwisy)
│   ├── prisma/            # Schematy i migracje bazy danych
│   └── .env.example       # Przykładowe zmienne środowiskowe backendu
├── src/                   # Frontend (Vue 3)
│   ├── assets/            # Zasoby statyczne (obrazki, CSS)
│   ├── components/        # Komponenty wielokrotnego użytku (UI, generyczne)
│   ├── layouts/           # Główne szablony układu (MainLayout, Sidebar, itp.)
│   ├── router/            # Konfiguracja tras aplikacji
│   ├── services/          # Połączenia z API i logika biznesowa
│   ├── utils/             # Funkcje pomocnicze
│   └── views/             # Komponenty stron (Dashboard, Settings, itp.)
├── .env.example           # Przykładowe zmienne środowiskowe frontendu
└── package.json           # Zależności projektu
```

## Licencja
MIT
