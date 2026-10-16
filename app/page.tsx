"use client";

import { useEffect, useState } from "react";
import PostCard from "./components/PostCard";
import Modal from "./components/Modal";
import { supabase } from "./lib/supabase";
import { fetchLikedPostIds, setLike } from "./lib/likes";
import { Post } from "./types";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
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
        .select("*")
        .order("created_at", { ascending: false });

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
      const postsWithProfiles = postsData.map((post) => ({
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
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !wasLiked,
              likes: wasLiked ? p.likes - 1 : p.likes + 1,
            }
          : p,
      ),
    );

    // Persistir en Supabase
    try {
      await setLike(String(postId), userId, !wasLiked);
    } catch (error) {
      console.error("Error al guardar like:", error);
      // Revertir si falló
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? { ...p, isLiked: wasLiked, likes: post.likes }
            : p,
        ),
      );
    }
  };

  const selectedPost = posts.find((p) => p.id === selectedPostId) || null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card-bg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-2xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Supagram
          </h1>
        </div>
      </header>

      {/* Feed de posts */}
      <main className="max-w-lg mx-auto px-4 py-6">
        {posts.length === 0 ? (
          <p className="text-center text-foreground/50 py-12">
            No hay posts todavía. ¡Sé el primero en publicar!
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onOpenComments={(id) => setSelectedPostId(String(id))}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal con post ampliado y comentarios */}
      {selectedPost && (
        <Modal
          post={selectedPost}
          onClose={() => setSelectedPostId(null)}
          onLike={handleLike}
          canComment={!!userId}
          currentUserId={userId}
        />
      )}
    </div>
  );
}
