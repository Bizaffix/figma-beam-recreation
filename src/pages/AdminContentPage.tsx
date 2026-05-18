import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  adminCreateBlogPost,
  adminCreateNewsItem,
  adminDeleteContent,
  adminListContent,
  adminSetContentStatus,
  slugifyTitle,
} from "@/lib/content/admin-content";
import type { AdminBlogRow, AdminNewsRow, ContentStatus } from "@/lib/content/types";

const BLOG_CATEGORIES = ["general", "planning", "techniques", "community", "venues"] as const;

const emptyBlogForm = () => ({
  title: "",
  slug: "",
  excerpt: "",
  category: "general" as string,
  cover_image_url: "",
  body_markdown: "",
  seo_title: "",
  seo_description: "",
  publish: false,
});

const emptyNewsForm = () => ({
  headline: "",
  slug: "",
  summary_markdown: "",
  body_markdown: "",
  publish: false,
});

export default function AdminContentPage() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [blogs, setBlogs] = useState<AdminBlogRow[]>([]);
  const [news, setNews] = useState<AdminNewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [blogDialogOpen, setBlogDialogOpen] = useState(false);
  const [newsDialogOpen, setNewsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blogForm, setBlogForm] = useState(emptyBlogForm);
  const [newsForm, setNewsForm] = useState(emptyNewsForm);
  const [slugTouched, setSlugTouched] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await adminListContent();
      setBlogs(r.blogs);
      setNews(r.news);
    } catch (e) {
      toast({
        title: "Failed to load content",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onStatus = async (kind: "blog" | "news", id: string, status: ContentStatus) => {
    try {
      await adminSetContentStatus(kind, id, status);
      toast({ title: `Set to ${status}` });
      await refresh();
    } catch (e) {
      toast({
        title: "Update failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const onDelete = async (kind: "blog" | "news", id: string) => {
    if (!confirm("Delete permanently?")) return;
    try {
      await adminDeleteContent(kind, id);
      toast({ title: "Deleted" });
      await refresh();
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const onCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogForm.title.trim() || !blogForm.excerpt.trim() || !blogForm.body_markdown.trim()) {
      toast({ title: "Fill in title, excerpt, and body", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { slug } = await adminCreateBlogPost({
        title: blogForm.title,
        slug: blogForm.slug || undefined,
        excerpt: blogForm.excerpt,
        body_markdown: blogForm.body_markdown,
        category: blogForm.category,
        cover_image_url: blogForm.cover_image_url || null,
        seo_title: blogForm.seo_title || null,
        seo_description: blogForm.seo_description || null,
        publish: blogForm.publish,
      });
      toast({
        title: blogForm.publish ? "Blog post published" : "Blog post saved as draft",
        description: `/blog/${slug}`,
      });
      setBlogDialogOpen(false);
      setBlogForm(emptyBlogForm());
      setSlugTouched(false);
      await refresh();
    } catch (err) {
      toast({
        title: "Could not create post",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.headline.trim() || !newsForm.summary_markdown.trim() || !newsForm.body_markdown.trim()) {
      toast({ title: "Fill in headline, summary, and body", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { slug } = await adminCreateNewsItem({
        headline: newsForm.headline,
        slug: newsForm.slug || undefined,
        summary_markdown: newsForm.summary_markdown,
        body_markdown: newsForm.body_markdown,
        publish: newsForm.publish,
      });
      toast({
        title: newsForm.publish ? "News published" : "News saved as draft",
        description: `/news/${slug}`,
      });
      setNewsDialogOpen(false);
      setNewsForm(emptyNewsForm());
      await refresh();
    } catch (err) {
      toast({
        title: "Could not create news",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string) => {
    const variant =
      status === "published" ? "default" : status === "draft" ? "secondary" : "outline";
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      <div className="bg-gradient-primary text-white px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-w-6xl mx-auto">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
              <FileText className="h-7 w-7 shrink-0" />
              Content
            </h1>
            <p className="text-white/90 text-sm sm:text-base">
              Create blog posts and news manually — publish, draft, or delete.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/dashboard")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto space-y-6">
        <Card className="shadow-md border-border/80 bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Create new content</CardTitle>
            <CardDescription>Posts appear on the public Blog and News pages when published.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setBlogForm(emptyBlogForm());
                setSlugTouched(false);
                setBlogDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New blog post
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
              setNewsForm(emptyNewsForm());
              setNewsDialogOpen(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New news item
            </Button>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground px-1">Blog posts ({blogs.length})</h2>
          {blogs.length === 0 ? (
            <Card className="bg-card shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No blog posts yet. Click <strong>New blog post</strong> above.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {blogs.map((b) => (
                <Card key={b.id} className="bg-card shadow-sm overflow-hidden">
                  <CardContent className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground break-words">{b.title}</p>
                      <div className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-2">
                        {statusBadge(b.status)}
                        <span>{b.category}</span>
                        <span className="break-all">/blog/{b.slug}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:shrink-0">
                      <Button size="sm" variant="outline" className="w-full" onClick={() => onStatus("blog", b.id, "published")}>
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => onStatus("blog", b.id, "draft")}>
                        Draft
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => onStatus("blog", b.id, "archived")}>
                        Archive
                      </Button>
                      <Button size="sm" variant="destructive" className="w-full col-span-2 sm:col-span-1" onClick={() => onDelete("blog", b.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 pb-4">
          <h2 className="text-lg font-semibold text-foreground px-1">News ({news.length})</h2>
          {news.length === 0 ? (
            <Card className="bg-card shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No news yet. Click <strong>New news item</strong> above.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {news.map((n) => (
                <Card key={n.id} className="bg-card shadow-sm overflow-hidden">
                  <CardContent className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground break-words">{n.headline}</p>
                      <div className="text-xs text-muted-foreground mt-2 flex flex-wrap items-center gap-2">
                        {statusBadge(n.status)}
                        <span className="break-all">/news/{n.slug}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:shrink-0">
                      <Button size="sm" variant="outline" className="w-full" onClick={() => onStatus("news", n.id, "published")}>
                        Publish
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => onStatus("news", n.id, "draft")}>
                        Draft
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => onStatus("news", n.id, "archived")}>
                        Archive
                      </Button>
                      <Button size="sm" variant="destructive" className="w-full col-span-2 sm:col-span-1" onClick={() => onDelete("news", n.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={blogDialogOpen} onOpenChange={setBlogDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New blog post</DialogTitle>
            <DialogDescription>
              Markdown supported in the body. Use ![alt](url) for inline images.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreateBlog} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="blog-title">Title</Label>
              <Input
                id="blog-title"
                value={blogForm.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setBlogForm((f) => ({
                    ...f,
                    title,
                    slug: slugTouched ? f.slug : slugifyTitle(title),
                  }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-slug">URL slug</Label>
              <Input
                id="blog-slug"
                value={blogForm.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setBlogForm((f) => ({ ...f, slug: slugifyTitle(e.target.value) }));
                }}
                placeholder="my-post-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-excerpt">Excerpt</Label>
              <Textarea
                id="blog-excerpt"
                value={blogForm.excerpt}
                onChange={(e) => setBlogForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={blogForm.category} onValueChange={(v) => setBlogForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger id="blog-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[200]">
                  {BLOG_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-cover">Cover image URL (optional)</Label>
              <Input
                id="blog-cover"
                type="url"
                value={blogForm.cover_image_url}
                onChange={(e) => setBlogForm((f) => ({ ...f, cover_image_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blog-body">Body (markdown)</Label>
              <Textarea
                id="blog-body"
                value={blogForm.body_markdown}
                onChange={(e) => setBlogForm((f) => ({ ...f, body_markdown: e.target.value }))}
                rows={10}
                required
                className="font-mono text-sm min-h-[200px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="blog-publish"
                checked={blogForm.publish}
                onCheckedChange={(c) => setBlogForm((f) => ({ ...f, publish: c === true }))}
              />
              <Label htmlFor="blog-publish" className="font-normal cursor-pointer">
                Publish immediately
              </Label>
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setBlogDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create post"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newsDialogOpen} onOpenChange={setNewsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>New news item</DialogTitle>
            <DialogDescription>Short summary plus full markdown body.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreateNews} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="news-headline">Headline</Label>
              <Input
                id="news-headline"
                value={newsForm.headline}
                onChange={(e) => {
                  const headline = e.target.value;
                  setNewsForm((f) => ({
                    ...f,
                    headline,
                    slug: f.slug || slugifyTitle(headline),
                  }));
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-slug">URL slug</Label>
              <Input
                id="news-slug"
                value={newsForm.slug}
                onChange={(e) => setNewsForm((f) => ({ ...f, slug: slugifyTitle(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-summary">Summary</Label>
              <Textarea
                id="news-summary"
                value={newsForm.summary_markdown}
                onChange={(e) => setNewsForm((f) => ({ ...f, summary_markdown: e.target.value }))}
                rows={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-body">Body (markdown)</Label>
              <Textarea
                id="news-body"
                value={newsForm.body_markdown}
                onChange={(e) => setNewsForm((f) => ({ ...f, body_markdown: e.target.value }))}
                rows={8}
                required
                className="font-mono text-sm min-h-[160px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="news-publish"
                checked={newsForm.publish}
                onCheckedChange={(c) => setNewsForm((f) => ({ ...f, publish: c === true }))}
              />
              <Label htmlFor="news-publish" className="font-normal cursor-pointer">
                Publish immediately
              </Label>
            </div>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setNewsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create news"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
