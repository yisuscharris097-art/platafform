/**
 * Relay Studios tracking snippet — works on BOTH hosting targets:
 *   • Cloudflare Pages static exports (Starter/Signature)
 *   • Vercel multi-tenant flagship sites
 *
 * Install (before </body>):
 *   <script src="https://YOUR-PLATFORM-DOMAIN/collect.js"
 *           data-client="CLIENT_SLUG" defer></script>
 *
 * Sends: pageview on load · call_click (tel:) · whatsapp_click (wa.me) ·
 * listing_view / gallery_open via [data-listing-id] / [data-gallery] markers.
 */
;(function () {
  var script = document.currentScript
  if (!script) return
  var client = script.getAttribute('data-client')
  if (!client) return
  var endpoint = new URL('/api/collect', script.src).toString()

  var KEY = '_rs_session'
  var session = null
  try {
    session = sessionStorage.getItem(KEY)
    if (!session) {
      session = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(KEY, session)
    }
  } catch (e) {
    session = 'no-storage'
  }

  var utm = {}
  try {
    var qs = new URLSearchParams(location.search)
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
      var v = qs.get(k)
      if (v) utm[k] = v
    })
  } catch (e) {}

  function send(type, extra) {
    var payload = Object.assign(
      { client: client, type: type, path: location.pathname, session: session, referrer: document.referrer || undefined, utm: utm },
      extra || {}
    )
    try {
      navigator.sendBeacon
        ? navigator.sendBeacon(endpoint, new Blob([JSON.stringify(payload)], { type: 'application/json' }))
        : fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true })
    } catch (e) {}
  }

  send('pageview')

  var listingEl = document.querySelector('[data-listing-id]')
  if (listingEl) send('listing_view', { listing_id: listingEl.getAttribute('data-listing-id') || undefined })

  document.addEventListener('click', function (ev) {
    var el = ev.target instanceof Element ? ev.target.closest('a,[data-gallery]') : null
    if (!el) return
    if (el.hasAttribute && el.hasAttribute('data-gallery')) return send('gallery_open')
    var href = el.getAttribute('href') || ''
    if (href.indexOf('tel:') === 0) send('call_click')
    else if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) send('whatsapp_click')
  })
})()
