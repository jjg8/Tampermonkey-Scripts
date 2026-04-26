// ==UserScript==
// @name         Superimpose
// @namespace    http://tampermonkey.net/
// @version      2026-04-25.1
// @description  Superimpose another web page at fixed coordinates & size with custom background color/transparency
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Superimpose
// @match        https://embed.windy.com/embed2.html
// @match        https://embed.windy.com/embed2.html?*
// @grant        none
// ==/UserScript==
//
// Update the @match line above to match the original page you want your new URL superimposed over.
// Use multiple @match lines if necessary.
// Update the values in the CONFIGURATION VARIABLES section below to customize your superimposed layers.
//

(function() {
    'use strict';

    ///// —1— CONFIGURATION VARIABLES \\\\\
    //-------------------------------------
    // (A) fgDiv Foreground Content Layer...
    // [[[ This layer is the web page content you want superimposed over the original page. ]]]
    //  • Web page you want superimposed & reload times:
    //    • fgURLp — The full URL for the web page you want superimposed.
    //    • fgURLh — Reload the URL every h hours.
    //      • To disable periodic reloads, set fgURLh to any value <1.
    //    • fgURLm — Reload only on minute m of the hour (0 to 59).
    //      • To reload on a specific minute of the hour, set fgURLm to a specific minute in the range 0-59.
    //      • To reload on the same minute this script activated, set fgURLm outside the range 0-59 (e.g. -1).
    //    • For example, to reload once an hour on the hour...
    //        fgURLh = 1;
    //        fgURLm = 0;
    const fgURLp = 'https://wttr.in?1&n&u&F&Q';
    const fgURLh = 1;
    const fgURLm = 0;
    //  • Layer position coordinates:
    //    • fgDivX — Horizontal position (px).
    //    • fgDivY — Vertical position (px).
    //    • fgDivZ — Z-Index layer to ensure it's superimposed over the original page.
    //      • The Background Contrast Layer will use fgDivZ-1.
    const fgDivX = 5;
    const fgDivY = 5;
    const fgDivZ = 9999;
    //  • Layer size:
    //    • fgDivW — Width (px).
    //    • fgDivH — Height (px).
    const fgDivW = 458;
    const fgDivH = 232;
    //  • Layer mouse pointer interactivity:
    //    • fgDivP — set to 'none' to interact with the original page or 'auto' with this page.
    const fgDivP = 'none';
    //-------------------------------------
    //-------------------------------------
    // (B) bgDiv Background Contrast Layer...
    // [[[ This layer is static and provides a contrast between the original page & fgDiv. ]]]
    //  • Layer position offsets:
    //    • Useful if fgURLp has a wide margin or padding you'd like to offset.
    //    • bgDivOffsetX — adjust this layer left (negative), none (0), or right (positive) from fgDiv.
    //    • bgDivOffsetY — adjust this layer higher (negative), none (0), or lower (positive) from fgDiv.
    const bgDivOffsetX = 10;
    const bgDivOffsetY = 4;
    //  • Layer size offsets:
    //    • Adjust this layer smaller (negative), none (0), or larger (positive) than fgDiv.
    //    • fgOffsetW — Width (px).
    //    • fgOffsetH — Height (px).
    const bgDivOffsetW = -9;
    const bgDivOffsetH = 0;
    //  • Layer background color & opacity:
    //    • bgDivColor_R — The Red portion of the RGB background color (0 to 255).
    //    • bgDivColor_G — The Green portion of the RGB background color (0 to 255).
    //    • bgDivColor_B — The Blue portion of the RGB background color (0 to 255).
    //    • bgDivOpacity — How dark you want the custom background (0.0 to 1.0) over the background page.
    //      • 0.0 = 0% opaque = 100% transparent ││ 1.0 = 100% opaque = 0% transparent.
    const bgDivColor_R = 0;
    const bgDivColor_G = 0;
    const bgDivColor_B = 0;
    const bgDivOpacity = 0.5;
    //  • Layer border radius:
    //    • bgDivBRadius — How round (>0) or not (0) you want the outer corners (px).
    const bgDivBRadius = 8;
    //-------------------------------------
    //-------------------------------------
    // (C) SVG Filter...
    // [[[ This layer transforms the text from fgURLp to make it bolder. ]]]
    //  • Layer boldness...
    //    • svgRadius — How intense you want the bolding effect (0.0 to 1.0).
    const svgRadius = 0.4;
    //-------------------------------------
    //-------------------------------------
    // (D) IFrame Container...
    //  • Container brightness:
    //    • iframeBrightness — How much to brighten the fgDiv contents from none (0.0) to more (>0.0).
    const iframeBrightness = 1.2;
    //-------------------------------------
    ///////////////////\\\\\\\\\\\\\\\\\\\\

    // —2— (C) Create the SVG Filter and inject it into the page...
    const svg_NS = "http://www.w3.org/2000/svg";
    const svgObj = document.createElementNS(svg_NS, "svg");
    svgObj.style.display = 'none';
    svgObj.innerHTML = `
        <filter id="Superimpose-bold-filter" filterUnits="userSpaceOnUse">
            <feMorphology operator="dilate" radius="${svgRadius}" in="SourceGraphic" result="thickened" />
            <feComponentTransfer in="thickened">
                <feFuncA type="discrete" tableValues="0 0 0 1 1 1" />
            </feComponentTransfer>
        </filter>`;
    document.body.appendChild(svgObj);

    // —3— (B) Create the bgDiv Background Contrast Layer...
    const bgLayer = document.createElement('div');
    bgLayer.id = 'tm-overlay-bg';
    Object.assign(bgLayer.style, {
        position: 'fixed',
        left: `${fgDivX + bgDivOffsetX}px`,
        top: `${fgDivY + bgDivOffsetY}px`,
        zIndex: fgDivZ - 1, // Exactly 1 layer behind fgDiv
        width: `${fgDivW + bgDivOffsetW}px`,
        height: `${fgDivH + bgDivOffsetH}px`,
        backgroundColor: `rgba(${bgDivColor_R}, ${bgDivColor_G}, ${bgDivColor_B}, ${bgDivOpacity})`,
        borderRadius: `${bgDivBRadius}px`,
        pointerEvents: 'none'
    });
    document.body.appendChild(bgLayer);

    // —3— (A) Create the fgDiv Foreground Content Layer...
    const fgLayer = document.createElement('div');
    fgLayer.id = 'tm-overlay-container';
    Object.assign(fgLayer.style, {
        position: 'fixed',
        left: `${fgDivX}px`,
        top: `${fgDivY}px`,
        zIndex: fgDivZ,
        width: `${fgDivW}px`,
        height: `${fgDivH}px`,
        overflow: 'hidden',
        backgroundColor: 'transparent',
        pointerEvents: `${fgDivP}`,
        mixBlendMode: 'screen' // This makes fgURLp's background vanish
    });

    // —4— (D) Create an iframe to contain it all over the original page...
    const iframe = document.createElement('iframe');
    iframe.src = fgURLp;
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('allowTransparency', 'true');
    Object.assign(iframe.style, {
        width: 'calc(100% + 20px)',
        height: 'calc(100% + 20px)',
        margin: '0',
        padding: '0',
        overflow: 'hidden',
        background: 'transparent',
        border: 'none',
        // Apply the SVG bolding...
        filter: `url(#Superimpose-bold-filter) brightness(${iframeBrightness})`
    });
    fgLayer.appendChild(iframe);
    document.body.appendChild(fgLayer);

    // —5— (A) Scheduled Reload (if fgURLh > 0)...
    if (fgURLh > 0) {
        setInterval(() => {
            const nowDate = new Date();
            const nowHour = nowDate.getHours();
            const nowMins = nowDate.getMinutes();
            const compare = fgURLm;

            if (fgURLm < 0 || fgURLm > 59) { compare = nowMins; }

            // Check if the current hour is a multiple of our interval, and if we have reached the target minute...
            if (nowHour % fgURLh === 0 && nowMins === compare) {
                console.log(`[Superimpose] Reloading fgURLp at ${nowHour}:${nowMins}`);
                iframe.src = iframe.src; // This triggers a clean refresh of the iframe content.
            }
        }, 60000); // Check once every minute (60,000ms)
    }

})();
