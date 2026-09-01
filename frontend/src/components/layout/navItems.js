/** Single source of truth for navigation, role-aware. */
export const bottomNav = [
  { to: "/", label: "Home", icon: "home", end: true },
  { to: "/sales", label: "Sales", icon: "receipt" },
  { to: "/sales/new", label: "+ Sale", icon: "plus", primary: true },
  { to: "/reports", label: "Reports", icon: "chart" },
  { to: "/more", label: "More", icon: "grid" },
];

export function desktopNav({ isAdmin }) {
  return [
    { to: "/", label: "Dashboard", icon: "home", end: true },
    { to: "/sales", label: "Sales", icon: "receipt" },
    { to: "/customers", label: "Customers", icon: "users" },
    { to: "/products", label: "Products", icon: "box" },
    { to: "/reports", label: "Reports", icon: "chart" },
    ...(isAdmin ? [{ to: "/trash", label: "Deleted Sales", icon: "trash" }] : []),
    { to: "/settings", label: "Settings", icon: "settings" },
  ];
}

export function moreItems({ isAdmin }) {
  return [
    { to: "/customers", label: "Customers", icon: "users", desc: "Search & manage records" },
    { to: "/products", label: "Products", icon: "box", desc: isAdmin ? "Manage catalogue" : "Browse catalogue" },
    ...(isAdmin
      ? [{ to: "/trash", label: "Deleted Sales", icon: "trash", desc: "Restore soft-deleted sales" }]
      : []),
    { to: "/profile", label: "Profile", icon: "user", desc: "Your account details" },
    { to: "/settings", label: "Settings", icon: "settings", desc: "Theme & app preferences" },
  ];
}
