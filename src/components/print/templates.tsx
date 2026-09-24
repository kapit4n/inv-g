import type { PrintDocumentModel } from "@/lib/print/types"
import { isThermalPaper, paperWidth } from "@/lib/print/config"
import { formatCurrency, formatTotalValue } from "@/lib/print"
import { useTranslation } from "react-i18next"

function ReceiptTemplate({ document }: { document: PrintDocumentModel }) {
  const { t } = useTranslation()
  const width = paperWidth(document.paperSize)

  return (
    <div
      className="bg-white text-black"
      style={{ width, minWidth: width, padding: "10px 12px", fontSize: 12, fontFamily: "monospace" }}
    >
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <strong style={{ fontSize: 16 }}>{document.store.name}</strong>
        <div>{document.title}</div>
        {document.documentNumber && <div>{document.documentNumber}</div>}
        {document.secondaryNumber && <div>{document.secondaryNumber}</div>}
        {document.date && <div style={{ fontSize: 10 }}>{document.date}</div>}
      </div>

      {document.metaLines.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          {document.metaLines.map((m, i) => (
            <div key={i} style={{ fontSize: 10, textAlign: "center" }}>
              {m.label}: {m.value}
            </div>
          ))}
        </div>
      )}

      {document.lineItems.length > 0 && (
        <div
          style={{
            borderTop: "1px dashed #000",
            borderBottom: "1px dashed #000",
            padding: "5px 0",
            marginBottom: 8,
          }}
        >
          {document.lineItems.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>{formatCurrency(item.total, document.store.currency ?? "USD")}</span>
            </div>
          ))}
        </div>
      )}

      {document.totals.length > 0 && (
        <div style={{ textAlign: "right", marginBottom: 8 }}>
          {document.totals.map((row, i) => (
            <div key={i} style={{ fontWeight: row.bold ? 700 : 400, fontSize: row.bold ? 14 : 12 }}>
              {row.label}: {formatTotalValue(row, document.store.currency ?? "USD")}
            </div>
          ))}
        </div>
      )}

      {document.payments && document.payments.length > 0 && (
        <div style={{ textAlign: "center", fontSize: 10, marginBottom: 8 }}>
          {document.payments.map((p, i) => (
            <div key={i}>
              {p.method}: {formatCurrency(p.amount, document.store.currency ?? "USD")}
              {p.change > 0 && ` (${t("paymentChange")}: ${formatCurrency(p.change, document.store.currency ?? "USD")})`}
            </div>
          ))}
        </div>
      )}

      {document.footer && (
        <div style={{ textAlign: "center", fontSize: 10, marginTop: 15 }}>{document.footer}</div>
      )}
    </div>
  )
}

function DocumentTemplate({ document }: { document: PrintDocumentModel }) {
  const { t } = useTranslation()
  const currency = document.store.currency ?? "USD"

  return (
    <div
      className="bg-white text-black"
      style={{ width: paperWidth(document.paperSize), minWidth: paperWidth(document.paperSize), padding: "24px 32px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: 12 }}>
        <div>
          <strong style={{ fontSize: 18 }}>{document.store.name}</strong>
          {document.store.address && <div style={{ fontSize: 11 }}>{document.store.address}</div>}
          {document.store.phone && <div style={{ fontSize: 11 }}>{document.store.phone}</div>}
          {document.store.taxId && <div style={{ fontSize: 11 }}>{document.store.taxId}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <strong style={{ fontSize: 16 }}>{document.title}</strong>
          {document.documentNumber && <div style={{ fontSize: 12 }}>{document.documentNumber}</div>}
          {document.date && <div style={{ fontSize: 11 }}>{document.date}</div>}
        </div>
      </div>

      {document.metaLines.length > 0 && (
        <div style={{ display: "flex", gap: 32, padding: "12px 0", fontSize: 12, borderBottom: "1px solid #ccc", marginBottom: 16 }}>
          {document.metaLines.map((m, i) => (
            <div key={i}>
              <span style={{ opacity: 0.6 }}>{m.label}: </span>
              <span style={{ fontWeight: 600 }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {document.lineItems.length > 0 && (
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #000", textAlign: "left" }}>
              <th style={{ padding: "6px 0" }}>{t("product")}</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>{t("qty")}</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>{t("price")}</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>{t("disc")}</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {document.lineItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "6px 0" }}>
                  <div>{item.name}</div>
                  {item.sku && <div style={{ fontSize: 10, opacity: 0.6 }}>{item.sku}</div>}
                </td>
                <td style={{ padding: "6px 0", textAlign: "right" }}>{item.quantity}</td>
                <td style={{ padding: "6px 0", textAlign: "right" }}>{formatCurrency(item.unitPrice, currency)}</td>
                <td style={{ padding: "6px 0", textAlign: "right" }}>{item.discount > 0 ? formatCurrency(item.discount, currency) : "-"}</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600 }}>{formatCurrency(item.total, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {document.totals.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 16, fontSize: 13 }}>
          <div style={{ width: 220 }}>
            {document.totals.map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontWeight: row.bold ? 700 : 400 }}>
                <span>{row.label}</span>
                <span>{formatTotalValue(row, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {document.notes && (
        <div style={{ marginTop: 24, fontSize: 11, whiteSpace: "pre-wrap" }}>
          {document.notes}
        </div>
      )}
    </div>
  )
}

export function PrintTemplate({ document }: { document: PrintDocumentModel }) {
  return isThermalPaper(document.paperSize)
    ? <ReceiptTemplate document={document} />
    : <DocumentTemplate document={document} />
}
