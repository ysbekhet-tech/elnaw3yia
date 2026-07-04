import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "العروض الخاصة | المكتبة النوعية",
  description: "افضل العروض والخصومات على مستلزمات المكتبة والقرطاسية في المكتبة النوعية",
  openGraph: {
    title: "العروض الخاصة | المكتبة النوعية",
    description: "افضل العروض والخصومات على مستلزمات المكتبة والقرطاسية",
  },
};

export default function OffersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
