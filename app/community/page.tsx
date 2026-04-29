import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { 
  MessageCircle, 
  Heart, 
  Tag, 
  Store, 
  CheckCircle,
  TrendingUp,
  Image as ImageIcon
} from "lucide-react";
import PostEngagement from "@/components/PostEngagement";

// UPGRADE: Cache this page at the edge for 60 seconds.
// This makes the feed lightning-fast and saves Supabase bandwidth.
export const revalidate = 60; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function CommunityFeedPage() {
  // Fetch posts and their deeply nested tagged products
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts, error } = await supabase
    .from("community_posts")
    .select(`
      *,
      post_product_tags (
        products ( id, title, price, images )
      ),
      community_likes ( user_id ),
      community_comments ( id, author_name, content, created_at )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching community feed:", error);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* PAGE HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4 shadow-sm">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">The LocalSoko Hub</h1>
          <p className="text-slate-500 font-medium mt-3 text-lg">
            Discover product drops, reviews, and styling tips from the community.
          </p>
        </div>

        {/* FEED LOOP */}
        <div className="space-y-6">
          {posts?.map((post) => (
            <div key={post.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              
              {/* POST HEADER */}
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center font-black text-slate-500 text-lg shadow-sm overflow-hidden">
                    {post.author_avatar ? (
                      <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                    ) : (
                      post.author_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      {post.author_name}
                      {post.author_type === 'merchant' && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                          <Store className="w-3 h-3" /> Vendor
                        </span>
                      )}
                      {post.author_type === 'buyer' && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Buyer
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* POST CONTENT */}
              <div className="px-5 pb-4">
                <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">
                  {post.content}
                </p>
              </div>

              {/* EXTERNAL IMAGE (Cloudinary / UploadThing) */}
              {post.image_url && (
                <div className="w-full bg-slate-100 border-y border-slate-100 relative group cursor-pointer">
                  <img 
                    src={post.image_url} 
                    alt="Community post media" 
                    className="w-full h-auto max-h-[500px] object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              {/* SHOPPABLE TAGS (The Revenue Generator) */}
              {post.post_product_tags && post.post_product_tags.length > 0 && (
                <div className="p-5 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-slate-400" /> Featured Products
                  </p>
                  
                  {/* Horizontal Scroll Container */}
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {post.post_product_tags.map((tag: any) => {
                      const product = tag.products;
                      if (!product) return null;
                      return (
                        <Link 
                          href={`/product/${product.id}`} 
                          key={product.id} 
                          className="flex-shrink-0 w-56 bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-400 hover:shadow-sm transition-all group snap-start"
                        >
                          <div className="h-28 bg-slate-100 relative overflow-hidden">
                            {product.main_image_url ? (
                              <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-6 h-6"/></div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                            <p className="text-emerald-600 font-black text-sm mt-1">
                              {/* Adjust currency if needed */}
                              Ksh {Number(product.price).toLocaleString()}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ENGAGEMENT FOOTER */}
              <PostEngagement 
                postId={post.id}
                initialLikesCount={post.community_likes?.length || 0}
                hasLikedInitial={post.community_likes?.some((like: any) => like.user_id === user?.id) || false}
                comments={post.community_comments || []}
                isLoggedIn={!!user}
              />

            </div>
          ))}

          {/* EMPTY STATE */}
          {(!posts || posts.length === 0) && (
             <div className="bg-white rounded-3xl border border-slate-200 shadow-sm text-center py-20 px-6">
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5">
                 <MessageCircle className="w-10 h-10 text-slate-300" />
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">No posts yet</h2>
               <p className="text-slate-500 mt-2 font-medium max-w-sm mx-auto">
                 The community feed is currently empty. Be the first to share a drop or review!
               </p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}