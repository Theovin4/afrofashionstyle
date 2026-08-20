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
    read("app/shop/shop-client.tsx"),
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
    read("app/shop/shop-client.tsx"),
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

test("indexing uses server-rendered products and consolidates duplicate journal URLs", async () => {
  const [shopPage, sitemap, journalPost, publisher] = await Promise.all([
    read("app/shop/page.tsx"),
    read("app/sitemap.ts"),
    read("app/journal/[slug]/page.tsx"),
    read("app/lib/blog.ts"),
  ]);
  assert.match(shopPage, /createPublicSupabase/);
  assert.match(shopPage, /<ShopClient products=\{products\}/);
  assert.match(sitemap, /seenTitles/);
  assert.match(journalPost, /permanentRedirect/);
  assert.match(journalPost, /getCanonicalPost/);
  assert.match(publisher, /eq\("title", topic\.title\)/);
  assert.doesNotMatch(publisher, /dateKey/);
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
  assert.match(login, /cookie\.name\.startsWith\("sb-"\)/);
  assert.match(login, /reason: "security_check"/);
  assert.doesNotMatch(login, /console\.(?:log|info|warn|error).*\{ email/);
  assert.match(loginPage, /readOnly/);
  assert.match(loginPage, /Forgot your password/);
  const adminStudio = await read("app/admin/page.tsx");
  assert.match(adminStudio, /href="\/admin-reset">Change password/);
  assert.match(adminStudio, /className="admin-signout" action="\/api\/admin\/logout" method="post"/);
  assert.match(recovery, /admin-password-reset", 3, 60 \* 60/);
  assert.match(recovery, /resetPasswordForEmail/);
  assert.match(callback, /exchangeCodeForSession/);
  assert.match(callback, /next.*=== "\/admin-reset"/s);
  assert.match(reset, /updateUser\(\{ password: normalizedPassword \}\)/);
  assert.match(reset, /normalize\("NFKC"\)\.trim\(\)/);
  assert.match(reset, /Passwords match/);
  assert.match(reset, /Show password/);
  assert.match(reset, /signOut\(\{ scope: "local" \}\)/);
});

test("secure direct Cloudinary uploads are permitted by the site policy", async () => {
  const [config, adminStudio] = await Promise.all([
    read("next.config.ts"),
    read("app/admin/page.tsx"),
  ]);
  assert.match(config, /connect-src[^\n]+https:\/\/api\.cloudinary\.com/);
  assert.match(adminStudio, /https:\/\/api\.cloudinary\.com\/v1_1/);
  assert.match(adminStudio, /cloudinaryPublicId/);
});

test("storefront sales copy and administrator actions remain launch-visible", async () => {
  const [home, css] = await Promise.all([
    read("app/page.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(home, /Nigerian elegance/);
  assert.match(home, /crafted to your measurements and delivered with tracking/);
  assert.match(css, /\.admin-shell \.admin-header-actions>button\{[^}]+color:#1b0d08!important/);
  assert.match(css, /\.admin-shell \.admin-signout button\{[^}]+color:#ffe7e3!important/);
});

test("checkout and customer forms use the premium secure form system", async () => {
  const [checkout, contact, tracking, css] = await Promise.all([
    read("app/checkout/page.tsx"),
    read("app/contact/page.tsx"),
    read("app/orders/track/page.tsx"),
    read("app/globals.css"),
  ]);
  assert.match(checkout, /className="delivery-form"/);
  assert.match(checkout, /aria-pressed=\{gateway === "Flutterwave"\}/);
  assert.match(checkout, /aria-label="Apply discount code"/);
  assert.match(contact, /autoComplete="name"/);
  assert.match(tracking, /autoComplete="email"/);
  assert.match(css, /Premium, accessible forms across commerce, support and Studio/);
  assert.match(css, /html\[data-theme="dark"\] \.checkout-form/);
  assert.match(css, /\.gateway-selector button\.active/);
  assert.match(css, /html\[data-theme="dark"\] \.commerce-header\{background:#17100e/);
  assert.match(css, /\.commerce-header \.brand-logo-artwork\{background:#fffdf9/);
});

test("checkout provides verified address selectors and resilient Flutterwave startup", async () => {
  const [checkout, locations, flutterwave, orders] = await Promise.all([
    read("app/checkout/page.tsx"),
    read("app/api/locations/route.ts"),
    read("app/api/flutterwave/checkout/route.ts"),
    read("app/lib/orders.ts"),
  ]);
  assert.match(checkout, /State \/ region<select/);
  assert.match(checkout, /City<select/);
  assert.match(checkout, /postalCodes\.length > 1/);
  assert.match(locations, /countriesnow\.space/);
  assert.match(locations, /api\.zippopotam\.us/);
  assert.match(locations, /enforceRateLimit/);
  assert.match(flutterwave, /FLUTTERWAVE_SECRET_KEY\?\.trim\(\)/);
  assert.match(flutterwave, /await response\.text\(\)/);
  assert.match(flutterwave, /payment_status: "failed"/);
  assert.match(orders, /state: input\.customer\.state\.trim\(\)/);
});

test("crypto checkout is manual, proof-gated and administrator reviewed", async () => {
  const [checkout, crypto, adminOrders, proof, migration, privacy] = await Promise.all([
    read("app/checkout/page.tsx"),
    read("app/api/crypto/checkout/route.ts"),
    read("app/api/admin/orders/route.ts"),
    read("app/api/admin/crypto-proof/route.ts"),
    read("supabase/migrations/20260820233000_add_crypto_payment_review.sql"),
    read("app/privacy/page.tsx"),
  ]);
  assert.match(checkout, /USDT · TRON \(TRC20\)/);
  assert.match(checkout, /Submit proof and confirm on WhatsApp/);
  assert.match(crypto, /allowedProofTypes/);
  assert.match(crypto, /type: "authenticated"/);
  assert.match(crypto, /addresses\[network\]/);
  assert.match(crypto, /enforceRateLimit/);
  assert.match(adminOrders, /cryptoDecision/);
  assert.match(adminOrders, /completeOrder/);
  assert.match(proof, /await isAdmin/);
  assert.match(proof, /sign_url: true/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all.*anon, authenticated/);
  assert.match(privacy, /Never upload a wallet password/);
});
