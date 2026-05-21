// ==UserScript==
// @name         Scroll to End
// @namespace    http://tampermonkey.net/
// @version      2026-05-20.1
// @description  Scrolls to the bottom of the page once fully loaded
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Scroll%20to%20End
// @match        https://example.com   //*CONFIGURATION REQUIRED*//
// @match        https://example.com/* //*HERE BEFORE FIRST USE**//
// @grant        none
// ==/UserScript==
//

(function() {
    'use strict';

    window.addEventListener('load', () => {
        // Use a small timeout to ensure the DOM is ready for the scroll command...
        setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
        }, 1000);
    });
})();