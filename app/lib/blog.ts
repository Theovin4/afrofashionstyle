import { createAdminSupabase } from "./supabase";
import { SEO_BLOG_PLANS } from "./seo-blog-plan";

export const TOPICS = [
  {
    title: "How to Style Ankara Dresses for a Modern Occasion",
    excerpt: "A considered guide to balancing vibrant Ankara prints with refined accessories, confident proportions and occasion-ready polish.",
    content: `Ankara is expressive by nature, so the most elegant styling begins with intention. Let the print lead, then choose accessories that echo one or two colours already present in the fabric.

For weddings and celebrations, pair a sculpted Ankara dress with a clean heel and a compact bag. Gold jewellery brings warmth to orange, brown and jewel-toned prints, while silver can sharpen teal and cooler palettes.

Fit matters as much as colour. A defined waist, thoughtful sleeve and hem length create a confident silhouette without competing with the textile. If you are between sizes, send your measurements before ordering so our team can help you choose confidently.

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

Comfort is part of elegance. Check the finished garment measurements, consider the shoes you will wear and share your bust, waist, hip and height when uncertain. Thoughtful preparation gives you the opportunity to plan rather than compromise.

Finish with accessories that support the outfit instead of repeating every colour. The goal is a complete point of view: joyful, assured and distinctly yours.`,
  },
  {
    title: "How to Measure for an African Dress Online",
    excerpt: "A practical measurement guide for choosing Nigerian and African-inspired dresses online with greater confidence.",
    content: `Accurate measurements make online dress shopping simpler. Use a soft measuring tape over light clothing and stand naturally without pulling the tape too tightly.

Measure the fullest part of your bust, the narrowest point of your natural waist and the fullest part of your hips. For dress length, measure from the highest shoulder point to your preferred hem. Your height and usual US or UK dress size add helpful context.

Ask someone to assist when possible, especially for shoulder width, sleeve length and back measurements. Record each number twice before sending it.

Afro.Fashionstyle encourages customers to forward measurements whenever they are unsure of size. Because outfits are final sale, a careful fit check before preparation is always worthwhile.`,
  },
] as const;

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function productDescription(name: string, category: string) {
  const productType = ({
    "Dresses": "Nigerian dress",
    "Two piece": "coordinated two-piece outfit",
    "Lace Outfit": "Nigerian lace outfit",
    "Other Luxury Designs": "luxury Nigerian fashion design",
    "Accessories": "African-inspired accessory",
  } as Record<string, string>)[category] || "Nigerian fashion design";
  return `${name} is a premium ${productType} by Afro.Fashionstyle, created for celebrations and confident occasion dressing. Expressive Nigerian influence and a distinctive silhouette give the piece memorable presence, with tracked delivery across the USA and UK. Allow 5–7 working days before dispatch, and send your measurements if you would like help choosing the right size.`;
}

export async function publishDailyBlogPost() {
  const supabase = createAdminSupabase();
  const today = new Date();
  const utcDate = today.toISOString().slice(0, 10);
  const { data: publishedToday } = await supabase.from("blog_posts").select("id,slug,title")
    .eq("status", "published").gte("published_at", `${utcDate}T00:00:00.000Z`).lt("published_at", `${utcDate}T23:59:59.999Z`).limit(1).maybeSingle();
  if (publishedToday) return { post: publishedToday, created: false, reason: "Daily edition already published" };

  const { data: queuedDraft } = await supabase.from("blog_posts").select("id,title,slug,excerpt,content")
    .eq("status", "draft").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (queuedDraft) {
    const { data: published, error: publishError } = await supabase.from("blog_posts").update({ status: "published", published_at: today.toISOString() })
      .eq("id", queuedDraft.id).eq("status", "draft").select("id,slug,title").single();
    if (publishError) throw publishError;
    return { post: published, created: false, reason: "Published the next administrator-reviewed draft" };
  }

  const dayNumber = Math.floor(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) / 86_400_000);
  const plan = SEO_BLOG_PLANS[dayNumber % SEO_BLOG_PLANS.length];
  const displayDate = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(today);
  const title = `${plan.title}: ${displayDate} Style Desk`;
  const slug = `${slugify(plan.title)}-${utcDate}`;
  const marketDelivery = plan.market === "UK" ? "UK customers can check out in GBP with tracked delivery in 3–7 working days." : plan.market === "USA" ? "USA customers can check out in USD with tracked delivery in 5–7 working days." : "Customers in the USA and UK can shop in USD or GBP and receive tracked delivery.";
  const sections = plan.outline.map((heading, index) => {
    const cleanHeading = heading.replace(/^H2:\s*/, "");
    const guidance = [
      `Start with the occasion, the dress direction and the level of formality. ${cleanHeading} is easier to approach when colour, silhouette and comfort are considered together rather than as separate decisions.`,
      `A premium result depends on proportion and restraint. Let the textile or principal design detail lead, then use jewellery, footwear and headwear to support it without competing for attention.`,
      `Fit should be confirmed before payment. Compare bust, waist and hip measurements with the Afro.Fashionstyle size guide, and send your measurements through WhatsApp whenever a standard size does not describe you accurately.`,
      `For an overseas celebration, work backwards from the event date. Allow time for preparation, tracked delivery and a final styling check so the outfit arrives as a considered part of the occasion rather than a last-minute decision.`,
      `Fabric care protects colour, structure and embellishment. Follow the garment instructions, store the piece away from damp and direct sunlight, and avoid harsh cleaning methods that can weaken decorative finishes.`,
      `${marketDelivery} PayPal, Flutterwave and reviewed cryptocurrency payments are available through the secure website checkout.`,
    ][index % 6];
    return `${cleanHeading}\n\n${guidance}`;
  }).join("\n\n");
  const topic = {
    title,
    excerpt: `Today’s Afro.Fashionstyle guide to ${plan.targetKeyword}, written for ${plan.market === "USA & UK" ? "USA and UK" : plan.market} shoppers planning a confident Nigerian occasion look.`,
    content: `${plan.title}\n\nAfrican and Nigerian occasion wear is most successful when heritage, personal style and practical planning are treated with equal care. This edition focuses on clear choices customers can use before ordering.\n\n${sections}\n\nAfro.Fashionstyle support is available 24/7 for sizing, measurements and delivery questions. Review the size guide and confirm every order detail before payment because confirmed outfit sales are final, except where applicable consumer law provides otherwise.`,
  };
  const { data, error } = await supabase.from("blog_posts").insert({
    ...topic,
    slug,
    topic: plan.targetKeyword,
    status: "published",
    seo_title: `${topic.title} | Afro.Fashionstyle Journal`,
    seo_description: topic.excerpt,
    published_at: today.toISOString(),
  }).select("id,slug,title").single();
  if (error) throw error;
  return { post: data, created: true };
}
