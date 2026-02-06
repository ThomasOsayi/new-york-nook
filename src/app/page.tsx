"use client";

import { useRef, createRef } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SigDishes from "@/components/SigDishes";
import MenuSection from "@/components/MenuSection";
import GallerySection from "@/components/GallerySection";
import OrderSection from "@/components/OrderSection";
import CateringSection from "@/components/CateringSection";
import ReservationSection from "@/components/ReservationSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";

const SECTIONS = ["Home", "Menu", "Gallery", "Reserve", "Order", "Catering", "Contact"] as const;

export default function HomePage() {
  const refs = useRef(
    Object.fromEntries(SECTIONS.map((s) => [s, createRef<HTMLDivElement>()])) as Record<string, React.RefObject<HTMLDivElement | null>>
  );

  const scrollTo = (section: string) => {
    refs.current[section]?.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "#080603", minHeight: "100vh" }}>
      <Navbar onNav={scrollTo} />

      <div ref={refs.current.Home}>
        <Hero onNav={scrollTo} />
      </div>

      <SigDishes />

      <div ref={refs.current.Menu}>
        <MenuSection />
      </div>

      <div ref={refs.current.Gallery}>
        <GallerySection />
      </div>

      <div ref={refs.current.Order}>
        <OrderSection />
      </div>

      <div ref={refs.current.Catering}>
        <CateringSection />
      </div>

      <div ref={refs.current.Reserve}>
        <ReservationSection />
      </div>

      <div ref={refs.current.Contact}>
        <ContactSection />
      </div>

      <Footer />
    </div>
  );
}
