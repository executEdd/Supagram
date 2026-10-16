"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Modal from "../components/Modal";
import HeartIcon from "../components/HeartIcon";
import { supabase } from "../lib/supabase";
import { fetchLikedPostIds, setLike } from "../lib/likes";
import { Post } from "../types";

export default function RankPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      // 0. Usuario actual (puede no haber sesión)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      // 1. Obtener posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, image_url, caption, likes, user_id, created_at")
        .gt("likes", 5)
        .order("likes", { ascending: false });

      if (postsError) {
        console.error("Error al obtener los posts:", postsError);
        return;
      }

      // 2. Obtener IDs únicos de usuarios
      const userIds = [...new Set(postsData.map((p) => p.user_id))];

      // 3. Buscar profiles de esos usuarios
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      // 4. Crear mapa de profiles por ID
      const profilesMap = new Map(
        profilesData?.map((p) => [
          p.id,
          { username: p.username, avatar_url: p.avatar_url },
        ]) || [],
      );

      // 4.5. Qué posts ha dado like el usuario actual
      const likedIds = user ? await fetchLikedPostIds(user.id) : new Set<string>();

      // 5. Combinar posts con profiles y likes
      const postsWithProfiles: Post[] = postsData.map((post) => ({
        ...post,
        profile: profilesMap.get(post.user_id),
        isLiked: likedIds.has(post.id),
      }));

      setPosts(postsWithProfiles);
    };

    fetchPosts();
  }, []);

  const handleLike = async (postId: number | string) => {
    // Sin sesión no se puede dar like
    if (!userId) {
      window.location.href = "/auth/login";
      return;
    }

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const wasLiked = post.isLiked;

    // Actualización optimista
    const applyChange = (list: Post[]) =>
      list.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !wasLiked,
              likes: wasLiked ? p.likes - 1 : p.likes + 1,
            }
          : p,
      );

    setPosts(applyChange);
    if (selectedPost?.id === postId) {
      setSelectedPost({ ...selectedPost, isLiked: !wasLiked, likes: wasLiked ? selectedPost.likes - 1 : selectedPost.likes + 1 });
    }

    // Persistir en Supabase
    try {
      await setLike(String(postId), userId, !wasLiked);
    } catch (error) {
      console.error("Error al guardar like:", error);
      // Revertir si falló
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLiked: wasLiked, likes: post.likes } : p)),
      );
      if (selectedPost?.id === postId) {
        setSelectedPost({ ...selectedPost, isLiked: wasLiked, likes: post.likes });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-bg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Ranking
          </h1>
        </div>
      </header>

      {/* Grid de posts */}
      <main className="max-w-2xl mx-auto p-2">
        <div className="grid grid-cols-3 gap-1">
          {[...posts]
            .sort((a, b) => b.likes - a.likes)
            .map((post) => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square overflow-hidden group"
              >
                <Image
                  src={post.image_url}
                  alt={`Post con ${post.likes} likes`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
                {/* Overlay con likes al hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <HeartIcon filled={true} />
                  <span className="text-white font-semibold">
                    {post.likes.toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </main>

      {/* Modal */}
      {selectedPost && (
        <Modal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          canComment={!!userId}
          currentUserId={userId}
        />
      )}
    </div>
  );
}
