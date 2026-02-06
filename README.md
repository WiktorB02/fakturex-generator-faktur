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
- Lokalna baza: szyfrowany IndexedDB (przeglądarka)

## Uruchomienie (lokalnie)
- `npm install`
- `npm run dev`

## Dane
Zapisywane lokalnie w przeglądarce (IndexedDB). Po restarcie komputera wszystko zostaje.

## Struktura
- `src/` – aplikacja

## Licencja
MIT
