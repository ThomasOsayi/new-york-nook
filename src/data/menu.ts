export interface MenuItem {
  name: string;
  desc?: string;
  price: number;
  img: string;
  tags?: ("popular" | "new" | "spicy" | "gf" | "v")[];
}

export interface MenuCategory {
  key: string;
  label: string;
  img: string;
}

export const categories: MenuCategory[] = [
  { key: "coldAppetizers", label: "Cold Appetizers", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&q=80" },
  { key: "salads",         label: "Salads",          img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&q=80" },
  { key: "soups",          label: "Soups",            img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&q=80" },
  { key: "hotAppetizers",  label: "Hot Appetizers",   img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&q=80" },
  { key: "mains",          label: "Main Course",      img: "https://images.unsplash.com/photo-1558030006-450675393462?w=500&q=80" },
  { key: "desserts",       label: "Desserts",         img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&q=80" },
  { key: "drinks",         label: "Drinks",           img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=80" },
];

export const menuData: Record<string, MenuItem[]> = {
  coldAppetizers: [
    { name: "Salmon Tartare",       desc: "salmon, onion, capers, lemon, mayonnaise, dressing",      price: 21, img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",   tags: ["popular", "gf"] },
    { name: "Satsivi",              desc: "chicken broth, chicken, walnuts, spices",                  price: 18, img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80" },
    { name: "Tuna Tartare",         desc: "tuna, onion, capers, lemon, avocado, dressing",            price: 21, img: "https://images.unsplash.com/photo-1579631542720-3a87824fff86?w=400&q=80",   tags: ["gf"] },
    { name: "Meat Plate",           desc: "smoked duck breast, prosciutto, smoked Wagyu Beef",        price: 22, img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80" },
    { name: "Hamachi",              desc: "yellowtail, ponzu sauce, jalapeños",                       price: 23, img: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=400&q=80",   tags: ["new", "gf", "spicy"] },
    { name: "Burrata",              desc: "burrata, tomatoes, basil, olive oil, balsamic vinegar",    price: 21, img: "https://images.unsplash.com/photo-1608032077018-c9aad9565d2b?w=400&q=80",   tags: ["v", "gf"] },
    { name: "Crab Tower",           desc: "crabmeat, avocado, dressing",                              price: 24, img: "https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=400&q=80",     tags: ["popular"] },
    { name: "Pâté",                 desc: "chicken liver, carrot, onion, apple, butter · brioche bun", price: 16, img: "https://images.unsplash.com/photo-1608039829572-fa24f5d1e6ea?w=400&q=80" },
    { name: "Fish Plate",           desc: "smoked salmon, smoked mackerel",                           price: 20, img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80" },
    { name: "Crepes with Caviar",   desc: "4 pieces · red $20 / black $59",                           price: 20, img: "https://images.unsplash.com/photo-1635146037526-a75e6905ad78?w=400&q=80" },
    { name: "Forshmak",             desc: "herring spread, green apple, onion, baguette, butter",     price: 10, img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&q=80" },
    { name: "Marinated Mushrooms",  desc: "white mushrooms, onion, oil, vinegar, sugar",              price: 12, img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80",   tags: ["v", "gf"] },
  ],
  salads: [
    { name: "Greek Salad",               desc: "tomatoes, cucumbers, onion, feta, olives, bell peppers", price: 17, img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80",   tags: ["v", "gf"] },
    { name: "Endive Salad",              desc: "green apple, arugula, toasted walnuts, sherry vinegar",  price: 22, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",   tags: ["v"] },
    { name: "Crawfish Salad",            desc: "crawfish, avocado, mayonnaise, dressing",                price: 20, img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&q=80",     tags: ["popular"] },
    { name: "Three Colors Beet Salad",   desc: "beets, mixed greens, goat cheese, dressing",             price: 18, img: "https://images.unsplash.com/photo-1607532941433-304659e8198a?w=400&q=80",   tags: ["v", "gf"] },
    { name: "Marinated Vegetables",      desc: "assorted seasonal vegetables",                           price: 15, img: "https://images.unsplash.com/photo-1543339308-d595ac3be76c?w=400&q=80",     tags: ["v", "gf"] },
  ],
  soups: [
    { name: "Borscht",        desc: "with pampushky and garlic sauce",    price: 14, img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80",   tags: ["popular"] },
    { name: "Mushroom Soup",  desc: "porcini mushroom and barley",        price: 14, img: "https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=400&q=80", tags: ["v"] },
    { name: "Kharcho",        desc: "traditional soup with lamb",          price: 15, img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&q=80", tags: ["spicy"] },
    { name: "Lobster Bisque", desc: "rich and creamy lobster soup",        price: 16, img: "https://images.unsplash.com/photo-1594756202469-9ff9799b2e4e?w=400&q=80", tags: ["popular", "gf"] },
  ],
  hotAppetizers: [
    { name: "Homemade Potatoes",      desc: "chef's preparation",                                   price: 14, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",   tags: ["v", "gf"] },
    { name: "Potatoes for Two",       desc: "with chanterelles",                                    price: 26, img: "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&q=80",   tags: ["v"] },
    { name: "Chebureki / Belyashi",   desc: "with Wagyu Beef",                                      price: 6,  img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80" },
    { name: "Crepes with Duck",       desc: "4 pieces · dried fruits and dressing",                  price: 24, img: "https://images.unsplash.com/photo-1635146037526-a75e6905ad78?w=400&q=80" },
    { name: "Pelmeni",                desc: "with beef and chicken",                                 price: 20, img: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80",   tags: ["popular"] },
    { name: "Vareniki",               desc: "with potatoes and cabbage",                             price: 20, img: "https://images.unsplash.com/photo-1587049016823-69ef9d68bd44?w=400&q=80",   tags: ["v"] },
    { name: "Pasta Seafood",          desc: "chef's seafood selection",                              price: 29, img: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&q=80" },
    { name: "Shrimp Scampi",          desc: "classic preparation",                                   price: 24, img: "https://images.unsplash.com/photo-1625943553852-781c6dd46faa?w=400&q=80" },
    { name: "Beverly Hills Soufflé",  desc: "shrimp, scallop, julien vegetables, lobster bisque",    price: 32, img: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80",   tags: ["new"] },
    { name: "Grilled Octopus Salad",  desc: "tender octopus, fresh greens",                          price: 24, img: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=400&q=80" },
  ],
  mains: [
    { name: "Salmon with Sauce",          desc: "chef's signature sauce",           price: 24, img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80",   tags: ["gf"] },
    { name: "Branzino Grilled",           desc: "whole grilled branzino",            price: 26, img: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&q=80",   tags: ["gf"] },
    { name: "French Rack of Lamb",        desc: "4 pieces, herb-crusted",            price: 30, img: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80",   tags: ["popular"] },
    { name: "Ribeye Steak",               desc: "prime cut, chargrilled",             price: 38, img: "https://images.unsplash.com/photo-1558030006-450675393462?w=400&q=80",     tags: ["popular", "gf"] },
    { name: "Beef Stroganoff",            desc: "classic Russian preparation",        price: 24, img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" },
    { name: "Lemon Chicken",              desc: "chicken breast, citrus glaze",       price: 20, img: "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&q=80",   tags: ["gf"] },
    { name: "Short Ribs (24hr advance)",  desc: "for 5–6 people",                    price: 160, img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80" },
  ],
  desserts: [
    { name: "Apple Strudel",          desc: "with vanilla ice cream",       price: 12, img: "https://images.unsplash.com/photo-1568571934041-d6e73ca87e3c?w=400&q=80",   tags: ["popular"] },
    { name: "Napoleon",               desc: "layered pastry cream",          price: 12, img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&q=80" },
    { name: "Vareniki with Cherries", desc: "sweet cherry dumplings",        price: 20, img: "https://images.unsplash.com/photo-1587049016823-69ef9d68bd44?w=400&q=80" },
    { name: "Medovik",                desc: "Russian honey cake",            price: 10, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",   tags: ["popular"] },
    { name: "Pastry Selection",       desc: "chef's daily selection",        price: 6,  img: "https://images.unsplash.com/photo-1558326567-98ae2405596b?w=400&q=80" },
  ],
  drinks: [
    { name: "Kompot",      desc: "dried fruits & berries", price: 10, img: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80" },
    { name: "Teapot",      desc: "premium loose leaf",      price: 12, img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" },
    { name: "Cappuccino",                                    price: 6,  img: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80" },
    { name: "Latte",                                         price: 6,  img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80" },
    { name: "Espresso",                                      price: 4,  img: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&q=80" },
    { name: "Acqua Panna",                                   price: 7,  img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&q=80" },
    { name: "Coca-Cola",                                     price: 5,  img: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80" },
  ],
};