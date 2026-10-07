// ==UserScript==
// @name         Virtuozzo Converter
// @namespace    http://tampermonkey.net/
// @version      2026-10-07.1.0.0
// @description  Convert all binary units (KiB, MiB, GiB, TiB, PiB) to decimal units (KB, MB, GB, TB, PB) in Virtuozzo
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Virtuozzo%20Converter
// @include      /^https?:\/\/[Vv][Hh][Ii][A-Za-z0-9-]*(\.[A-Za-z0-9-]+)*(:[0-9]+)?(\/[^\/]*)*/
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const BINARY_FACTORS = {
        'B':   1,
        'KIB': 1024,
        'MIB': 1024**2,
        'GIB': 1024**3,
        'TIB': 1024**4,
        'PIB': 1024**5
    };

    function formatDecimalValue(val) {
        return parseFloat(val.toFixed(2)).toString();
    }

    function convertBinaryToDecimal(val, unit) {
        let bytes = val * (BINARY_FACTORS[unit.toUpperCase()] || 1);
        let kilo = 1000;
        let mega = kilo * kilo;
        let giga = mega * kilo;
        let tera = giga * kilo;
        let peta = tera * kilo;

        if (bytes >= peta) return formatDecimalValue(bytes / peta) + '&nbsp;PB';
        if (bytes >= tera) return formatDecimalValue(bytes / tera) + '&nbsp;TB';
        if (bytes >= giga) return formatDecimalValue(bytes / giga) + '&nbsp;GB';
        if (bytes >= mega) return formatDecimalValue(bytes / mega) + '&nbsp;MB';
        if (bytes >= kilo) return formatDecimalValue(bytes / kilo) + '&nbsp;KB';
        return bytes + '&nbsp;B';
    }

    function processTextNode(textNode) {
        let text = textNode.nodeValue;

        if (/\bof\b/i.test(text)) {
            textNode.nodeValue = text.replace(/\s*of\s*/i, '/');
            return;
        }

        // Fast pre-check before executing full regex logic
        if (!/(?:KiB|MiB|GiB|TiB|PiB)/i.test(text)) return;

        let parent = textNode.parentNode;

        // Skip script/style elements or elements already marked as converted
        if (!parent ||
            ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION'].includes(parent.tagName) ||
            parent.closest('.converted-unit')) {
            return;
        }

        let regex = /(\d+(?:\.\d+)?)\s*(KiB|MiB|GiB|TiB|PiB)\b/gi;
        let match;
        let lastIndex = 0;
        let fragment = document.createDocumentFragment();
        let hasMatches = false;

        while ((match = regex.exec(text)) !== null) {
            hasMatches = true;

            // Append preceding un-matched text
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }

            // Create wrapper container for matched value + pill to prevent re-processing
            let wrapper = document.createElement('span');
            wrapper.className = 'converted-unit';

            let origSpan = document.createElement('span');
            origSpan.style.cssText = `
                display: inline-block;
                line-height: 0.8 !important;
            `;
            origSpan.innerHTML = match[0];
            wrapper.appendChild(origSpan);

            // Calculate base-10 conversion
            let numericValue = parseFloat(match[1]);
            let originalUnit = match[2].toUpperCase();
            let decimalString = convertBinaryToDecimal(numericValue, originalUnit);

            // Create conversion pill element
            let pillSpan = document.createElement('span');
            pillSpan.className = 'decimal-unit';
            pillSpan.style.cssText = `
                display: inline-block;
                border-radius: 8px;
                padding: 0.1em 0.25em !important;
                margin-left: 0.3em !important;
                background-color: Yellow !important;
                color: Black !important;
                line-height: 1.8 !important;
                font-weight: Bold !important;
                font-size: 0.7em;
            `;
            pillSpan.innerHTML = decimalString;
            wrapper.appendChild(pillSpan);

            fragment.appendChild(wrapper);
            lastIndex = regex.lastIndex;
        }

        if (hasMatches) {
            if (lastIndex < text.length) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            }
            parent.replaceChild(fragment, textNode);
        }
    }

    function scanDOM(root = document.body) {
        let walker = document.createTreeWalker(
            root,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let node;
        let nodesToProcess = [];
        while ((node = walker.nextNode())) {
            nodesToProcess.push(node);
        }

        if (typeof observer !== 'undefined' && observer) observer.disconnect();

        nodesToProcess.forEach(processTextNode);

        if (typeof observer !== 'undefined' && observer) {
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    let isScheduled = false;
    const observer = new MutationObserver((mutations) => {
        if (isScheduled) return;

        let targetAdded = false;
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                targetAdded = true;
                break;
            }
        }

        if (targetAdded) {
            isScheduled = true;
            requestAnimationFrame(() => {
                scanDOM();
                isScheduled = false;
            });
        }
    });

    scanDOM();
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();