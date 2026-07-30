import { strToU8, zipSync } from "fflate";
import { isAdmin } from "../../../lib/admin-auth";
import { createAdminSupabase } from "../../../lib/supabase";

const escapeXml = (value: unknown) => String(value ?? "").replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" }[character] || character));
const cell = (value: unknown) => typeof value === "number"
  ? `<c t="n"><v>${value}</v></c>`
  : `<c t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
const sheetXml = (rows: readonly (readonly unknown[])[]) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows.map((row, index) => `<row r="${index + 1}">${row.map(cell).join("")}</row>`).join("")}</sheetData></worksheet>`;

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminSupabase();
  const [{ data: orders }, { data: products }, { data: subscribers }] = await Promise.all([
    supabase.from("orders").select("order_number,created_at,customer_name,customer_email,currency,subtotal,discount_total,shipping_total,tax_total,total,payment_gateway,payment_status,fulfillment_status,carrier,tracking_number").order("created_at", { ascending: false }),
    supabase.from("products").select("name,category,price_usd,price_gbp,stock,status,featured,created_at").order("created_at", { ascending: false }),
    supabase.from("newsletter_subscribers").select("email,status,source,created_at").order("created_at", { ascending: false }),
  ]);
  const sheets = [
    ["Orders", [["Order", "Date", "Customer", "Email", "Currency", "Subtotal", "Discount", "Shipping", "Tax", "Total", "Gateway", "Payment", "Fulfilment", "Carrier", "Tracking"], ...(orders || []).map(Object.values)]],
    ["Products", [["Product", "Category", "USD", "GBP", "Stock", "Status", "Featured", "Created"], ...(products || []).map(Object.values)]],
    ["Subscribers", [["Email", "Status", "Source", "Created"], ...(subscribers || []).map(Object.values)]],
  ] as const;
  const workbookRels = sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map(([name], index) => `<sheet name="${name}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}</Relationships>`),
  };
  sheets.forEach(([, rows], index) => { files[`xl/worksheets/sheet${index + 1}.xml`] = strToU8(sheetXml(rows)); });
  return new Response(Buffer.from(zipSync(files, { level: 6 })), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="afro-fashionstyle-analysis-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
