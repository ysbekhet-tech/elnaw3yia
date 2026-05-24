import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import FeaturedProducts from "@/components/FeaturedProducts";

export default function Home() {
  return (
    <main className="bg-[#0F0F23] min-h-screen">
      <HeroSection />
      <CategoriesSection />
      <FeaturedProducts />
    </main>
  );
}