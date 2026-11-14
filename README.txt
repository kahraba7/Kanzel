Kanzel site v30  ->  https://kanzel-eg.vercel.app

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

v24 design pass: text-only rows for dishes without a photo, compact cards (78px photo, plain gold price), chip category bar instead of big tiles, compact header + waiter/bill buttons, home scrim + 2x2 links, booking/events policy section tightened, PIN screen (logo, no stray focus ring, bigger Home), higher text contrast.

v25: fixed home buttons failing when pages are opened without a server (file://) or when dish.js is missing/stale; links now use index.html/booking.html style paths on file:// and clean URLs on a host.

v26: all internal links now use ./booking.html style paths, so they work on any static host (no clean-URL rewrite needed) and when opened as files.

v27 home: live open/closed status (Cairo time, 10 AM-3 AM), time-based tagline, slow "From our kitchen" dish strip (tap opens the dish in the menu), logo shine, film grain, staggered entrance, round icon row for WhatsApp/location/Instagram/Google.

v29: videos moved to video/ (like img/ for images). v28 video: new 720p videos (watermark cropped out). Home background changes by Cairo time: morning (6-12) home-morning.mp4, day (12-18) home-day.mp4, night home-night.mp4. Booking uses band-day.mp4 and events band-night.mp4 as a soft header band. Old bg.mp4 removed. Poster jpgs sit next to each video.

v30 menu page (index.html): 4 big tabs (Food / Drinks / Desserts / Shisha) hold the 24 categories (matched by English name, edit GROUPS in index.html); each category header is a banner with its top dish photo and a line icon; the open category title stays pinned under the tabs; categories with mostly photos (Pizza, Pasta, Main Dishes...) show a 2-column big-photo grid, drink categories stay compact lists; the menu opens on a section that fits Cairo time (edit TOD): morning Breakfast, otherwise Main Dishes, drinks tab picks Hot Drinks / Fresh Juice / Virgin Cocktail; photos fade in from a blur (ph.js holds the placeholder colours) and cards rise in as they appear.
