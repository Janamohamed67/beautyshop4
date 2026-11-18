/* ==========================================================
   products.js  -  shared product data
   Used by: index.html, products.html, product-details.html
   Jana's cart.js should read products from this same array.
   "color" is the tile colour behind each picture. Pictures are
   simple SVG illustrations in  (replace with real photos if you like).
   ========================================================== */
const products = [
  { id: 1,  name: "Velvet Matte Lipstick",   category: "Makeup",    price: 180, color: "#c2344f", image: "lipstick.svg",
    description: "A creamy matte lipstick with rich colour that lasts through the day without drying your lips." },
  { id: 2,  name: "Glow Liquid Foundation",  category: "Makeup",    price: 320, color: "#e0b08c", image: "foundation.svg",
    description: "Lightweight liquid foundation with medium coverage and a natural, healthy-looking finish." },
  { id: 3,  name: "Volume Lash Mascara",     category: "Makeup",    price: 150, color: "#2b2230", image: "mascara.svg",
    description: "Smudge-proof mascara that lifts and thickens lashes without clumping." },
  { id: 4,  name: "Rose Blush Palette",      category: "Makeup",    price: 240, color: "#e98a9c", image: "blush.svg",
    description: "Three buildable blush shades for a soft, fresh flush on every skin tone." },
  { id: 5,  name: "Hydra Face Moisturizer",  category: "Skincare",  price: 280, color: "#9fd3d6", image: "moisturizer.svg",
    description: "Daily gel-cream with hyaluronic acid that keeps skin soft and hydrated for 24 hours." },
  { id: 6,  name: "Vitamin C Serum",         category: "Skincare",  price: 360, color: "#f0a54a", image: "serum.svg",
    description: "Brightening serum that helps even out skin tone and reduce the look of dark spots." },
  { id: 7,  name: "Gentle Foam Cleanser",    category: "Skincare",  price: 170, color: "#c9e4c5", image: "cleanser.svg",
    description: "A mild foaming cleanser that removes makeup and dirt without tightening the skin." },
  { id: 8,  name: "SPF 50 Daily Sunscreen",  category: "Skincare",  price: 260, color: "#f6d77a", image: "sunscreen.svg",
    description: "Lightweight, non-greasy sun protection that sits well under makeup." },
  { id: 9,  name: "Oud & Rose Perfume",      category: "Fragrance", price: 550, color: "#7a3b57", image: "perfume.svg",
    description: "A warm floral-woody eau de parfum with notes of rose, oud and vanilla." },
  { id: 10, name: "Fresh Citrus Body Mist",  category: "Fragrance", price: 190, color: "#f4b860", image: "mist.svg",
    description: "A light, refreshing body mist with lemon, orange blossom and white musk." },
  { id: 11, name: "Argan Hair Oil",          category: "Hair Care", price: 210, color: "#b9772e", image: "hair-oil.svg",
    description: "Nourishing argan oil that tames frizz and adds shine to dry or coloured hair." },
  { id: 12, name: "Repair Shampoo",          category: "Hair Care", price: 140, color: "#8aa4d6", image: "shampoo.svg",
    description: "Strengthening shampoo for damaged hair, enriched with keratin and biotin." }
];
