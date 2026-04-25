// ==UserScript==
// @name         Sling Weekly Reload
// @namespace    http://tampermonkey.net/
// @version      2026-04-24.1
// @description  Strips the &date=YYYY-MM-DD parameter from the URL if it's before today & reloads the URL
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Sling%20Weekly%20Reload
// @match        https://app.getsling.com/shifts?*
// @grant        none
// @run-at       document-start
// ==/UserScript==
//
// This is especially useful on a kiosk display where Sling is configured to display as...
//  https://app.getsling.com/shifts?authorized=existing_account&mode=week&tab=fullschedule
// Once that page loads, Sling automatically tacks on the &date=YYYY-MM-DD parameter.
// When it does, it locks that page forever on that week, which is bad for a kiosk display.
//

(function() {
    'use strict';

    function refreshIfStale() {
        const urlLoaded = new URL(window.location.href);
        const urlParams = urlLoaded.searchParams;
        const urlDateStr = urlParams.get('date');

        if (urlDateStr) {
            const urlDate = new Date(urlDateStr + 'T00:00:00');
            const nowDate = new Date();
            nowDate.setHours(0, 0, 0, 0);

            // If the date in the URL is before today...
            if (urlDate < nowDate) {
                console.log("Stale date detected in URL. Stripping date parameter...");

                // Remove only the date parameter...
                urlParams.delete('date');

                // Construct the new URL with remaining params...
                const urlCleaned = urlLoaded.origin + urlLoaded.pathname + '?' + urlParams.toString();

                window.location.href = urlCleaned;
            }
        }
    }

    // Check on initial load...
    refreshIfStale();

    // Check every 5 minutes (for overnight kiosk persistence)...
    setInterval(refreshIfStale, 300000);
})();