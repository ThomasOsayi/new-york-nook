export interface SignatureDish {
  name: string;
  desc: string;
  img: string;
}

/**
 * TODO: Replace Unsplash placeholders with actual food photography.
 * Ideal specs: 900px wide, 85% quality, WebP preferred.
 */
export const signatureDishes: SignatureDish[] = [
  {
    name: "Beef Stroganoff",
    desc: "Tender beef in a rich mushroom & sour cream sauce — our most beloved classic",
    img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=900&q=85",
  },
  {
    name: "Lobster Bisque",
    desc: "Velvety smooth, finished with crème fraîche and a touch of cognac",
    img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=900&q=85",
  },
  {
    name: "Ribeye Steak",
    desc: "38-day dry aged, chargrilled to perfection with roasted bone marrow",
    img: "https://images.unsplash.com/photo-1558030006-450675393462?w=900&q=85",
  },
  {
    name: "Crepes with Caviar",
    desc: "Delicate buckwheat blini crowned with premium black caviar",
    img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=900&q=85",
  },
  {
    name: "Rack of Lamb",
    desc: "French-cut, herb-crusted with rosemary jus and roasted vegetables",
    img: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=900&q=85",
  },
  {
    name: "Grilled Octopus",
    desc: "Tender charred tentacles with chimichurri and crispy potatoes",
    img: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=900&q=85",
  },
];
