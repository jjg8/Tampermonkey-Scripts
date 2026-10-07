// ==UserScript==
// @name         NetBox Converter
// @namespace    http://tampermonkey.net/
// @version      2026-10-07.1.1.0
// @description  Convert all units in MB, GB, TB, and PB to equivalent MiB, GiB, TiB, and PiB, respectively
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/NetBox%20Converter
// @include      /^https?:\/\/[Nn][Ee][Tt][Bb][Oo][Xx][A-Za-z0-9-]*(\.[A-Za-z0-9-]+)*(:[0-9]+)?(\/[^\/]*)*/
// @grant        none
// @run-at       document-end
// ==/UserScript==
//
// 2026-10-07.1.1.0
//  • Replaced parentheses & manual styling with the .binary-unit class to shape the background like a 'pill'.
//

(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .binary-unit {
            border-radius:     8px;
            padding:           0.1em 0.25em;
            background-color:  Yellow;
            color:             Black;
            font-weight:       Bold;
            font-size:         10pt;
        }
    `;
    document.head.appendChild(style);

    const UNIT_FACTORS = {
        'B':   1,
        'KB':  1000,
        'MB':  1000**2,
        'GB':  1000**3,
        'TB':  1000**4,
        'PB':  1000**5
    };

    function formatBinaryValue(val) {
        return parseFloat(val.toFixed(2)).toString();
    }

    function convertDecimalToBinary(val, unit) {
        let bytes = val * (UNIT_FACTORS[unit.toUpperCase()] || 1);
        let kibi = 1024;
        let mebi = kibi * kibi;
        let gibi = mebi * kibi;
        let tebi = gibi * kibi;
        let pebi = tebi * kibi;

        if (bytes >= pebi) return formatBinaryValue(bytes / pebi) + '&nbsp;PiB';
        if (bytes >= tebi) return formatBinaryValue(bytes / tebi) + '&nbsp;TiB';
        if (bytes >= gibi) return formatBinaryValue(bytes / gibi) + '&nbsp;GiB';
        if (bytes >= mebi) return formatBinaryValue(bytes / mebi) + '&nbsp;MiB';
        if (bytes >= kibi) return formatBinaryValue(bytes / kibi) + '&nbsp;KiB';
        return bytes + '&nbsp;B';
    }

    function processTableCells() {
        let targetCells = document.querySelectorAll('table td, div.v-table cell');

        targetCells.forEach((cell) => {
            if (cell.dataset.converted === 'true') return;

            let text = cell.innerText.trim()
            let match = text.match(/^(\d+(?:\.\d+)?)\s*(MB|GB|TB|PB)$/i);
                text = text.replaceAll(' ', '&nbsp;');

            if (match) {
                let numericValue = parseFloat(match[1]);
                let originalUnit = match[2].toUpperCase();
                let binaryString = convertDecimalToBinary(numericValue, originalUnit);

                cell.innerHTML = `${text} <span class="binary-unit">${binaryString}</span>`;
                cell.dataset.converted = 'true';
            }
        });
    }

    processTableCells();

    const observer = new MutationObserver((mutations) => {
        let shouldProcess = false;
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                shouldProcess = true;
                break;
            }
        }
        if (shouldProcess) {
            processTableCells();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
