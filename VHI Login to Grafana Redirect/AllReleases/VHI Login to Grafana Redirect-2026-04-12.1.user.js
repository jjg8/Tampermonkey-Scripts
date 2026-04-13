// ==UserScript==
// @name         VHI Login to Grafana Redirect
// @namespace    http://tampermonkey.net/
// @version      2026-04-12.1
// @description  After detecting successful VHI login, it redirects to the TargetUrl Grafana dashboard
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/VHI%20Login%20to%20Grafana%20Redirect
// @match        https://vhi.EXAMPLE.COM:8888/login
// @grant        none
// ==/UserScript==
//
// Update the @match line above to be your organization's VHI login page.
// Update the TargetURL below to be the full URL to the specific Grafana dashboard you want.
//   This will be the same as the @match URL with /login replaced with /grafana/d/EXAMPLE_PATH?orgId=1&refresh=1m
//

(function () {
    'use strict';

    const TargetUrl = 'https://vhi.EXAMPLE.COM:8888/grafana/d/EXAMPLE_PATH?orgId=1&refresh=1m';
    const LoginPath = '/login';

    // If we're not on the login page, we're already authenticated — redirect
    if (!window.location.pathname.startsWith(LoginPath)) {
        return;
    }

    // Watch for navigation away from the login page (indicates successful login)
    const Observer = new MutationObserver(() => {
        if (!window.location.pathname.startsWith(LoginPath)) {
            Observer.disconnect();
            window.location.href = TargetUrl;
        }
    });

    Observer.observe(document.body, { childList: true, subtree: true });
})();