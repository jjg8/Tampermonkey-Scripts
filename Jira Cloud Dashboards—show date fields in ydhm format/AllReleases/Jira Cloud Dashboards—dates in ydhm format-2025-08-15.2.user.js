// ==UserScript==
// @name         Jira Cloud Dashboards—dates in ydhm format
// @namespace    http://tampermonkey.net/
// @version      2025-08-15.2
// @description  From fields displaying only date (e.g. 08/13/25), get date/time from its tooltip title (e.g. Aug 13, 2025 1:23 PM) and output in ydhm format (e.g. 1d 6h 19m)
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
// - Feel free to customize it to your heart's content.
//

(function() {
 'use strict';

 // Convert e.g. "Aug 13, 2025 1:23 PM" → "1d 6h 19m"
 function formatYDHM(dateString) {
  const ago = new Date(dateString); if (isNaN(ago)) return null; // skip unparsable dates
  const now = new Date();
   let diff = now - ago; // positive if it's in the past

  const SEP = ' '; // separator between Year, Days, Hour, Mins portions ⬅️ change to suit your preference

  const MS_MINS = 1000 * 60;
  const MS_HOUR = MS_MINS * 60;
  const MS_DAYS = MS_HOUR * 24;
  const MS_YEAR = MS_DAYS * 365;

  const year = Math.floor(diff / MS_YEAR); diff %= MS_YEAR;
  const days = Math.floor(diff / MS_DAYS); diff %= MS_DAYS;
  const hour = Math.floor(diff / MS_HOUR); diff %= MS_HOUR;
  const mins = Math.floor(diff / MS_MINS);

  // Format the Year portion to be the value (year) + the string 'y' + SEP, but omit if year is 0
  let portionYear = year + 'y' + SEP; if (year == 0) { portionYear = ''; }
  // Format the Days portion to be the value (days) + the string 'd' + SEP, but omit if days is 0
  let portionDays = days + 'd' + SEP; if (days == 0) { portionDays = ''; }
  // Format the Hour portion to be the value (hour) + the string 'h' + SEP, but omit if hour is 0
  let portionHour = hour + 'h' + SEP; if (hour == 0) { portionHour = ''; }
  // Format the Mins portion to be the value (mins) + the string 'm', and this portion is never omitted
  let portionMins = mins + 'm';

  return portionYear + portionDays + portionHour + portionMins;
 }

 function isShortDate(txt) { return /^\d{2}\/\d{2}\/\d{2}$/.test(txt); }

 function updateAllTimes() {
  document
   .querySelectorAll('td time[title], td span[title], td abbr[title]')
   .forEach(el => {
    // If origTime is unset, do these things only once
    if (!el.dataset.origTime) {
     const txt = el.textContent.trim();
     // Skip if txt isn’t a valid “short date”
     if (!isShortDate(txt)) return;
     // Initialize origTime to the value from the title
     el.dataset.origTime = el.getAttribute('title');
    }

    // Recalculate dhm
    const ydhm = formatYDHM(el.dataset.origTime);
    if (ydhm) el.textContent = ydhm;
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
     (node.matches('td time[title], td span[title], td abbr[title]') ||
      node.querySelector('time[title], span[title], abbr[title]'))
    ) {
     updateAllTimes();
    }
   });
  });
 }).observe(document.body, {
  childList: true,
    subtree: true
 });

})();