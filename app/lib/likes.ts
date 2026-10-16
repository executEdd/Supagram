import { supabase } from "./supabase";

/**
 * Obtiene los IDs de los posts que el usuario ha dado like.
 */
export async function fetchLikedPostIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error al obtener likes del usuario:", error);
    return new Set();
  }

  return new Set((data ?? []).map((like) => like.post_id));
}

/**
 * Marca o desmarca un like. El contador de posts.likes
 * se actualiza automáticamente en la BD (trigger).
 */
export async function setLike(
  postId: string,
  userId: string,
  liked: boolean,
): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from("likes")
      .insert({ post_id: postId, user_id: userId });

    // 23505 = unique violation (ya había dado like)
    if (error && error.code !== "23505") throw error;
  } else {
    const { error } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) throw error;
  }
}
