// ==UserScript==
// @name         Post-login Redirect
// @namespace    http://tampermonkey.net/
// @version      2026-04-11.1
// @description  After detecting successful website login, it redirects to the TargetURL
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Post-login%20Redirect
// @match        https://EXAMPLE.COM/login
// @grant        none
// ==/UserScript==
//
// Update @match lines above and TargetURL below to match your environment.
// All URLs in the @match lines and in the TargetURL must be the full URLs.
//

(function () {
    'use strict';

    const TargetURL = 'https://EXAMPLE.COM/EXAMPLE-PATH';
    const LoginPath = '/login';

    // If we're not on the login page, we're already authenticated — redirect
    if (!window.location.pathname.startsWith(LoginPath)) {
        return;
    }

    // Watch for navigation away from the login page (indicates successful login)
    const Observer = new MutationObserver(() => {
        if (!window.location.pathname.startsWith(LoginPath)) {
            Observer.disconnect();
            window.location.href = TargetURL;
        }
    });

    Observer.observe(document.body, { childList: true, subtree: true });
})();