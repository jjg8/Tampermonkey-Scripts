// ==UserScript==
// @name         Zabbix Midnight+1m Auto-reload
// @version      2026-09-10.1
// @description  Zabbix does garbage-collection at midnight, which hoses all current sessions; this reloads a dashboard automatically
// @author       Jeremy Gagliardi
// @license      GPL-3.0
// @match        *://*/zabbix/zabbix.php?action=dashboard*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Calculate time until next midnight + 1 minute...
    const now = new Date();
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // tomorrow
        0, 1, 0 // 00:01:00
    );
    const msToMidnight = night.getTime() - now.getTime();

    setTimeout(function() {
        location.reload(true);
    }, msToMidnight);
})();