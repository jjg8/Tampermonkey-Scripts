// ==UserScript==
// @name         Reload on Error
// @namespace    http://tampermonkey.net/
// @version      2026-05-08.1
// @description  Reloads to a specific page if the URL changes or a server error is detected after a delay
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Reload%20on%20Error
// @match        https://example.com // CONFIGURATION REQUIRED HERE BEFORE USE.
// @grant        none
// ==/UserScript==
//
// CONFIGURATION REQUIRED BEFORE USE...
//  • To match your environment, update above the @match line and below the CONFIGURATION VARIABLES...
//    • The @match line should be the base domain or root page, so it matches any page, including errors, that it might load.
//    • expectedPage — The full URL you expect to remain loaded in the browser tab.
//    • reloadToPage — The full URL to reload to if the expectedPage is no longer showing or an error message is displayed.
//    • reloadWaitMs — Before reloading, always wait this many milliseconds before attempting reload.
//      • This should be a realistic timeout period to prevent reloads hammering the server too often.
//    • errorKeywords — An array of keywords/phrases in the page body indicating an error.
//    • errorTitles — An array of keywords/phrases in the page title indicating an error.
//    • For errorKeywords and errorTitles, not all bases are covered here, so you'll need to customize them to the actual error messages.
//  • If you need to have multiple @match lines, it's best to load multiple versions of this script into Tampermonkey, and if so...
//    • Change the @name line slightly to create a unique name, for example...
//      • Reload on Error (site1.example.com)
//      • Reload on Error (site2.example.com)
//

(function() {
    'use strict';


    ////// CONFIGURATION VARIABLES \\\\\
    const expectedPage = "https://example.com/expected-page";
    const reloadToPage = "https://example.com/reload-page";
    const reloadWaitMs = 1 * 60 * 1000; // 1 minute
    //----------------------------------
    //----------------------------------
    // An array of keywords/phrases in the page body indicating an error...
    const errorKeywords = [
        "DB not connected",
        "database connection configuration",
        "DB Error",
        "Error connecting to database",
        "Connection refused"
    ];
    //----------------------------------
    //----------------------------------
    // An array of keywords/phrases in the page title indicating an error...
    const errorTitles = [
        "Page not found", 
        "Internal Server Error", 
        "Service Unavailable", 
        "404 Not Found", 
        "502 Bad Gateway"
    ];
    //----------------------------------
    //////////////////\\\\\\\\\\\\\\\\\\


    const currentPage = window.location.href;


    /////
    // Check if the page is a standard browser/server error page...
    //  • This detects common title-based errors, as well as specific text in the page body.
    ////
    function isAnErrorPage() {
        // 1. Check for URL mismatch...
        if (currentPage !== expectedPage) return true;

        // 2. Check for common Web Server error titles...
        if (errorTitles.some(title => document.title.includes(title))) return true;

        // 3. Check for specific error text in the body...
        const pageText = document.body ? document.body.innerText : "";
        if (errorKeywords.some(msg => pageText.includes(msg))) return true;

        return false;
    }


    // Execute the reload logic...
    function triggerReload() {
        console.log(`Condition met. Reloading to ${reloadToPage} in ${reloadWaitMs}ms...`);
        setTimeout(() => {
            window.location.replace(reloadToPage);
        }, reloadWaitMs);
    }


    // If currentPage doesn't match expectedPage OR an error page loads in its place...
    if (currentPage !== expectedPage || isAnErrorPage()) {
        triggerReload();
    }

})();
