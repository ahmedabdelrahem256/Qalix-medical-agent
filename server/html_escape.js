/* Qalix Medical Agent — Shared HTML Escaping Utility
 * 100% Offline Air-Gapped · Zero External Dependencies
 */
'use strict';

/**
 * Escapes special HTML characters in untrusted or user/DB-supplied strings.
 * @param {*} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };
