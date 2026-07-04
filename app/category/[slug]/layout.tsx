import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const categoryName = decodeURIComponent(resolvedParams.slug);
  const title = categoryName + " | المكتبة النوعية";
  const description = categoryName + " - افضل الاسعار وتشكيلة واسعة من المستلزمات المدرسية والمكتبية في المكتبة النوعية";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
