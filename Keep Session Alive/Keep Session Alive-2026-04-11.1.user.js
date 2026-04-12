// ==UserScript==
// @name         Keep Session Alive
// @namespace    http://tampermonkey.net/
// @version      2026-04-11.1
// @description  Prevents inactivity session timeouts by simulating periodic activity — great for kiosk mode or over-aggressive timeouts
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @homepageURL  https://github.com/jjg8/Tampermonkey-Scripts/tree/main/Keep%20Session%20Alive
// @match        https://vhi.dca1.inf.databridgesites.com:*/*
// @match        https://observium.databridgesites.com/*
// @match        https://app.getsling.com/*
// @match        https://databridgesites.atlassian.net/jira/dashboards/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const IntervalMs = 60 * 1000; // Fire every 60 seconds

    function simulateActivity() {
        // Dispatch a benign mousemove event at the current pointer position
        document.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2,
        }));

        // Dispatch a keydown event that shouldn't affect page state
        document.dispatchEvent(new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: 'Shift',
            code: 'ShiftLeft',
        }));

        console.debug('[KeepAlive] Activity simulated at', new Date().toLocaleTimeString());
    }

    setInterval(simulateActivity, IntervalMs);
    console.info('[KeepAlive] Session keepalive active — firing every', IntervalMs / 1000, 'seconds');
})();