// ==UserScript==
// @name         Reload on Error
// @namespace    http://tampermonkey.net/
// @version      2026-05-08.2.1
// @description  Reloads to a specific page if the URL changes or a server error is detected after a delay
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Reload%20on%20Error
// @match        https://service1.example.com   //*CONFIGURATION*//
// @match        https://service1.example.com/* //****REQUIRED***//
// @match        https://service2.example.com   //******HERE*****//
// @match        https://service2.example.com/* //*****BEFORE****//
// @exclude      https://login.*                //*****FIRST*****//
// @exclude      https://login.*/*              //******USE******//
// @exclude      https://*/*login*              //!!!!!!!!!!!!!!!//
// @grant        none
// ==/UserScript==
//
// This script is useful for unattended or kiosk displays that need to keep functioning & displaying content, despite transient errors. However,
// choosing an aggressive reload strategy, such as reloading on permanent errors, too many retries, or too low of a timeout between reloads, can
// lead to dire consequences, so choose wisely.
//
// This script can be modified to apply to a single service or to many services. For example, at work we have 3 kiosk PCs each with 3 different
// services, so to avoid having to create 9 different copies of this script, I just update all of the @match & @exclude lines above and the arrays
// below for all of the services.
//
// *************************************
// * CONFIGURATION REQUIRED BEFORE USE *
// *************************************
//  • To match your environment, update above the @match & @exclude lines and below the CONFIGURATION VARIABLES...
//    • The @match lines above should be the base domain or root page, so it matches any page, including errors, that it might load...
//      • You may need multiple @match lines if they're different enough, for example...
//          @match https://app.example.com
//          @match https://login.example.com
//      • Or if you can safely use a wildcard...
//          @match https://*.example.com
//      • Most websites will append / after the domain, so https://example.com/* will cover most bases, but you might need these for some...
//          @match https://example.com
//          @match https://example.com/*
//        • Repeat the domain & domain/* pattern for each variation of the sub-domain(s) as necessary.
//    • The @exclude lines above should match any sub-domain or page that shouldn't be reloaded constantly, for example...
//      • This is especially true when any page it redirects to requires manual intervention before your expected page can be loaded again, such as...
//          @exclude https://login.example.com
//          @exclude https://login.example.com/*
//          @exclude https://example.com/login.php
//          @exclude https://example.com/login.php?*
//    • CONFIGURATION VARIABLES below...
//      • There are 4 arrays to complete.
//      • For SERVICE_CONFIGS and SERVICE_CONFIGS, the elements are...
//        • enableConfig — Set this to true to monitor this item or false to ignore it.
//          • If this is not a strict true or false value, it defaults to false.
//        • expectedPage — The full URL you expect to remain loaded in the browser tab, for example...
//            const expectedPage = "https://example.com/expected-page";
//        • matchingType — Set to 1 if the current page must start with the expected page, 2 for ends with, and anything else (e.g. 0) to match exactly.
//          • For instance, an expected page may not remain static over time; one service I know always appends &date=YYYY-MM-DD and if so, set to 1.
//        • reloadToPage — The full URL to reload to if the expected page is no longer showing or an error message is displayed.
//          • This can be the same as the expected page or different as needed.
//        • reloadWaitMs — Before reloading, always wait this many milliseconds before attempting reload.
//          • This should be a realistic timeout period to prevent reloads hammering the server too often.
//          • Also, make extra sure your @exclude lines above exclude any login or other page that requires manual intervention, so they're not reloaded.
//          • You can do math for readability, for example, the default is...
//              const reloadWaitMs = 10 * 60 * 1000; // 10 minutes
//          • This must be an integer >=0 and if not, it will automatically default to 10 minutes.
//          • If you set this to a very low value (e.g. <=60000 or 1 minute), I HIGHLY recommend you set a reloadExtent >0 and make sure it's a low value.
//        • reloadExtent — Set to >0 to limit the number of reloads before giving up and anything else (e.g. 0) for unlimited.
//          • You may need this to avoid reload loops leading to IP banishment, lockouts, overloading, exceeding network limits, & other undesired behavior.
//      • errorBodyMessages — A case-insensitive array of keywords/phrases in the page BODY indicating an error.
//      • errorTitleMessages — A case-insensitive array of keywords/phrases in the page TITLE indicating an error.
//      • For errorBodyMessages & errorTitleMessages, not all bases are covered here, so you'll need to customize them to the actual error messages.
//

(function() {
    'use strict';


    ////////////////////////////////////
    ////// CONFIGURATION VARIABLES /////
    ////////////////////////////////////
    //----------------------------------
    /////
    // All services you want to monitor for errors...
    //  • You can limit this to just one service, or you can specify multiple services, and even multiple services for multiple hosts.
    //  • Each primary key here represents the unique URL (or partial URL) of the page being monitored.
    //  • Each primary key is meant to be unique.
    //  • If more than one primary keys are identical, only the last definition will apply.
    /////
    const SERVICE_CONFIGS = {
        "https://monitor.example.com/dashboard1": {
            enableConfig: true,
            expectedPage: "https://monitor.example.com/dashboard1",
            matchingType: 0, 
            reloadToPage: "https://monitor.example.com/dashboard1",
            reloadWaitMs: 5 * 60 * 1000,
            reloadExtent: 0 
        },
        "https://monitor.example.com/dashboard2": {
            enableConfig: true,
            expectedPage: "https://monitor.example.com/dashboard2",
            matchingType: 0, 
            reloadToPage: "https://monitor.example.com/dashboard2",
            reloadWaitMs: 2 * 60 * 1000,
            reloadExtent: 0
        },
        "https://app.example.com/expected-page": {
            enableConfig: true,
            expectedPage: "https://app.example.com/expected-page",
            matchingType: 1,
            reloadToPage: "https://app.example.com/reload-page",
            reloadWaitMs: 10 * 60 * 1000,
            reloadExtent: 10
        }
    };
    //----------------------------------
    //----------------------------------
    /////
    // Default fallback if none of the SERVICE_CONFIGS above match...
    //  • If you wish to disable this DEFAULT_CONFIG to rely solely on SERVICE_CONFIGS, set enableConfig: false;
    /////
    const DEFAULT_CONFIG = {
        enableConfig: true,
        expectedPage: window.location.href,
        matchingType: 0,
        reloadToPage: window.location.href,
        reloadWaitMs: 10 * 60 * 1000,
        reloadExtent: 10
    };
    //----------------------------------
    //----------------------------------
    /////
    // A case-insensitive array of keywords/phrases found in the page BODY indicating an error...
    //  • The following examples are not an exhaustive list and should be customized for your environment.
    //  • Many services use custom error messages in the page BODY, such as "DB Error", so you'll need to discover those.
    /////
    const errorBodyMessages = [
        "DB not connected",
        "database connection configuration",
        "DB Error",
        "Error connecting to database",
        "Connection refused"
    ].map(t => t.toLowerCase());
    //----------------------------------
    //----------------------------------
    /////
    // A case-insensitive array of keywords/phrases found in the page TITLE indicating an error...
    //  • The following examples are not an exhaustive list and should be customized for your environment.
    //  • Some error codes should never trigger reloads, so don't include every possible one.
    //    • Here are some examples you should never reload...
    //        301, 302, 305, 307, 308, 410, 414, 440, 449, 450, 498, 499, 508, 509, 511, 561, 999
    //    • WARNINGS...
    //      • If you get into a reload loop on certain errors that will never change, you could get your IP address banned.
    //      • You could even trigger an account lockout, or other undesired consequences, under certain conditions.
    //  • Some error codes may require you to update your expectedPage (e.g. 301, 307, or 308).
    //  • Many of the default error codes below may just be temporary errors when a service goes down, or if it's still in the process of restarting.
    //  • See https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
    /////
    const errorTitleMessages = [
        "204 No Content",
        "400 Bad Request",
        "401 Unauthorized",
        "403 Forbidden",
        "404 Not Found",
        "Page not found",
        "407 Proxy Authentication Required",
        "408 Request Timeout",
        "444 No Response",                          // nginx
        "429 Too Many Requests",
        "500 Internal Server Error",
        "502 Bad Gateway",
        "503 Service Unavailable",
        "504 Gateway Timeout",
        "520 Web Server Returned an Unknown Error", // Cloudflare
        "521 Web Server Is Down",                   // Cloudflare
        "522 Connection Timed Out",                 // Cloudflare
        "523 Origin Is Unreachable",                // Cloudflare
        "524 A Timeout Occurred",                   // Cloudflare
        "530 Origin Unavailable"                    // Cloudflare
    ].map(t => t.toLowerCase());
    //----------------------------------
    ////////////////////////////////////
    // End of CONFIGURATION VARIABLES //
    ////////////////////////////////////


    // Validation: Ensures configuration values are sensible and not nonsense...
    function validateConfig(cfg) {
        // Guard against an entirely missing or null configuration object...
        if (!cfg || typeof cfg !== 'object') return null;

        // Check for specific 'nonsense' on required strings...
        const isStringValid = (str) => typeof str === 'string' && str.trim().length > 0;

        // If the core URLs are nonsense, this config entry is unusable...
        if (!isStringValid(cfg.expectedPage) || !isStringValid(cfg.reloadToPage)) {
            console.error(`[${scriptName}] Configuration contains empty or missing URLs. Disabling.`);
            return null;
        }

        // Ensure numeric values are actually numbers...
        const checkReloadWaitMs = (typeof cfg.reloadWaitMs === 'number' && cfg.reloadWaitMs >= 0)
            ? cfg.reloadWaitMs
            : 10 * 60 * 1000; // Default to 10 minutes.

        const checkReloadExtent = (typeof cfg.reloadExtent === 'number' && cfg.reloadExtent >= 0)
            ? cfg.reloadExtent 
            : 0; // Default to unlimited.

        // If it gets this far, return a clean, sanitized object...
        return {
            enableConfig: cfg.enableConfig === true,
            expectedPage: cfg.expectedPage.trim(),
            matchingType: parseInt(cfg.matchingType) || 0,
            reloadToPage: cfg.reloadToPage.trim(),
            reloadWaitMs: checkReloadWaitMs,
            reloadExtent: checkReloadExtent
        };
    }


    // Selection: Find the first config key that is contained within the current URL...
    const currentPage = window.location.href.toLowerCase();
    let selectedConfig = DEFAULT_CONFIG;
    for (const key in SERVICE_CONFIGS) {
        if (currentPage.includes(key.toLowerCase())) {
            selectedConfig = SERVICE_CONFIGS[key];
            break; // Stop once it finds the specific entry match.
        }
    }
    const activeConfig = validateConfig(selectedConfig);
    if (!activeConfig || activeConfig.enableConfig !== true) {
        return;
    }
    const expectedPage = activeConfig.expectedPage;
    const matchingType = activeConfig.matchingType;
    const reloadToPage = activeConfig.reloadToPage;
    const reloadWaitMs = activeConfig.reloadWaitMs;
    const reloadExtent = activeConfig.reloadExtent;


    const expectedLower = expectedPage.toLowerCase();
    const scriptName = GM_info.script.name;


    /////
    // Check if the page is a standard browser/server error page...
    //  • This detects common title-based errors, as well as specific text in the page body.
    ////
    function isAnError() {
        /////
        // 1. Check for a URL mismatch...
        //   • matchingType of 1=starts with, 2=ends with, and any anything else (e.g. 0)=matches exactly the expectedPage.
        /////
        if (matchingType == 1) {
            if (!currentPage.startsWith(expectedLower)) return true;
        } else if (matchingType == 2) {
            if (!currentPage.endsWith(expectedLower)) return true;
        } else {
            if (currentPage !== expectedLower) return true;
        }

        // 2. Check for common Web Server error titles...
        if (errorTitleMessages.some(title => document.title.toLowerCase().includes(title))) return true;

        // 3. Check for specific error text in the body...
        const pageText = document.body ? document.body.innerText : "";
        if (errorBodyMessages.some(msg => pageText.toLowerCase().includes(msg))) return true;

        return false;
    }


    // Do the reload attempt...
    function triggerReload() {
        // If reloadExtent is >0, limit the number of reload attempts...
        let attempts = `unlimited attempts`;
        if (reloadExtent > 0) {
            // Get the current reload count...
            const storageKey = 'reloadCount_' + expectedPage.replace(/[^A-Za-z0-9]/gi, '_'); // Unique key per expected page
            let currentCount = parseInt(sessionStorage.getItem(storageKey)) || 0;
            // If the current reload count exceeds the limit, stop here...
            if (currentCount >= reloadExtent) {
                console.error(`[${scriptName}] Maximum reload attempts (${reloadExtent}) reached. Stopping.`);
                return; 
            }
            // Otherwise, increment the current count and proceed...
            currentCount++;
            sessionStorage.setItem(storageKey, currentCount);
            attempts = `attempt ${currentCount} of ${reloadExtent}`;
        }

        console.warn(`[${scriptName}] Error condition met; reloading to ${reloadToPage} in ${reloadWaitMs}ms for ${attempts}.`);

        // Do the reload after the wait time...
        setTimeout(() => {
            window.location.replace(reloadToPage);
        }, reloadWaitMs);
    }


    // If currentPage doesn't match expectedPage OR an error page loads in its place...
    if (isAnError()) {
        triggerReload();

    // Else if NOT in an error state, reset the counter...
    } else {
        const storageKey = 'reloadCount_' + expectedPage.replace(/[^A-Za-z0-9]/gi, '_');
        if (sessionStorage.getItem(storageKey)) {
            sessionStorage.removeItem(storageKey);
        }
        console.log(`[${scriptName}] Reset the reload counter.`);
    }

})();
