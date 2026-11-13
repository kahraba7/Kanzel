Kanzel site v23  ->  https://kanzel-eg.vercel.app

Deploy: upload the contents of this folder to the Vercel project root (vercel.json turns on clean URLs).

Public pages
  /            home + menu
  /booking     table reservation
  /events      events and occasions
  /table?t=5   guest ordering page, opened only by the QR code of table 5

Private pages (open by link only, not indexed by Google)
  /waiter      orders and table calls              staff PIN 7777
  /reception   reservations + table QR codes       staff PIN 7777
  /admin       reports, menu editing, settings     owner PIN 1234

Menu: /admin > Menu > "Import / export menu". Paste from Excel / Google Sheets (first row = category_en, category_ar, name_en, name_ar, price, desc_en, desc_ar), or CSV / JSON, or choose a file. Replace the whole menu or add to it. "Show current menu as CSV" gives you a file to edit and re-import.
Table QR codes: /reception > Tables & QR.
Change the PINs and the Google Maps review link from /admin > Settings.
Data (orders, bookings, menu edits, tables) is stored in each browser for now and is not shared between devices until the backend is connected.

Menu search + dish window (v23): dish.js is shared by / and /table. The search box sits above the category bar (Arabic and English, ignores diacritics and alef/ya/ta variants). Tapping a dish opens a detail window with the big photo, full description and price; on /table it also has the + / - order controls. /table cards now show dish photos too.
