import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("Meta Pixel is scoped to the Afro.Fashionstyle dataset and consent", async () => {
  const [pixel, layout, packageJson] = await Promise.all([
    read("app/components/meta-pixel.tsx"),
    read("app/layout.tsx"),
    read("package.json"),
  ]);
  assert.match(packageJson, /"name": "afro-fashionstyle"/);
  assert.match(layout, /Afro\.Fashionstyle/);
  assert.match(pixel, /4611600329085591/);
  assert.match(pixel, /hasMarketingConsent/);
  assert.match(pixel, /eventID: eventId/);
  assert.match(pixel, /lastRoute\.current === routeKey/);
  assert.doesNotMatch(pixel, /NEXT_PUBLIC.*META|META_CAPI_ACCESS_TOKEN/);
});

test("browser events use real actions and complete commerce payloads", async () => {
  const [pixel, product, cart, shop, home, contact] = await Promise.all([
    read("app/components/meta-pixel.tsx"),
    read("app/products/[slug]/product-detail.tsx"),
    read("app/components/cart-provider.tsx"),
    read("app/shop/page.tsx"),
    read("app/page.tsx"),
    read("app/contact/page.tsx"),
  ]);
  assert.match(product, /trackMeta\("ViewContent"/);
  assert.match(cart, /trackMeta\("AddToCart"/);
  assert.match(cart, /trackMeta\("InitiateCheckout"/);
  assert.match(cart, /contents:/);
  assert.match(shop, /trackMeta\("Search"/);
  assert.match(pixel, /trackMeta\("Contact"/);
  assert.match(contact, /trackMetaWithUser\("Lead"/);
  assert.doesNotMatch(home, /trackMeta\("Lead"/);
});

test("CAPI remains server-only and deduplicates verified Purchase", async () => {
  const [capi, purchase, paypal, flutterwave] = await Promise.all([
    read("app/api/meta/events/route.ts"),
    read("app/lib/meta-purchase.ts"),
    read("app/api/paypal/orders/[orderId]/capture/route.ts"),
    read("app/lib/flutterwave.ts"),
  ]);
  assert.match(capi, /process\.env\.META_CAPI_ACCESS_TOKEN/);
  assert.match(capi, /event_id: body\.eventId/);
  assert.match(capi, /action_source: "website"/);
  assert.match(capi, /client_ip_address/);
  assert.match(capi, /client_user_agent/);
  assert.match(purchase, /eventId = `purchase:\$\{order\.id\}`/);
  assert.match(purchase, /notification_type: "meta_purchase"/);
  assert.match(purchase, /payment_status", "paid"/);
  assert.match(paypal, /sendVerifiedPurchaseForOrder/);
  assert.match(flutterwave, /sendVerifiedPurchaseForOrder/);
  assert.doesNotMatch(`${capi}\n${purchase}`, /NEXT_PUBLIC_META/);
});

test("fbc is created only from a real fbclid", async () => {
  const pixel = await read("app/components/meta-pixel.tsx");
  const capi = await read("app/api/meta/events/route.ts");
  assert.match(pixel, /if \(fbclid &&/);
  assert.match(pixel, /cookies\._fbc = `fb\.1\.\$\{Date\.now\(\)\}\.\$\{fbclid\}`/);
  assert.match(capi, /sourceFbclid \? `fb\.1\.\$\{Date\.now\(\)\}\.\$\{sourceFbclid\}` : undefined/);
});
