export type SeoBlogPlan = {
  title: string;
  targetKeyword: string;
  market: "USA" | "UK" | "USA & UK";
  targetWords: 1000;
  outline: string[];
};

/** Editorial briefs for original, expert-reviewed 1,000-word journal articles. */
export const SEO_BLOG_PLANS: SeoBlogPlan[] = [
  {
    title: "Ankara Dresses in the USA: A Complete Guide to Choosing Your Perfect Style",
    targetKeyword: "ankara dresses usa", market: "USA", targetWords: 1000,
    outline: ["H2: Why Ankara dresses stand out in American occasion wear", "H2: How to choose an Ankara silhouette for your event", "H2: US sizing and the measurements that matter", "H2: Styling Ankara for weddings, dinners and cultural celebrations", "H2: Ordering online, USD payment and tracked USA delivery", "H2: Ankara dress care and colour protection"],
  },
  {
    title: "African Clothing in the UK: What to Wear for Weddings and Special Events",
    targetKeyword: "african clothing uk", market: "UK", targetWords: 1000,
    outline: ["H2: The place of African fashion in modern UK wardrobes", "H2: Choosing clothing for weddings, receptions and naming ceremonies", "H2: Ankara, Adire and lace compared", "H2: Understanding UK sizing and body measurements", "H2: Shopping in GBP and arranging tracked UK delivery", "H2: Building a polished occasion look"],
  },
  {
    title: "How to Choose a Kente Gown for a Wedding in the USA or UK",
    targetKeyword: "kente gown for wedding", market: "USA & UK", targetWords: 1000,
    outline: ["H2: What makes Kente appropriate for a wedding", "H2: Selecting colour and pattern with intention", "H2: Kente gown silhouettes for guests and family", "H2: Jewellery, shoes and headwear that complement Kente", "H2: Measurement and comfort checks before ordering", "H2: International payment and delivery planning"],
  },
  {
    title: "Nigerian Lace Outfits: An Elegant Guide for Weddings and Celebrations",
    targetKeyword: "Nigerian lace outfits", market: "USA & UK", targetWords: 1000,
    outline: ["H2: Why Nigerian lace remains an occasion favourite", "H2: Understanding texture, lining and embellishment", "H2: Modern lace silhouettes for women", "H2: Choosing a colour for the event and season", "H2: Coordinating gele, jewellery and footwear", "H2: Fit, care and international delivery"],
  },
  {
    title: "George Fabric Outfits: Styling Nigerian Luxury for Modern Occasions",
    targetKeyword: "George fabric outfits", market: "USA & UK", targetWords: 1000,
    outline: ["H2: The heritage and visual character of George fabric", "H2: George wrappers, blouses and contemporary designs", "H2: Choosing colours and embroidery", "H2: Styling George for traditional weddings", "H2: Measurements and movement for a comfortable fit", "H2: Caring for richly decorated fabrics"],
  },
  {
    title: "Aso Ebi Style Guide for Wedding Guests in the USA and UK",
    targetKeyword: "aso ebi styles", market: "USA & UK", targetWords: 1000,
    outline: ["H2: What Aso Ebi means at a Nigerian celebration", "H2: Respecting the couple’s colour and fabric direction", "H2: Choosing a distinctive silhouette without overstepping", "H2: Gele, accessories and beauty styling", "H2: Coordinating measurements across an overseas group", "H2: Planning payment, preparation and delivery early"],
  },
  {
    title: "How to Style Gele with Ankara, Lace and Aso Ebi",
    targetKeyword: "gele accessories", market: "USA & UK", targetWords: 1000,
    outline: ["H2: How gele completes a Nigerian occasion look", "H2: Matching without making every colour identical", "H2: Gele proportions for different necklines and faces", "H2: Jewellery choices for a balanced finish", "H2: Comfortable tying and all-day wear", "H2: Packing and protecting gele for travel"],
  },
  {
    title: "Traditional Couple Uniforms: How to Coordinate Without Looking Identical",
    targetKeyword: "traditional couple uniforms", market: "USA & UK", targetWords: 1000,
    outline: ["H2: What coordinated traditional dressing communicates", "H2: Choosing one shared colour or textile story", "H2: Balancing each partner’s individual silhouette", "H2: Coordinating embroidery and accessories", "H2: Measurement checklist for both partners", "H2: Timeline for an overseas wedding or celebration"],
  },
  {
    title: "Traditional Wedding Uniforms: A Planning Guide for Families and Bridal Parties",
    targetKeyword: "traditional wedding uniforms", market: "USA & UK", targetWords: 1000,
    outline: ["H2: Defining the family and bridal-party dress direction", "H2: Selecting fabric, colour and embellishment", "H2: Creating cohesion across different body types", "H2: Collecting accurate measurements from a group", "H2: Budget, payment and order deadlines", "H2: Distribution and tracked international delivery"],
  },
  {
    title: "Adire vs Ankara: Which African Fabric Is Right for Your Next Outfit?",
    targetKeyword: "Adire and Ankara dresses", market: "USA & UK", targetWords: 1000,
    outline: ["H2: Understanding the origins of Adire and Ankara", "H2: Comparing pattern, colour and visual texture", "H2: The best silhouettes for each textile", "H2: Choosing for weddings, work and celebrations", "H2: Styling each fabric for a contemporary look", "H2: Care, sizing and shopping online internationally"],
  },
];
