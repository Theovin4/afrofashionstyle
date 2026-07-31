import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { isAdmin } from "../../../../lib/admin-auth";
import { createAdminSupabase } from "../../../../lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderItem = { product_name: string; quantity: number; unit_price: number };
type Order = {
  created_at: string; currency: "USD" | "GBP"; total: number; payment_status: string;
  fulfillment_status: string; payment_gateway: string; order_items?: OrderItem[];
};

const ink = rgb(0.16, 0.07, 0.04);
const orange = rgb(0.88, 0.43, 0.08);
const teal = rgb(0.02, 0.43, 0.42);
const plum = rgb(0.31, 0.08, 0.38);
const sand = rgb(0.97, 0.94, 0.89);
const muted = rgb(0.43, 0.36, 0.33);

function parseDate(value: string | null, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function day(value: Date) { return value.toISOString().slice(0, 10); }
function money(value: number, currency: string) { return `${currency} ${value.toFixed(2)}`; }
function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function wrap(text: string, font: PDFFont, size: number, width: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) line = next;
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

function drawWrapped(page: PDFPage, text: string, x: number, y: number, width: number, font: PDFFont, size = 10, color = muted, lineHeight = 14) {
  const lines = wrap(text, font, size, width);
  lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }));
  return y - lines.length * lineHeight;
}

function header(page: PDFPage, bold: PDFFont, regular: PDFFont, title: string, subtitle: string) {
  page.drawRectangle({ x: 0, y: 782, width: 595, height: 60, color: ink });
  page.drawText("AFRO.FASHIONSTYLE", { x: 38, y: 812, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText(title, { x: 38, y: 735, size: 24, font: bold, color: ink });
  page.drawText(subtitle, { x: 38, y: 713, size: 9, font: regular, color: muted });
}

function metric(page: PDFPage, x: number, y: number, label: string, value: string, note: string, bold: PDFFont, regular: PDFFont) {
  page.drawRectangle({ x, y, width: 247, height: 78, color: sand, borderColor: rgb(.88, .83, .78), borderWidth: 1 });
  page.drawText(label.toUpperCase(), { x: x + 14, y: y + 56, size: 7, font: bold, color: muted });
  page.drawText(value, { x: x + 14, y: y + 29, size: 18, font: bold, color: ink });
  page.drawText(note, { x: x + 14, y: y + 11, size: 7, font: regular, color: muted });
}

function lineChart(page: PDFPage, values: number[], labels: string[], x: number, y: number, width: number, height: number, color: ReturnType<typeof rgb>, regular: PDFFont) {
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, thickness: 1, color: rgb(.8, .76, .72) });
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  values.forEach((value, index) => {
    const px = x + index * step;
    const py = y + (value / max) * height;
    if (index) {
      const previousY = y + (values[index - 1] / max) * height;
      page.drawLine({ start: { x: px - step, y: previousY }, end: { x: px, y: py }, thickness: 2, color });
    }
    page.drawCircle({ x: px, y: py, size: 2.5, color });
  });
  const labelIndexes = values.length <= 6 ? values.map((_, index) => index) : [0, Math.floor((values.length - 1) / 2), values.length - 1];
  labelIndexes.forEach((index) => page.drawText(labels[index] || "", { x: x + index * step - 10, y: y - 16, size: 6, font: regular, color: muted }));
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const today = new Date();
  const defaultStart = new Date(today); defaultStart.setUTCDate(today.getUTCDate() - 29);
  const start = parseDate(url.searchParams.get("start"), defaultStart);
  const end = parseDate(url.searchParams.get("end"), today);
  if (start > end || end.getTime() - start.getTime() > 366 * 86400000) {
    return Response.json({ error: "Choose a valid period of up to one year." }, { status: 400 });
  }
  const endExclusive = new Date(end); endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const duration = endExclusive.getTime() - start.getTime();
  const previousStart = new Date(start.getTime() - duration);

  const supabase = createAdminSupabase();
  const { data, error } = await supabase.from("orders")
    .select("created_at,currency,total,payment_status,fulfillment_status,payment_gateway,order_items(product_name,quantity,unit_price)")
    .gte("created_at", previousStart.toISOString()).lt("created_at", endExclusive.toISOString()).order("created_at");
  if (error) return Response.json({ error: "The analysis could not be prepared." }, { status: 500 });
  const all = (data || []) as Order[];
  const current = all.filter((order) => new Date(order.created_at) >= start);
  const previous = all.filter((order) => new Date(order.created_at) < start);
  const paid = current.filter((order) => order.payment_status === "paid");
  const previousPaid = previous.filter((order) => order.payment_status === "paid");
  const currencies = ["USD", "GBP"] as const;
  const revenue = Object.fromEntries(currencies.map((currency) => [currency, paid.filter((o) => o.currency === currency).reduce((sum, o) => sum + Number(o.total), 0)])) as Record<"USD" | "GBP", number>;
  const previousRevenue = Object.fromEntries(currencies.map((currency) => [currency, previousPaid.filter((o) => o.currency === currency).reduce((sum, o) => sum + Number(o.total), 0)])) as Record<"USD" | "GBP", number>;

  const bucketCount = Math.min(12, Math.max(1, Math.ceil(duration / 86400000)));
  const bucketMs = duration / bucketCount;
  const labels = Array.from({ length: bucketCount }, (_, index) => day(new Date(start.getTime() + index * bucketMs)).slice(5));
  const orderTrend = Array(bucketCount).fill(0) as number[];
  const revenueTrend = { USD: Array(bucketCount).fill(0) as number[], GBP: Array(bucketCount).fill(0) as number[] };
  paid.forEach((order) => {
    const index = Math.min(bucketCount - 1, Math.floor((new Date(order.created_at).getTime() - start.getTime()) / bucketMs));
    orderTrend[index] += 1;
    revenueTrend[order.currency][index] += Number(order.total);
  });

  const productMap = new Map<string, { quantity: number; USD: number; GBP: number }>();
  paid.forEach((order) => order.order_items?.forEach((item) => {
    const row = productMap.get(item.product_name) || { quantity: 0, USD: 0, GBP: 0 };
    row.quantity += Number(item.quantity);
    row[order.currency] += Number(item.unit_price) * Number(item.quantity);
    productMap.set(item.product_name, row);
  }));
  const topProducts = [...productMap.entries()].sort((a, b) => b[1].quantity - a[1].quantity).slice(0, 8);
  const pendingFulfillment = paid.filter((order) => ["unfulfilled", "processing"].includes(order.fulfillment_status)).length;
  const failedPayments = current.filter((order) => order.payment_status === "failed").length;
  const gatewayCounts = { paypal: paid.filter((o) => o.payment_gateway === "paypal").length, flutterwave: paid.filter((o) => o.payment_gateway === "flutterwave").length };

  const insights: string[] = [];
  const actions: string[] = [];
  const orderChange = percentChange(paid.length, previousPaid.length);
  insights.push(`Paid orders ${orderChange >= 0 ? "increased" : "decreased"} by ${Math.abs(orderChange).toFixed(0)}% compared with the previous equal period.`);
  currencies.forEach((currency) => {
    const change = percentChange(revenue[currency], previousRevenue[currency]);
    if (revenue[currency] || previousRevenue[currency]) insights.push(`${currency} sales ${change >= 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(0)}%.`);
  });
  if (topProducts[0]) actions.push(`Feature ${topProducts[0][0]} more prominently because it sold the most units in this period.`);
  if (pendingFulfillment) actions.push(`Review ${pendingFulfillment} paid order${pendingFulfillment === 1 ? "" : "s"} still waiting for dispatch or completion.`);
  if (failedPayments) actions.push(`Check the ${failedPayments} failed payment attempt${failedPayments === 1 ? "" : "s"} for customer support or checkout issues.`);
  if (!paid.length) actions.push("No paid orders were recorded. Check that products are active, payment links work, and launch traffic is reaching the store.");
  if (paid.length && !pendingFulfillment) actions.push("All paid orders are moving through fulfilment. Keep tracking delivery times and customer questions.");

  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page1 = pdf.addPage([595, 842]);
  header(page1, bold, regular, "Sales analysis", `${day(start)} to ${day(end)} | Generated ${new Date().toISOString().slice(0, 10)}`);
  metric(page1, 38, 604, "Paid orders", String(paid.length), `${orderChange >= 0 ? "+" : ""}${orderChange.toFixed(0)}% vs previous period`, bold, regular);
  metric(page1, 310, 604, "Items sold", String(topProducts.reduce((sum, [, row]) => sum + row.quantity, 0)), "Across verified paid orders", bold, regular);
  metric(page1, 38, 510, "USD sales", money(revenue.USD, "USD"), `Previous: ${money(previousRevenue.USD, "USD")}`, bold, regular);
  metric(page1, 310, 510, "GBP sales", money(revenue.GBP, "GBP"), `Previous: ${money(previousRevenue.GBP, "GBP")}`, bold, regular);
  page1.drawText("PAID ORDER TREND", { x: 38, y: 465, size: 8, font: bold, color: muted });
  lineChart(page1, orderTrend, labels, 45, 305, 500, 125, orange, regular);
  page1.drawText("What happened", { x: 38, y: 255, size: 15, font: bold, color: ink });
  let y = 228;
  insights.forEach((item) => { page1.drawCircle({ x: 43, y: y + 3, size: 2, color: teal }); y = drawWrapped(page1, item, 54, y + 7, 490, regular, 10, muted, 15) - 5; });

  const page2 = pdf.addPage([595, 842]);
  header(page2, bold, regular, "Sales patterns", "Currencies are shown separately so the report never mixes unlike values.");
  page2.drawText("USD SALES TREND", { x: 38, y: 665, size: 8, font: bold, color: muted });
  lineChart(page2, revenueTrend.USD, labels, 45, 525, 500, 110, teal, regular);
  page2.drawText("GBP SALES TREND", { x: 38, y: 470, size: 8, font: bold, color: muted });
  lineChart(page2, revenueTrend.GBP, labels, 45, 330, 500, 110, plum, regular);
  page2.drawText("Payment methods", { x: 38, y: 278, size: 15, font: bold, color: ink });
  page2.drawText(`PayPal: ${gatewayCounts.paypal} paid order${gatewayCounts.paypal === 1 ? "" : "s"}`, { x: 38, y: 250, size: 10, font: regular, color: muted });
  page2.drawText(`Flutterwave: ${gatewayCounts.flutterwave} paid order${gatewayCounts.flutterwave === 1 ? "" : "s"}`, { x: 38, y: 230, size: 10, font: regular, color: muted });
  page2.drawText("Order progress", { x: 310, y: 278, size: 15, font: bold, color: ink });
  page2.drawText(`${pendingFulfillment} paid order${pendingFulfillment === 1 ? "" : "s"} awaiting completion`, { x: 310, y: 250, size: 10, font: regular, color: muted });
  page2.drawText(`${failedPayments} failed payment attempt${failedPayments === 1 ? "" : "s"}`, { x: 310, y: 230, size: 10, font: regular, color: muted });

  const page3 = pdf.addPage([595, 842]);
  header(page3, bold, regular, "Products and next actions", "A practical summary for the selected period.");
  page3.drawText("Top-selling products", { x: 38, y: 665, size: 15, font: bold, color: ink });
  let tableY = 632;
  page3.drawText("Product", { x: 38, y: tableY, size: 8, font: bold, color: muted });
  page3.drawText("Units", { x: 325, y: tableY, size: 8, font: bold, color: muted });
  page3.drawText("USD", { x: 390, y: tableY, size: 8, font: bold, color: muted });
  page3.drawText("GBP", { x: 480, y: tableY, size: 8, font: bold, color: muted });
  tableY -= 22;
  topProducts.forEach(([name, row]) => {
    page3.drawLine({ start: { x: 38, y: tableY - 7 }, end: { x: 550, y: tableY - 7 }, thickness: .5, color: rgb(.9, .87, .84) });
    page3.drawText(name.slice(0, 44), { x: 38, y: tableY, size: 9, font: regular, color: ink });
    page3.drawText(String(row.quantity), { x: 325, y: tableY, size: 9, font: regular, color: ink });
    page3.drawText(row.USD.toFixed(2), { x: 390, y: tableY, size: 9, font: regular, color: ink });
    page3.drawText(row.GBP.toFixed(2), { x: 480, y: tableY, size: 9, font: regular, color: ink });
    tableY -= 25;
  });
  if (!topProducts.length) page3.drawText("No paid product sales in this period.", { x: 38, y: tableY, size: 10, font: regular, color: muted });
  page3.drawText("Recommended next steps", { x: 38, y: 350, size: 15, font: bold, color: ink });
  y = 320;
  actions.forEach((item, index) => {
    page3.drawCircle({ x: 47, y: y + 3, size: 8, color: orange });
    page3.drawText(String(index + 1), { x: 44.5, y, size: 7, font: bold, color: rgb(1, 1, 1) });
    y = drawWrapped(page3, item, 65, y + 6, 475, regular, 10, muted, 15) - 10;
  });
  page3.drawText("This report uses verified store records. Revenue excludes pending, failed and refunded payments.", { x: 38, y: 50, size: 7, font: regular, color: muted });

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="afro-fashionstyle-analysis-${day(start)}-to-${day(end)}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
