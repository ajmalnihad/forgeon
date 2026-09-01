const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6M9 12h6M9 16h4",
  chart: "M4 20V10m5 10V4m5 16v-7m5 7V8",
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.5-4.5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m2.5-15.5a3.5 3.5 0 0 1 0 7M17 20a6 6 0 0 0-2-4.5",
  box: "M12 3 4 7v10l8 4 8-4V7l-8-4Zm0 0v18M4 7l8 4 8-4",
  trash: "M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.7l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2.9-1.7L14.2 2H9.8l-.4 2.7a8 8 0 0 0-3 1.7l-2.2-1-2 3.4 2 1.5a8 8 0 0 0 0 3.4l-2 1.5 2 3.4 2.2-1a8 8 0 0 0 3 1.7l.4 2.7h4.4l.4-2.7a8 8 0 0 0 2.9-1.7l2.3 1 2-3.4-2-1.5c.1-.6.2-1.1.2-1.7Z",
  logout: "M15 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2m3 5H9m9 0-3-3m3 3-3 3",
  chevronRight: "m9 5 7 7-7 7",
  chevronLeft: "m15 5-7 7 7 7",
  chevronDown: "m6 9 6 6 6-6",
  check: "m5 13 4 4L19 7",
  close: "M6 6l12 12M18 6 6 18",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-14v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4",
  moon: "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z",
  alert: "M12 8v5m0 3.5h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  edit: "M4 20h4L20 8l-4-4L4 16v4Zm10-14 4 4",
  filter: "M3 5h18l-7 8v6l-4 2v-8L3 5Z",
  download: "M12 3v12m0 0 4-4m-4 4-4-4M4 19h16",
  restore: "M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4",
  wallet: "M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 12-3v3m1.5 7h.01",
  star: "m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9 6.7 19.7l1.1-5.9-4.3-4.1 5.9-.8L12 3.5Z",
  phone: "M5 3h4l2 5-2.5 1.5a12 12 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z",
  calendar: "M4 6h16v14H4V6Zm0 4h16M8 3v4m8-4v4",
  spark: "m12 2 2.2 6.3L20 10l-5.8 1.7L12 18l-2.2-6.3L4 10l5.8-1.7L12 2Z",
};

export function Icon({ name, className = "size-5", strokeWidth = 1.8, ...rest }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export default Icon;
