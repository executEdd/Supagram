"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { getTimeAgo } from "../utils/time";

import type { Post } from "../mocks/posts";
import { supabase } from "../lib/supabase";
import Modal from "../components/Modal";

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-red-500"
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}



export default function RankPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    async function getPosts() {
      const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .gte('likes', 50)
      .order('likes', { ascending: false })
      //.range(0, 11)
      
      if (posts) {
        setPosts(posts)
        console.log(posts)
      }
    }
    
    getPosts()
  }, [])
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-bg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ranking
          </h1>
        </div>
      </header>

      {/* Grid de posts */}
      <main className="max-w-2xl mx-auto p-2">
        <div className="grid grid-cols-3 gap-1">
          {[...posts].sort((a, b) => b.likes - a.likes).map((post) => (
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
                <HeartIcon />
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
        <Modal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}
