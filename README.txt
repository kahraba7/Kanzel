Kanzel site v12

Pages
  index.html      home + menu
  table.html      guest ordering (QR per table: table.html?t=5)
  waiter.html     orders, table calls             (staff PIN 7777)
  reception.html  table bookings + events         (staff PIN 7777)
  admin.html      reports, menu editing, settings (owner PIN 1234)
  booking.html / events.html   guest forms
  404.html        "page not found" (set it as the 404 page on your host)

Change the PINs and the Google Maps review link from admin.html > Settings.

PWA: needs HTTPS (or localhost). Open the site, then "Add to Home Screen".
Data (orders, bookings, menu edits) is stored in the browser for now, so it is not shared between devices until the backend is connected.
Menu defaults live in menu.js; edits made in admin.html are saved on top of them.
