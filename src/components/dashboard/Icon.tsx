"use client";

/* ================================================================
   Icon — SVG line icons (catalogue identique au prototype)
   ================================================================ */

const ICONS: Record<string, string> = {
  phone:    "M3 5.5C3 14.06 9.94 21 18.5 21a2 2 0 0 0 2-1.72l.3-2.1a1.5 1.5 0 0 0-.9-1.6l-3.3-1.4a1.5 1.5 0 0 0-1.7.4l-1 1.2a13.5 13.5 0 0 1-5.4-5.4l1.2-1a1.5 1.5 0 0 0 .4-1.7L7.9 4.8a1.5 1.5 0 0 0-1.6-.9l-2.1.3A2 2 0 0 0 3 5.5Z",
  activity: "M3 12h3l3 8 5-16 3 8h4",
  layers:   "M12 3 3 8l9 5 9-5-9-5ZM3 14l9 5 9-5M3 11l9 5 9-5",
  wallet:   "M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1H5a2 2 0 0 0-2 2V7ZM3 9h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Zm13 4h2",
  search:   "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16ZM21 21l-4.3-4.3",
  bell:     "M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 20a2 2 0 0 0 4 0",
  sun:      "M12 4V2M12 22v-2M6.3 6.3 4.9 4.9M19.1 19.1l-1.4-1.4M4 12H2M22 12h-2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z",
  moon:     "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  chevL:    "M15 18l-6-6 6-6",
  chevR:    "M9 18l6-6-6-6",
  chevD:    "M6 9l6 6 6-6",
  home:     "M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5",
  megaphone:"M3 11v2a1 1 0 0 0 1 1h2l9 5V5L6 10H4a1 1 0 0 0-1 1ZM18 9a3 3 0 0 1 0 6",
  users:    "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM22 19v-1a4 4 0 0 0-3-3.8M16 4.2a3.5 3.5 0 0 1 0 6.6",
  list:     "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  chart:    "M3 3v18h18M8 14v4M13 9v9M18 5v13",
  smile:    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01",
  card:     "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM3 10h18",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 .9-1.4V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5.9Z",
  help:     "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.2 9a3 3 0 0 1 5.6 1c0 2-3 2.5-3 4M12 17h.01",
  headset:  "M4 13v-1a8 8 0 0 1 16 0v1M4 13a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1v-5H4ZM20 13a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1v-5h1ZM20 18v1a3 3 0 0 1-3 3h-3",
  plus:     "M12 5v14M5 12h14",
  upload:   "M12 16V4M7 9l5-5 5 5M5 20h14",
  download: "M12 4v12M7 11l5 5 5-5M5 20h14",
  more:     "M5 12h.01M12 12h.01M19 12h.01",
  play:     "M7 4v16l13-8z",
  pause:    "M8 5h3v14H8zM13 5h3v14h-3z",
  stop:     "M6 6h12v12H6z",
  up:       "M12 19V5M6 11l6-6 6 6",
  down:     "M12 5v14M6 13l6 6 6-6",
  arrowR:   "M5 12h14M13 6l6 6-6 6",
  check:    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 12l2.5 2.5 4.5-5",
  alert:    "M10.3 4.3 2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0ZM12 9v4M12 17h.01",
  clock:    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3.5 2",
  forward:  "M15 17l5-5-5-5M20 12H9a5 5 0 0 0-5 5v1",
  x:        "M6 6l12 12M18 6 6 18",
  sparkles: "M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z",
  filter:   "M3 5h18l-7 8v5l-4 2v-7L3 5Z",
  sort:     "M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3",
  csv:      "M14 3v5h5M7 3h8l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 13h6M9 17h6",
  wave:     "M4 12h2M8 7v10M12 4v16M16 8v8M20 11v2",
  logout:   "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  calendar: "M3 9h18M7 3v3M17 3v3M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  target:   "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  trend:    "M3 17l6-6 4 4 8-8M21 7v5h-5",
  copy:     "M9 9h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h-2ZM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  ban:      "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM5.6 5.6l12.8 12.8",
  user:     "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1",
};

interface IconProps {
  name: string;
  size?: number;
}

export function Icon({ name, size = 18 }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      {d.split("M").filter(Boolean).map((seg, i) => (
        <path key={i} d={"M" + seg} />
      ))}
    </svg>
  );
}

/* Logo mark — ondes sonores */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="var(--accent-ink)" strokeWidth="2.1" strokeLinecap="round">
      <path d="M5 10v4" />
      <path d="M9.2 6.5v11" />
      <path d="M13.4 9v6" />
      <path d="M17.6 4.5v15" />
    </svg>
  );
}
