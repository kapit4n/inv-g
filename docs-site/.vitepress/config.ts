import { defineConfig } from "vitepress"
import { readFileSync } from "fs"
import { resolve } from "path"

const pkg = JSON.parse(readFileSync(resolve(__dirname, "../../package.json"), "utf-8"))

export default defineConfig({
  title: "Inventory Gear",
  description: "User Manual — Inventory Gear Desktop ERP",
  base: "/manual/",
  outDir: "../docs-site/.vitepress/dist",
  srcDir: ".",
  cleanUrls: true,

  // Static sample/download assets live in `public/samples/` and are not part of
  // the markdown route graph, so exclude them from the dead-link check.
  ignoreDeadLinks: [/^\/manual\/samples\//],

  head: [
    ["link", { rel: "icon", type: "image/png", href: "/manual/favicon.png" }],
  ],

  themeConfig: {
    siteTitle: "Inventory Gear Manual",
    version: pkg.version,

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started/" },
      { text: "Manual", link: "/manual/" },
      { text: "Developer", link: "/developer/architecture" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        collapsed: false,
        items: [
          { text: "Introduction", link: "/getting-started/" },
          { text: "Installation", link: "/getting-started/installation" },
          { text: "Login", link: "/getting-started/login" },
          { text: "First Steps", link: "/getting-started/first-steps" },
        ],
      },
      {
        text: "Dashboard",
        collapsed: false,
        items: [
          { text: "Overview", link: "/dashboard/" },
        ],
      },
      {
        text: "Inventory",
        collapsed: false,
        items: [
          { text: "Overview", link: "/inventory/" },
          { text: "Products", link: "/inventory/products" },
          { text: "Categories & Brands", link: "/inventory/categories-brands" },
          { text: "Warehouses & Locations", link: "/inventory/warehouses" },
          { text: "Stock & Movements", link: "/inventory/stock-movements" },
          { text: "Cross References", link: "/inventory/cross-references" },
          { text: "Import / Export", link: "/inventory/import-export" },
        ],
      },
      {
        text: "Sales",
        collapsed: false,
        items: [
          { text: "Overview", link: "/sales/" },
          { text: "Point of Sale (POS)", link: "/sales/pos" },
          { text: "Sales History", link: "/sales/history" },
          { text: "Quotes", link: "/sales/quotes" },
          { text: "Returns", link: "/sales/returns" },
          { text: "Cash Register", link: "/sales/cash-register" },
          { text: "Receipts & Closeout", link: "/sales/receipts-closeout" },
        ],
      },
      {
        text: "Purchasing",
        collapsed: false,
        items: [
          { text: "Overview", link: "/purchases/" },
          { text: "Purchase Orders", link: "/purchases/orders" },
          { text: "Receiving & Returns", link: "/purchases/receiving" },
          { text: "Supplier Products & Costs", link: "/purchases/supplier-products" },
        ],
      },
      {
        text: "CRM & Vehicles",
        collapsed: false,
        items: [
          { text: "Overview", link: "/crm/" },
          { text: "Customers", link: "/crm/customers" },
          { text: "Vehicles & Compatibility", link: "/crm/vehicles" },
          { text: "Reminders & Warranties", link: "/crm/reminders-warranties" },
          { text: "Credit & Notes", link: "/crm/credit-notes" },
        ],
      },
      {
        text: "Part Finder",
        collapsed: false,
        items: [
          { text: "Vehicle-to-Part Search", link: "/manual/part-finder" },
        ],
      },
      {
        text: "Reports",
        collapsed: false,
        items: [
          { text: "Overview", link: "/reports/" },
          { text: "Sales Reports", link: "/reports/sales" },
          { text: "Inventory Reports", link: "/reports/inventory" },
          { text: "Purchasing & Profitability", link: "/reports/purchasing" },
          { text: "Customer & Supplier Reports", link: "/reports/customers-suppliers" },
          { text: "KPIs & Custom Reports", link: "/reports/kpis-custom" },
        ],
      },
      {
        text: "Administration",
        collapsed: false,
        items: [
          { text: "Overview", link: "/admin/" },
          { text: "Users & Roles", link: "/admin/users-roles" },
          { text: "System Settings", link: "/admin/settings" },
          { text: "Database & Backups", link: "/admin/database" },
          { text: "Diagnostics & Audit", link: "/admin/diagnostics" },
        ],
      },
      {
        text: "Settings & Help",
        collapsed: false,
        items: [
          { text: "Settings", link: "/settings/" },
          { text: "Help", link: "/settings/help" },
        ],
      },
      {
        text: "Troubleshooting",
        collapsed: false,
        items: [
          { text: "Common Problems", link: "/troubleshooting/" },
        ],
      },
      {
        text: "Developer",
        collapsed: false,
        items: [
          { text: "Architecture", link: "/developer/architecture" },
          { text: "Development Guide", link: "/developer/development" },
          { text: "Database Profiles", link: "/developer/database-profiles" },
          { text: "Testing", link: "/developer/testing" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/inventory-gear" },
    ],

    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Search docs...", buttonAriaLabel: "Search" },
          modal: {
            noResultsText: "No results found",
            resetButtonTitle: "Clear search",
            footer: { selectText: "select", navigateText: "navigate" },
          },
        },
      },
    },

    footer: {
      message: `Inventory Gear v${pkg.version} — User Manual`,
      copyright: `© ${new Date().getFullYear()} Inventory Gear`,
    },

    outline: {
      level: [2, 3],
      label: "On this page",
    },

    lastUpdated: {
      text: "Last updated",
    },

    docFooter: {
      prev: "Previous",
      next: "Next",
    },

    returnToLabel: "Back to menu",

    sidebarMenuLabel: "Menu",

    darkModeSwitchLabel: "Theme",

    lightModeSwitchTitle: "Switch to light mode",

    darkModeSwitchTitle: "Switch to dark mode",
  },

  lastUpdated: true,

  markdown: {
    lineNumbers: false,
    anchors: {
      permalink: "##",
    },
  },
})
