"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../lib/supabase";
import { getTimeAgo } from "../utils/time";
import { Comment } from "../types";

const DEFAULT_AVATAR = "/image.png";

interface CommentsProps {
  postId: string;
  canComment: boolean;
  currentUserId: string | null;
}

export default function Comments({
  postId,
  canComment,
  currentUserId,
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      // 1. Obtener comentarios del post
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error al obtener comentarios:", error);
        setIsLoading(false);
        return;
      }

      // 2. Buscar profiles de los autores
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      let profilesMap = new Map<
        string,
        { username: string; avatar_url: string | null }
      >();

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        profilesMap = new Map(
          profilesData?.map((p) => [
            p.id,
            { username: p.username, avatar_url: p.avatar_url },
          ]) || [],
        );
      }

      // 3. Combinar
      setComments(
        commentsData.map((c) => ({
          ...c,
          profile: profilesMap.get(c.user_id),
        })),
      );
      setIsLoading(false);
    };

    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = newComment.trim();
    if (!body || !currentUserId || isSending) return;

    setIsSending(true);

    // Insertar comentario
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: currentUserId, body })
      .select("*")
      .single();

    if (error) {
      console.error("Error al comentar:", error);
      setIsSending(false);
      return;
    }

    // Traer mi profile para mostrarlo al instante
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", currentUserId)
      .single();

    setComments((prev) => [
      ...prev,
      { ...data, profile: myProfile || undefined },
    ]);
    setNewComment("");
    setIsSending(false);
  };

  return (
    <div className="border-t border-border">
      {/* Lista de comentarios */}
      <div className="max-h-64 overflow-y-auto p-4 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-sm text-foreground/50">Cargando comentarios...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-foreground/50">
            No hay comentarios todavía.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 bg-card-bg">
                {comment.profile?.avatar_url ? (
                  <Image
                    src={comment.profile.avatar_url}
                    alt={comment.profile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-foreground/40">
                    {(comment.profile?.username || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>
              <p className="text-sm text-foreground">
                <span className="font-semibold">
                  @{comment.profile?.username || "usuario"}
                </span>{" "}
                <span className="text-foreground/80">{comment.body}</span>
                <span className="block text-xs text-foreground/40 mt-0.5">
                  {getTimeAgo(new Date(comment.created_at))}
                </span>
              </p>
            </div>
          ))
        )}
      </div>

      {/* Formulario */}
      {canComment ? (
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 p-3 border-t border-border"
        >
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escribe un comentario..."
            maxLength={500}
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSending}
            className="text-sm font-semibold text-primary disabled:opacity-40 disabled:cursor-not-allowed hover:underline"
          >
            {isSending ? "..." : "Publicar"}
          </button>
        </form>
      ) : (
        <p className="text-center text-sm text-foreground/50 p-3 border-t border-border">
          Inicia sesión para comentar
        </p>
      )}
    </div>
  );
}
