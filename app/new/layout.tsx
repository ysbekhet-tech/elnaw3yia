import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "وصل حديثا | المكتبة النوعية",
  description: "اكتشف احدث المنتجات والمستلزمات المدرسية والمكتبية في المكتبة النوعية",
  openGraph: {
    title: "وصل حديثا | المكتبة النوعية",
    description: "اكتشف احدث المنتجات والمستلزمات المدرسية والمكتبية",
  },
};

export default function NewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
