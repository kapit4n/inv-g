import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import esCommon from "./locales/es/common.json"
import esDashboard from "./locales/es/dashboard.json"
import esInventory from "./locales/es/inventory.json"
import esSales from "./locales/es/sales.json"
import esPurchases from "./locales/es/purchases.json"
import esCustomers from "./locales/es/customers.json"
import esSuppliers from "./locales/es/suppliers.json"
import esVehicles from "./locales/es/vehicles.json"
import esWarehouse from "./locales/es/warehouse.json"
import esReports from "./locales/es/reports.json"
import esSettings from "./locales/es/settings.json"
import esAuth from "./locales/es/auth.json"
import esEmployees from "./locales/es/employees.json"
import esValidation from "./locales/es/validation.json"
import esErrors from "./locales/es/errors.json"
import esHelp from "./locales/es/help.json"

import enCommon from "./locales/en/common.json"
import enDashboard from "./locales/en/dashboard.json"
import enInventory from "./locales/en/inventory.json"
import enSales from "./locales/en/sales.json"
import enPurchases from "./locales/en/purchases.json"
import enCustomers from "./locales/en/customers.json"
import enSuppliers from "./locales/en/suppliers.json"
import enVehicles from "./locales/en/vehicles.json"
import enWarehouse from "./locales/en/warehouse.json"
import enReports from "./locales/en/reports.json"
import enSettings from "./locales/en/settings.json"
import enAuth from "./locales/en/auth.json"
import enEmployees from "./locales/en/employees.json"
import enValidation from "./locales/en/validation.json"
import enErrors from "./locales/en/errors.json"
import enHelp from "./locales/en/help.json"

const resources = {
  es: {
    common: esCommon,
    dashboard: esDashboard,
    inventory: esInventory,
    sales: esSales,
    purchases: esPurchases,
    customers: esCustomers,
    suppliers: esSuppliers,
    vehicles: esVehicles,
    warehouse: esWarehouse,
    reports: esReports,
    settings: esSettings,
    auth: esAuth,
    employees: esEmployees,
    validation: esValidation,
    errors: esErrors,
    help: esHelp,
  },
  en: {
    common: enCommon,
    dashboard: enDashboard,
    inventory: enInventory,
    sales: enSales,
    purchases: enPurchases,
    customers: enCustomers,
    suppliers: enSuppliers,
    vehicles: enVehicles,
    warehouse: enWarehouse,
    reports: enReports,
    settings: enSettings,
    auth: enAuth,
    employees: enEmployees,
    validation: enValidation,
    errors: enErrors,
    help: enHelp,
  },
}

export function setupI18n(language?: string) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language || "es",
      fallbackLng: "es",
      defaultNS: "common",
      ns: [
        "common", "dashboard", "inventory", "sales", "purchases",
        "customers", "suppliers", "vehicles", "warehouse", "reports",
        "settings", "auth", "employees", "validation", "errors", "help",
      ],
      nsSeparator: ".",
      interpolation: {
        escapeValue: false,
      },
      returnObjects: true,
    })

  return i18n
}

export default i18n
