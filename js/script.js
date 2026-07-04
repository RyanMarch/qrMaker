/* ============================================================
   script.js (Global)
   Handles basic layout interactions for non-app static pages
   ============================================================ */

"use strict";

document.addEventListener('click', (event) => {
    // Mobile Sidebar Toggle Logic
    const toggleBtn = event.target.closest('[sidebar-toggle]') || event.target.closest('.mobile-nav-toggle');
    const sidebar = document.querySelector('.api-sidebar');
    const overlay = document.querySelector('#mobile-overlay');

    if (toggleBtn && sidebar && overlay) {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    // Close sidebar when clicking the dark backdrop overlay
    if (event.target.matches('#mobile-overlay')) {
        sidebar?.classList.remove('active');
        overlay?.classList.remove('active');
    }
});