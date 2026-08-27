import type { Metadata } from "next";
import Image from "next/image";
import { PremiumHeader } from "../components/premium-header";
import { SiteFooter } from "../components/site-footer";

export const metadata: Metadata = {
  title: "Women's Size Chart & Measurement Guide",
  description: "Use the official Afro.Fashionstyle US women's size chart and measurement guide to find your fit for Nigerian dresses, two-piece outfits and occasion wear.",
  alternates: { canonical: "/size-guide" },
};

export default function SizeGuidePage() {
  return <main><PremiumHeader/><article className="policy-page size-guide-page"><span className="eyebrow">Official body measurement guide</span><h1>Find your best fit.</h1><p>Use the chart below as your starting point. Measurements are body measurements in inches, not finished garment measurements. If you fall between sizes or would like help, send us your measurements before completing your order.</p>
    <figure className="size-chart-image"><Image src="/afro-fashionstyle-size-chart.png" alt="Afro.Fashionstyle official women's and men's US size chart in inches" width={1280} height={480} priority sizes="(max-width: 860px) calc(100vw - 32px), 920px"/><figcaption>Afro.Fashionstyle official US size guide · All measurements are in inches.</figcaption></figure>
    <div className="size-table-wrap"><table className="size-table"><caption>Women&apos;s body measurement guide</caption><thead><tr><th>US size</th><th>Bust</th><th>Waist</th><th>Hips</th></tr></thead><tbody><tr><th>XS (0–2)</th><td>32–33.5</td><td>24–25.5</td><td>34.5–36</td></tr><tr><th>S (4–6)</th><td>34–35.5</td><td>26–27.5</td><td>36.5–38</td></tr><tr><th>M (8–10)</th><td>36–38</td><td>28–30</td><td>38.5–40.5</td></tr><tr><th>L (12–14)</th><td>38.5–40.5</td><td>31–33</td><td>41–43</td></tr><tr><th>XL (16–18)</th><td>41–43</td><td>34–36</td><td>43.5–45.5</td></tr><tr><th>1X (20)</th><td>44–46</td><td>37–39</td><td>46.5–48.5</td></tr></tbody></table></div>
    <h2>Measurements to send</h2><p>Bust, waist, full hip, shoulder width, shoulder-to-waist, sleeve length, upper arm circumference, dress or trouser length, and your height.</p>
    <h2>How to measure</h2><p>Use a soft measuring tape over bare skin or light clothing. Keep the tape level and comfortably close to the body without pulling tight. Ask another person to help where possible.</p>
    <h2>Unsure of your size?</h2><p>Send your measurements through <a href="https://wa.me/2347049841931?text=Hello%20Afro.Fashionstyle%2C%20I%20need%20help%20with%20my%20measurements." target="_blank" rel="noreferrer">WhatsApp</a> before completing your order. Support is available 24/7.</p>
  </article><SiteFooter/></main>;
}
