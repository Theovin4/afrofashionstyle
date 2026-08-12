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

test("catalog exposes only the five approved categories", async () => {
  const [catalog, shop, admin, migration] = await Promise.all([
    read("app/lib/catalog.ts"),
    read("app/shop/page.tsx"),
    read("app/admin/page.tsx"),
    read("supabase/migrations/20260807120000_enforce_five_product_categories.sql"),
  ]);
  for (const category of ["Dresses", "Two piece", "Lace Outfit", "Other Luxury Designs", "Accessories"]) {
    assert.match(catalog, new RegExp(category));
    assert.match(migration, new RegExp(category));
  }
  assert.match(shop, /PRODUCT_CATEGORIES/);
  assert.match(admin, /PRODUCT_CATEGORIES/);
  assert.doesNotMatch(shop, /new Set\(products\.map/);
});

test("Turnstile stays secure without covering the newsletter form", async () => {
  const [turnstile, home, css] = await Promise.all([
    read("app/components/turnstile.tsx"),
    read("app/page.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(turnstile, /data-appearance="interaction-only"/);
  assert.match(turnstile, /data-size="flexible"/);
  assert.match(home, /newsletter-fields/);
  assert.match(css, /\.turnstile-slot/);
});

test("administrator login is fixed-account, rate-limited, MFA-safe and recoverable", async () => {
  const [login, loginPage, recovery, callback, reset] = await Promise.all([
    read("app/api/admin/login/route.ts"),
    read("app/admin-login/page.tsx"),
    read("app/api/admin/password-reset/route.ts"),
    read("app/auth/callback/route.ts"),
    read("app/admin-reset/password-form.tsx"),
  ]);
  assert.match(login, /email !== configuredEmail/);
  assert.match(login, /reason: "security_check"/);
  assert.doesNotMatch(login, /console\.(?:log|info|warn|error).*\{ email/);
  assert.match(loginPage, /readOnly/);
  assert.match(loginPage, /Forgot your password/);
  assert.match(recovery, /admin-password-reset", 3, 60 \* 60/);
  assert.match(recovery, /resetPasswordForEmail/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /next.*=== "\/admin-reset"/s);
  assert.match(reset, /updateUser\(\{ password \}\)/);
  assert.match(reset, /signOut\(\{ scope: "local" \}\)/);
});
