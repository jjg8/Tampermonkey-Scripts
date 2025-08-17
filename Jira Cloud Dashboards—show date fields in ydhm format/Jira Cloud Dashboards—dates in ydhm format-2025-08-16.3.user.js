// ==UserScript==
// @name         Jira Cloud Dashboards—dates in ydhm format
// @namespace    http://tampermonkey.net/
// @version      2025-08-16.3
// @description  From fields displaying only date (e.g. 08/13/25), get date/time from its tooltip title (e.g. Aug 13, 2025 1:23 PM) and output in ydhm format (e.g. 1d 6h 19m) — see code for more
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Jira%20Cloud%20Dashboards%E2%80%94show%20date%20fields%20in%20ydhm%20format
// @match        https://*.atlassian.net/jira/dashboards/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @run-at       document-idle
// @grant        none
// ==/UserScript==
//
// - From fields displaying only date (e.g. 08/13/25), get date/time from its tooltip title (e.g. Aug 13, 2025 1:23 PM) and output in ydhm format (e.g. 1d 6h 19m).
// - When the Year, Days, Hour, or Mins portion is 0, it's omitted (e.g. 32m, 1d 50m, etc).
// - The ydhm format goes as high as displaying the number of years ago it was (e.g. 1y 364d 23h 59m).
// - Release 2025-08-15.2 introduced the `SEP` variable, which defaults to a single space, between the Year, Days, Hour, and Mins portions.
// - Release 2025-08-16.3 introduced color-coding in <span> tags with these defaults...
//   - When `ms_diffValue <  1h`: Bold Black on Red
//   - When `ms_diffValue <  1d`: Bold Black on Yellow
//   - When `ms_diffValue >= 1d`: Normal Black on DarkGreen
// - Feel free to customize it to your heart's content.
//

(function() {
 'use strict';


 // ↘️
 // ➡️ User Preferences (change to suit)...
 // ↗️

 // Separator between Year, Days, Hour, Mins portions
 const SEP = ' ';

 //
 // How all ydhm text will be styled...
 //   .ydhm-base  — all ydhm span tags
 //   .ydhm-lt-1h — tags where ms_diffValue <  1h
 //   .ydhm-lt-1d — tags where ms_diffValue <  1d
 //   .ydhm-ge-1d — tags where ms_diffValue >= 1d
 //
 const style = document.createElement('style');
 style.textContent = `
  .ydhm-base {
   border-radius:    8px;
   padding:          0.1em 0.25em;
   color:            Black;
   font-weight:      Normal;
  }
  .ydhm-lt-1h {
   padding:          0.1em 1em;
   background-color: Red;
   font-weight:      Bold;
  }
  .ydhm-lt-1d {
   background-color: Yellow;
   font-weight:      Bold;
  }
  .ydhm-ge-1d {
   background-color: DarkGreen;
   color:            White;
  }
 `;
 document.head.appendChild(style);
 // 🔚 of User Preferences.


 // Convert e.g. "Aug 13, 2025 1:23 PM" → "1d 6h 19m"
 function formatYDHM(dateString) {
  const ago = new Date(dateString); if (isNaN(ago)) return null; // skip unparsable dates
  const now = new Date();

  let ms_diff_calc = now - ago; // in ms & positive if it's in the past — decremented after each calculation
  let ms_diffValue = ms_diff_calc; // preserved for range testing at the bottom

  const MS_MINS = 1000 * 60;
  const MS_HOUR = MS_MINS * 60;
  const MS_DAYS = MS_HOUR * 24;
  const MS_YEAR = MS_DAYS * 365;

  const year = Math.floor(ms_diff_calc / MS_YEAR); ms_diff_calc %= MS_YEAR;
  const days = Math.floor(ms_diff_calc / MS_DAYS); ms_diff_calc %= MS_DAYS;
  const hour = Math.floor(ms_diff_calc / MS_HOUR); ms_diff_calc %= MS_HOUR;
  const mins = Math.floor(ms_diff_calc / MS_MINS);

  // Format the Year portion to be the value (year) + the string 'y' + SEP, but omit if year is 0
  let portionYear = year + 'y' + SEP; if ( year == 0 ) { portionYear = ''; }
  // Format the Days portion to be the value (days) + the string 'd' + SEP, but omit if days is 0
  let portionDays = days + 'd' + SEP; if ( days == 0 ) { portionDays = ''; }
  // Format the Hour portion to be the value (hour) + the string 'h' + SEP, but omit if hour is 0
  let portionHour = hour + 'h' + SEP; if ( hour == 0 ) { portionHour = ''; }
  // Format the Mins portion to be the value (mins) + the string 'm', and this portion is never omitted
  let portionMins = mins + 'm';

  let ydhm = portionYear + portionDays + portionHour + portionMins;
  if ( ms_diffValue <= MS_HOUR ) {
   ydhm = '<span class="ydhm-base ydhm-lt-1h">' + ydhm + '</span>'
  } else if ( ms_diffValue <= MS_DAYS ) {
   ydhm = '<span class="ydhm-base ydhm-lt-1d">' + ydhm + '</span>'
  } else {
   ydhm = '<span class="ydhm-base ydhm-ge-1d">' + ydhm + '</span>'
  }

  return ydhm;
 }

 function isShortDate(txt) { return /^\d{2}\/\d{2}\/\d{2}$/.test(txt); }

 function updateAllTimes() {
  document
   .querySelectorAll('td time[title], td span[title], td abbr[title]')
   .forEach(el => {
    // If origTime is unset, do these things only once
    if ( !el.dataset.origTime ) {
     const txt = el.textContent.trim();
     // Skip if txt isn’t a valid “short date”
     if ( !isShortDate(txt) ) return;
     // Initialize origTime to the value from the title
     el.dataset.origTime = el.getAttribute('title');
    }

    // Recalculate ydhm
    const ydhm = formatYDHM(el.dataset.origTime);
    if (ydhm) { el.innerHTML = ydhm; }
  });
 }

 // 1) Initial render
 updateAllTimes();

 // 2) Refresh every minute
 setInterval(updateAllTimes, 60 * 1000);

 // 3) Watch for new/removed nodes
 new MutationObserver(mutations => {
  mutations.forEach(m => {
   m.addedNodes.forEach(node => {
    // if a new cell with a title appears, force an update
    if (
     node.nodeType === Node.ELEMENT_NODE &&
     (
      node.matches('td time[title], td span[title], td abbr[title]') ||
      node.querySelector('time[title], span[title], abbr[title]')
     )
    ) { updateAllTimes(); }
   });
  });
 }).observe(document.body, {
  childList: true,
    subtree: true
 });

})();