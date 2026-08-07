import { createAdminSupabase } from "./supabase";

const TOPICS = [
  {
    title: "How to Style Ankara Dresses for a Modern Occasion",
    excerpt: "A considered guide to balancing vibrant Ankara prints with refined accessories, confident proportions and occasion-ready polish.",
    content: `Ankara is expressive by nature, so the most elegant styling begins with intention. Let the print lead, then choose accessories that echo one or two colours already present in the fabric.

For weddings and celebrations, pair a sculpted Ankara dress with a clean heel and a compact bag. Gold jewellery brings warmth to orange, brown and jewel-toned prints, while silver can sharpen teal and cooler palettes.

Fit matters as much as colour. A defined waist, thoughtful sleeve and hem length create a confident silhouette without competing with the textile. If you are between sizes, send your measurements before ordering because every Afro.Fashionstyle piece is made on request.

Complete the look with restraint: one strong earring, a polished shoe and a beauty look that feels like you. Nigerian fashion is not a costume; it is a living design language made to move beautifully through modern life.`,
  },
  {
    title: "The Living Language of Adire in Contemporary Womenswear",
    excerpt: "Discover the Yoruba heritage behind Adire and how hand-resist patterns translate into modern dresses, sets and occasion pieces.",
    content: `Adire, meaning “tie and dye” in Yoruba, is one of Nigeria’s most recognisable textile traditions. Its indigo fields and resist-dyed markings carry the hand of the maker, making every length of cloth feel personal.

Contemporary Adire womenswear respects that heritage while exploring modern proportion. A wrap dress gives the textile movement. A clean column silhouette allows intricate motifs to remain the focus. Coordinated sets make the cloth easy to style across work, travel and celebration.

Because pattern placement changes from one cut to another, no two garments read in exactly the same way. That natural variation is part of the luxury: your piece holds its own visual rhythm.

Care for Adire gently. Wash cool with a mild detergent, avoid prolonged soaking and dry away from harsh sunlight. Good care protects both colour and story.`,
  },
  {
    title: "A Guide to Nigerian Occasion Wear for Weddings and Celebrations",
    excerpt: "Choose a memorable Nigerian-inspired look for weddings, milestone dinners and cultural celebrations without sacrificing comfort.",
    content: `The best occasion wear creates presence without asking you to manage it all evening. Begin with the event: a daytime ceremony rewards breathable fabric and lighter structure, while evening celebrations can carry richer colour, volume and embellishment.

For a modern Nigerian wedding guest look, consider a statement sleeve, a precise neckline or a full skirt—then allow one detail to lead. Ankara and Adire already offer visual richness, so a disciplined silhouette keeps the result premium.

Comfort is part of elegance. Check the finished garment measurements, consider the shoes you will wear and share your bust, waist, hip and height when uncertain. Made-to-order construction gives you the opportunity to plan rather than compromise.

Finish with accessories that support the outfit instead of repeating every colour. The goal is a complete point of view: joyful, assured and distinctly yours.`,
  },
  {
    title: "How to Measure for a Made-to-Order African Dress",
    excerpt: "A practical measurement guide for ordering Nigerian and African-inspired dresses online with greater confidence.",
    content: `Accurate measurements make online made-to-order shopping simpler. Use a soft measuring tape over light clothing and stand naturally without pulling the tape too tightly.

Measure the fullest part of your bust, the narrowest point of your natural waist and the fullest part of your hips. For dress length, measure from the highest shoulder point to your preferred hem. Your height and usual US or UK dress size add helpful context.

Ask someone to assist when possible, especially for shoulder width, sleeve length and back measurements. Record each number twice before sending it.

Afro.Fashionstyle encourages customers to forward measurements whenever they are unsure of size. Because garments are made on request and are not eligible for returns or refunds, a careful fit check before production is always worthwhile.`,
  },
] as const;

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function productDescription(name: string, category: string) {
  return `${name} is a made-to-order ${category.toLowerCase()} design by Afro.Fashionstyle. It is produced in Lagos for weddings, celebrations and occasion dressing, with tracked delivery available to customers in the USA and UK. Production takes 5–7 working days. If you are unsure of your size, send your bust, waist, hip and height measurements before ordering.`;
}

export async function publishDailyBlogPost() {
  const supabase = createAdminSupabase();
  const today = new Date();
  const topic = TOPICS[Math.floor(today.getTime() / 86_400_000) % TOPICS.length];
  const dateKey = today.toISOString().slice(0, 10);
  const slug = `${slugify(topic.title)}-${dateKey}`;
  const { data: existing } = await supabase.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
  if (existing) return { post: existing, created: false };
  const { data, error } = await supabase.from("blog_posts").insert({
    ...topic,
    slug,
    topic: "Nigerian Fashion",
    status: "published",
    seo_title: `${topic.title} | Afro.Fashionstyle Journal`,
    seo_description: topic.excerpt,
    published_at: today.toISOString(),
  }).select("id,slug,title").single();
  if (error) throw error;
  return { post: data, created: true };
}
