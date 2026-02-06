export interface MenuItem {
  name: string;
  desc?: string;
  price: number;
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
    { name: "Salmon Tartare",       desc: "salmon, onion, capers, lemon, mayonnaise, dressing",      price: 21 },
    { name: "Satsivi",              desc: "chicken broth, chicken, walnuts, spices",                  price: 18 },
    { name: "Tuna Tartare",         desc: "tuna, onion, capers, lemon, avocado, dressing",            price: 21 },
    { name: "Meat Plate",           desc: "smoked duck breast, prosciutto, smoked Wagyu Beef",        price: 22 },
    { name: "Hamachi",              desc: "yellowtail, ponzu sauce, jalapeños",                       price: 23 },
    { name: "Burrata",              desc: "burrata, tomatoes, basil, olive oil, balsamic vinegar",    price: 21 },
    { name: "Crab Tower",           desc: "crabmeat, avocado, dressing",                              price: 24 },
    { name: "Pâté",                 desc: "chicken liver, carrot, onion, apple, butter · brioche bun", price: 16 },
    { name: "Fish Plate",           desc: "smoked salmon, smoked mackerel",                           price: 20 },
    { name: "Crepes with Caviar",   desc: "4 pieces · red $20 / black $59",                           price: 20 },
    { name: "Forshmak",             desc: "herring spread, green apple, onion, baguette, butter",     price: 10 },
    { name: "Marinated Mushrooms",  desc: "white mushrooms, onion, oil, vinegar, sugar",              price: 12 },
  ],
  salads: [
    { name: "Greek Salad",               desc: "tomatoes, cucumbers, onion, feta, olives, bell peppers", price: 17 },
    { name: "Endive Salad",              desc: "green apple, arugula, toasted walnuts, sherry vinegar",  price: 22 },
    { name: "Crawfish Salad",            desc: "crawfish, avocado, mayonnaise, dressing",                price: 20 },
    { name: "Three Colors Beet Salad",   desc: "beets, mixed greens, goat cheese, dressing",             price: 18 },
    { name: "Marinated Vegetables",      desc: "assorted seasonal vegetables",                           price: 15 },
  ],
  soups: [
    { name: "Borscht",        desc: "with pampushky and garlic sauce",    price: 14 },
    { name: "Mushroom Soup",  desc: "porcini mushroom and barley",        price: 14 },
    { name: "Kharcho",        desc: "traditional soup with lamb",          price: 15 },
    { name: "Lobster Bisque", desc: "rich and creamy lobster soup",        price: 16 },
  ],
  hotAppetizers: [
    { name: "Homemade Potatoes",      desc: "chef's preparation",                                   price: 14 },
    { name: "Potatoes for Two",       desc: "with chanterelles",                                    price: 26 },
    { name: "Chebureki / Belyashi",   desc: "with Wagyu Beef",                                      price: 6 },
    { name: "Crepes with Duck",       desc: "4 pieces · dried fruits and dressing",                  price: 24 },
    { name: "Pelmeni",                desc: "with beef and chicken",                                 price: 20 },
    { name: "Vareniki",               desc: "with potatoes and cabbage",                             price: 20 },
    { name: "Pasta Seafood",          desc: "chef's seafood selection",                              price: 29 },
    { name: "Shrimp Scampi",          desc: "classic preparation",                                   price: 24 },
    { name: "Beverly Hills Soufflé",  desc: "shrimp, scallop, julien vegetables, lobster bisque",    price: 32 },
    { name: "Grilled Octopus Salad",  desc: "tender octopus, fresh greens",                          price: 24 },
  ],
  mains: [
    { name: "Salmon with Sauce",          desc: "chef's signature sauce",           price: 24 },
    { name: "Branzino Grilled",           desc: "whole grilled branzino",            price: 26 },
    { name: "French Rack of Lamb",        desc: "4 pieces, herb-crusted",            price: 30 },
    { name: "Ribeye Steak",               desc: "prime cut, chargrilled",             price: 38 },
    { name: "Beef Stroganoff",            desc: "classic Russian preparation",        price: 24 },
    { name: "Lemon Chicken",              desc: "chicken breast, citrus glaze",       price: 20 },
    { name: "Short Ribs (24hr advance)",  desc: "for 5–6 people",                    price: 160 },
  ],
  desserts: [
    { name: "Apple Strudel",          desc: "with vanilla ice cream",       price: 12 },
    { name: "Napoleon",               desc: "layered pastry cream",          price: 12 },
    { name: "Vareniki with Cherries", desc: "sweet cherry dumplings",        price: 20 },
    { name: "Medovik",                desc: "Russian honey cake",            price: 10 },
    { name: "Pastry Selection",       desc: "chef's daily selection",        price: 6 },
  ],
  drinks: [
    { name: "Kompot",      desc: "dried fruits & berries", price: 10 },
    { name: "Teapot",      desc: "premium loose leaf",      price: 12 },
    { name: "Cappuccino",                                    price: 6 },
    { name: "Latte",                                         price: 6 },
    { name: "Espresso",                                      price: 4 },
    { name: "Acqua Panna",                                   price: 7 },
    { name: "Coca-Cola",                                     price: 5 },
  ],
};
