import type { Metadata } from "next";
import ProfileView from "@/components/profile/ProfileView";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("username, avatar_url")
    .eq("id", id)
    .single();

  const username = data?.username || "Thành viên";
  const description = `Trang cá nhân của ${username} trên NexLoot — xem sản phẩm và đánh giá.`;

  return {
    title: username,
    description,
    alternates: { canonical: `/profile/${id}` },
    openGraph: {
      type: "profile",
      title: username,
      description,
      images: data?.avatar_url ? [{ url: data.avatar_url, alt: username }] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  return (
    <div className="min-h-screen transition-colors duration-300">
      <ProfileView profileId={resolvedParams.id} />
    </div>
  );
}
