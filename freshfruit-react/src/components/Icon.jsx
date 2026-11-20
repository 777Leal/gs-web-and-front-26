// Caminhos SVG estáticos (constantes do próprio projeto), injetados em <g>.
const PATHS = {
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>',
  leaf: '<path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.6-6.8"/>',
  zap: '<path d="M13 2L3 14h9l-1 8 10-12h-9z"/>',
  pause: '<path d="M8 4v16M16 4v16"/>',
  play: '<path d="M6 4l14 8-14 8z"/>',
  thermo: '<path d="M14 14.8V4a2 2 0 00-4 0v10.8a4 4 0 104 0z"/>',
  drop: '<path d="M12 2.7S5 10 5 15a7 7 0 0014 0c0-5-7-12.3-7-12.3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z"/>',
  tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L2 12V2h10l8.6 8.6a2 2 0 010 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
  coins: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5a3 3 0 00-3-1.5c-1.7 0-3 .9-3 2s1.3 1.6 3 2 3 .9 3 2-1.3 2-3 2a3 3 0 01-3-1.5M12 6v2M12 16v2"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
  wind: '<path d="M9.6 4.6A2 2 0 1111 8H2M12.6 19.4A2 2 0 1014 16H2M17.7 7.7A2.5 2.5 0 1119.5 12H2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
  store: '<path d="M3 9l1-5h16l1 5M3 9h18M3 9v11h18V9M9 20v-6h6v6"/>'
};

export default function Icon({ name, size = 18, className = "" }) {
  return (
    <svg className={"shrink-0 align-[-3px] " + className} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g dangerouslySetInnerHTML={{ __html: PATHS[name] }} />
    </svg>
  );
}
