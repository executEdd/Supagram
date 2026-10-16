import Image from "next/image";
import { getTimeAgo } from "../utils/time";
import HeartIcon from "./HeartIcon";
import { Post, PostCardProps } from "../types";

const DEFAULT_AVATAR = "/image.png";

export default function PostCard({
  post,
  onLike,
  onOpenComments,
}: PostCardProps) {
  const username = post.profile?.username || "default user";
  const avatarUrl = post.profile?.avatar_url || DEFAULT_AVATAR;

  return (
    <article className="bg-card-bg border border-border rounded-xl overflow-hidden shadow-sm">
      {/* Header con usuario y avatar */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={username}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg text-foreground/40">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">@{username}</span>
          <span className="text-xs text-foreground/50">
            {getTimeAgo(new Date(post.created_at))}
          </span>
        </div>
      </div>

      {/* Imagen del post */}
      <div className="relative w-full aspect-square">
        <Image
          src={post.image_url}
          alt={`Post de ${username}`}
          fill
          className="object-cover"
        />
      </div>

      {/* Acciones y caption */}
      <div className="p-4">
        {/* Botón de like con contador */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLike(post.id)}
            className="hover:scale-110 transition-transform active:scale-95"
            aria-label={post.isLiked ? "Quitar like" : "Dar like"}
          >
            <HeartIcon filled={post.isLiked} />
          </button>
          <span className="font-semibold text-foreground">
            {post.likes.toLocaleString()} likes
          </span>
          <button
            onClick={() => onOpenComments(post.id)}
            className="ml-auto hover:scale-110 transition-transform active:scale-95"
            aria-label="Ver comentarios"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="w-6 h-6 text-foreground/70"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
          </button>
        </div>

        {/* Caption */}
        <p className="mt-2 text-foreground">
          <span className="font-semibold">@{username}</span>{" "}
          <span className="text-foreground/80">{post.caption}</span>
        </p>
      </div>
    </article>
  );
}
