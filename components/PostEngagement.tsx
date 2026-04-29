"use client";

import { useState } from "react";
import { Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { toggleLike, addComment } from "../actions/engagement";

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface PostEngagementProps {
  postId: string;
  initialLikesCount: number;
  hasLikedInitial: boolean;
  comments: Comment[];
  isLoggedIn: boolean;
}

export default function PostEngagement({ 
  postId, 
  initialLikesCount, 
  hasLikedInitial, 
  comments,
  isLoggedIn 
}: PostEngagementProps) {
  // Optimistic State for Likes
  const [isLiked, setIsLiked] = useState(hasLikedInitial);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  
  // Comments Tray State
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert("Please log in to like posts!");
      return;
    }
    
    // Optimistic UI update (Instant feedback for the user)
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    // Call the server
    const result = await toggleLike(postId);
    if (!result.success) {
      // Revert if server fails
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      console.error(result.error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("postId", postId);
    formData.append("content", newComment);

    const result = await addComment(formData);
    if (result.success) {
      setNewComment("");
      // The page will automatically revalidate via the server action to show the new comment
    } else {
      alert("Failed to post comment.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="w-full">
      {/* ENGAGEMENT BUTTONS */}
      <div className="p-2 sm:p-3 flex items-center gap-2 border-t border-slate-100">
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-sm ${
            isLiked ? "text-red-500 bg-red-50" : "text-slate-500 hover:text-red-500 hover:bg-red-50"
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} /> 
          {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all font-bold text-sm ${
            showComments ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-blue-500 hover:bg-blue-50"
          }`}
        >
          <MessageCircle className={`w-5 h-5 ${showComments ? "fill-current opacity-20" : ""}`} /> 
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </button>
      </div>

      {/* COMMENTS TRAY */}
      {showComments && (
        <div className="px-5 pb-5 pt-2 bg-slate-50 border-t border-slate-100 rounded-b-3xl">
          
          {/* Add Comment Input */}
          {isLoggedIn ? (
            <form onSubmit={handleCommentSubmit} className="flex gap-2 mb-6">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <p className="text-xs text-slate-500 mb-6 text-center bg-white p-3 rounded-xl border border-slate-200">
              Log in to leave a comment.
            </p>
          )}

          {/* Comment List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center pb-2">No comments yet. Be the first!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {comment.author_name.charAt(0)}
                  </div>
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex-1 shadow-sm">
                    <p className="text-xs font-black text-slate-900 mb-0.5">{comment.author_name}</p>
                    <p className="text-sm text-slate-700">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}