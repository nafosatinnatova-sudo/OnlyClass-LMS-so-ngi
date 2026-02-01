// Minimal inline SVG icon set (no external CDN)
// Usage: icon("moon") returns an SVG string
export function icon(name) {
  const common = `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const svgs = {
    spark: `<svg viewBox="0 0 24 24" ${common}><path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" ${common}><path d="M5 12h12"/><path d="M13 6l6 6-6 6"/></svg>`,
    sun: `<svg viewBox="0 0 24 24" ${common}><path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>`,
    moon: `<svg viewBox="0 0 24 24" ${common}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z"/></svg>`,
    menu: `<svg viewBox="0 0 24 24" ${common}><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/></svg>`,
    login: `<svg viewBox="0 0 24 24" ${common}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>`,
    shield: `<svg viewBox="0 0 24 24" ${common}><path d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"/></svg>`,
    video: `<svg viewBox="0 0 24 24" ${common}><path d="M15 10l4-2v8l-4-2v-4z"/><rect x="3" y="6" width="12" height="12" rx="2"/></svg>`,
    test: `<svg viewBox="0 0 24 24" ${common}><path d="M9 11h6"/><path d="M9 15h6"/><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M9 7h6"/></svg>`,
    file: `<svg viewBox="0 0 24 24" ${common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" ${common}><path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-3"/></svg>`,
    user: `<svg viewBox="0 0 24 24" ${common}><path d="M20 21a8 8 0 1 0-16 0"/><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/></svg>`,
    logout: `<svg viewBox="0 0 24 24" ${common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>`,
    phone: `<svg viewBox="0 0 24 24" ${common}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.06a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z"/></svg>`,
    telegram: `<svg viewBox="0 0 24 24" ${common}><path d="M21 5L3.6 11.7c-.8.3-.78 1.46.03 1.73l4.7 1.56L18.7 7.4l-7.9 8.3v4.2c0 .9 1.1 1.3 1.7.6l2.4-2.6 4.3 3.2c.6.4 1.4.1 1.6-.6L22 6.2c.2-1-.8-1.8-1-1.2z"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" ${common}><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
    lock: `<svg viewBox="0 0 24 24" ${common}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V8a5 5 0 0 1 10 0v3"/></svg>`
  };
  return svgs[name] || svgs.spark;
}

