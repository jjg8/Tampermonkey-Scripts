// ==UserScript==
// @name         Post-login Redirect
// @namespace    http://tampermonkey.net/
// @version      2026-04-23.1.2
// @description  After detecting successful login in any browser window, redirects each window to its own URL, supporting 1 or more TargetURLs
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Post-login%20Redirect
// @match        https://EXAMPLE.COM/LOGIN      // CONFIGURATION REQUIRED
// @match        https://EXAMPLE.COM/LOGIN?*    //    HERE BEFORE USE.
// @grant        none
// ==/UserScript==
//
// CONFIGURATION REQUIRED BEFORE USE...
//  • To match your environment, update above the @match lines and below the TargetURLs and LoginPath variables.
//  • I recommend you keep both @match lines, being your base URL/login and your base URL/login?*.
//  • All URLs should be the full URLs.
//  • TargetURLs, at minimum, must have one URL defined in slot '0'.
//  • Add entries starting with '1' to support additional URLs/windows.
//
// If 1 or more browser windows/tabs match the @match URLs, each is assigned a slot number, starting with 0.
// Matching browser windows are assigned slots in the order they load (determined by when each window loads the login page).
// Login can be performed in any window, and then all windows (with a slot#) will automatically redirect to their assigned Target URL.
//

(function () {
    'use strict';



    // CONFIGURATION REQUIRED HERE BEFORE USE...
    const TargetURLs = {
        '0': 'https://EXAMPLE.COM/YOUR-1ST-EXAMPLE-PATH',
        //'1': 'https://EXAMPLE.COM/YOUR-2ND-EXAMPLE-PATH',
        //'2': 'https://EXAMPLE.COM/YOUR-3RD-EXAMPLE-PATH',
        //etc.
    };
    // Match the path portion of the @match URL; DON'T include protocol://domain or any portion after & including ?, but it must include the initial /.
    // E.g. '/login'
    const LoginPath = '/login';



    const StorageKey = 'page_logged_in';
    const SlotCountKey = 'page_slot_count';
    const SlotTimeKey = 'page_slot_time';
    const SlotTimeoutMs = 2 * 60 * 1000; // Reset slot counter if >2 minutes since last window loaded.

    // Clear any stale login flag from a previous session...
    localStorage.removeItem(StorageKey);

    // If not on the login page, already authenticated — nothing to do...
    if (!window.location.pathname.startsWith(LoginPath)) {
        return;
    }

    // Reset slot counter if this appears to be a fresh launch...
    const lastSlotTime = parseInt(localStorage.getItem(SlotTimeKey) || '0');
    if (Date.now() - lastSlotTime > SlotTimeoutMs) {
        localStorage.setItem(SlotCountKey, '0');
    }

    // Claim the next available slot...
    const mySlot = parseInt(localStorage.getItem(SlotCountKey) || '0');
    localStorage.setItem(SlotCountKey, String(mySlot + 1));
    localStorage.setItem(SlotTimeKey, String(Date.now()));

    const myTargetURL = TargetURLs[String(mySlot)];

    // Only proceed if this window has an assigned TargetURL...
    if (!myTargetURL) {
        console.warn('[Post-login Redirect] No TargetURL assigned for slot', mySlot, '— ignoring.');
        return;
    }

    // All windows watch for login occurring in their own window...
    const Observer = new MutationObserver(() => {
        if (!window.location.pathname.startsWith(LoginPath)) {
            Observer.disconnect();
            // Signal all other windows that login has succeeded...
            localStorage.setItem(StorageKey, Date.now());
            // After a 2s delay, redirect this window to its assigned TargetURL...
            setTimeout(function() {
                window.location.href = myTargetURL;
            }, SlotTimeoutMs);
        }
    });
    Observer.observe(document.body, { childList: true, subtree: true });

    // All windows listen for another window to have logged in...
    window.addEventListener('storage', (e) => {
        if (e.key === StorageKey) {
            Observer.disconnect();
            // Redirect this window to its assigned TargetURL...
            window.location.href = myTargetURL;
        }
    });

})();
