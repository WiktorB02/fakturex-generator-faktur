# Fakturex – Generator faktur i magazyn

Nowoczesna aplikacja do fakturowania, obsługi magazynu i dokumentów sprzedaży z lokalnym backendem.

## Funkcje
- Faktury VAT, proformy, zaliczkowe, końcowe, korekty, paragony
- Dokumenty magazynowe (PZ/WZ/RW/MM/INW)
- Zamówienia sprzedaży/zakupu, picking, zwroty (RMA)
- Kontrahenci, magazyny, rezerwacje, partie/FEFO
- Cenniki, rabaty, kupony, szablony, języki
- Role i uprawnienia + panel ustawień

## Stack
- Frontend: Vue 3 + Vite
- Backend: Node.js + Express + SQLite
- Lokalna baza: `backend/data/fakturex.db`

## Uruchomienie (lokalnie)
1. Frontend:
	- `npm install`
	- `npm run dev`
2. Backend:
	- `cd backend`
	- `npm install`
	- `npm run dev`

## Konfiguracja
- Frontend API URL: ustaw `VITE_API_URL` w `.env` (wzór w `.env.example`).
- Backend: ustaw `JWT_SECRET`, `CORS_ORIGIN` w `backend/.env` (wzór w `backend/.env.example`).

## Dane
Backend zapisuje dane w `backend/data/fakturex.db` (SQLite). Po restarcie komputera wszystko zostaje.

## Struktura
- `src/` – frontend
- `backend/` – backend REST

## Licencja
MIT
