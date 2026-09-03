import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Star,
  ImagePlus,
  X,
  Briefcase,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import ImageSlideshow from "@/components/ui/ImageSlideshow";
import { processImageFileForUpload } from "@/lib/image-utils";
import {
  WORK_CATEGORIES as PROJECT_CATEGORIES,
  WORK_CATEGORY_ICONS as categoryIcons,
  WORK_CATEGORY_GRADIENTS as categoryGradients,
} from "@/lib/site-content";

interface Project {
  id: string;
  title: string;
  description: string;
  clientName: string;
  category: string;
  images: string[];
  completedDate: string;
  featured: boolean;
  createdAt: string;
}

interface ProjectForm {
  title: string;
  description: string;
  clientName: string;
  category: string;
  images: string[];
  completedDate: string;
  featured: boolean;
}

export default function OurWorkPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "sales";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectForm>({
    title: "",
    description: "",
    clientName: "",
    category: "",
    images: [],
    completedDate: new Date().toISOString().split("T")[0],
    featured: false,
  });
  const [uploading, setUploading] = useState(false);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch {
      console.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openCreate = (category?: string) => {
    setEditingProject(null);
    setForm({
      title: "",
      description: "",
      clientName: "",
      category: category || "",
      images: [],
      completedDate: new Date().toISOString().split("T")[0],
      featured: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      description: project.description,
      clientName: project.clientName,
      category: project.category,
      images: project.images || [],
      completedDate: project.completedDate || "",
      featured: project.featured || false,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot the File objects BEFORE clearing the input value — resetting
    // the input empties the FileList in place, which would otherwise make the
    // processing step see zero files.
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;
    e.target.value = "";
    setUploading(true);
    const skipped: string[] = [];
    const keptAsIs: string[] = [];
    try {
      // Process files one at a time so previews stream in as each image is
      // ready and any problem file is reported by name instead of failing
      // the whole selection silently.
      for (const file of fileList) {
        const outcome = await processImageFileForUpload(file);
        if (outcome.dataUrl) {
          setForm((prev) => ({
            ...prev,
            images: [...prev.images, outcome.dataUrl as string],
          }));
          if (outcome.reason) {
            keptAsIs.push(`${file.name} — ${outcome.reason}`);
          }
        } else {
          skipped.push(`${file.name} — ${outcome.reason || "unsupported file"}`);
        }
      }
      if (skipped.length > 0) {
        toast({
          title: `${skipped.length} image${skipped.length > 1 ? "s" : ""} skipped`,
          description: skipped.join("\n"),
          variant: "destructive",
        });
      }
      if (keptAsIs.length > 0) {
        toast({
          title: `${keptAsIs.length} image${keptAsIs.length > 1 ? "s" : ""} kept as-is`,
          description:
            keptAsIs.join("\n") +
            "\nJPG or PNG images are compressed automatically and are safest for all devices.",
        });
      }
    } catch (err) {
      toast({
        title: "Image upload error",
        description:
          err instanceof Error ? err.message : "Something went wrong while processing the images.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_: string, i: number) => i !== index),
    }));
  };

  const save = async () => {
    if (!form.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    try {
      const token = localStorage.getItem("printhub_token");
      const method = editingProject ? "PUT" : "POST";
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast({
          title: editingProject ? "Project updated" : "Project posted",
          variant: "success",
        });
        setDialogOpen(false);
        fetchProjects();
      } else {
        const err = await res.json();
        toast({ title: err.error || "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to save project", variant: "destructive" });
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Project deleted", variant: "success" });
        fetchProjects();
      }
    } catch {
      toast({ title: "Failed to delete project", variant: "destructive" });
    }
  };

  // Group projects by category
  const projectsByCategory = new Map<string, Project[]>();
  projects.forEach((p) => {
    const cat = p.category || "Other";
    if (!projectsByCategory.has(cat)) projectsByCategory.set(cat, []);
    projectsByCategory.get(cat)!.push(p);
  });

  // Filtered view
  const displayCategories = selectedCategory
    ? [selectedCategory]
    : Array.from(projectsByCategory.keys());

  const featuredProjects = projects.filter((p) => p.featured);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 lg:px-8 pt-16 lg:pt-20 pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 glass-card-subtle px-4 py-2 rounded-pill mb-6">
              <Briefcase className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-caption font-medium text-[var(--text-secondary)]">
                Our Work
              </span>
            </div>

            <h1 className="text-large-title lg:text-[56px] font-bold text-[var(--text-primary)] mb-6 leading-tight">
              Manufacturing{" "}
              <span className="bg-gradient-to-r from-[var(--accent-primary)] to-[#E84530] bg-clip-text text-transparent">
                visibility
              </span>
              . Building brands.
            </h1>

            <p className="text-body lg:text-title-3 text-[var(--text-secondary)] max-w-2xl mx-auto mb-8">
              Browse completed work across signage & visual communication,
              fabrication & structural branding, promotional materials and
              printing & production — everything designed and manufactured
              in-house.
            </p>
          </motion.div>
        </div>

        <div className="absolute top-20 left-10 w-72 h-72 bg-[var(--accent-primary)] opacity-[0.04] rounded-full blur-[100px]" />
      </section>

      {/* Admin Controls */}
      {isAdmin && (
        <section className="px-4 lg:px-8 pb-6">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="py-4 flex items-center justify-between">
                <p className="text-subhead text-[var(--text-secondary)]">
                  Post your completed work to showcase to potential clients
                </p>
                <Button onClick={() => openCreate()}>
                  <Plus className="w-4 h-4 mr-1" /> Post Work
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="px-4 lg:px-8 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-pill text-subhead font-medium transition-all ${
                !selectedCategory
                  ? "bg-[var(--accent-primary)] text-white"
                  : "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]"
              }`}
            >
              All Projects
            </button>
            {PROJECT_CATEGORIES.map((cat) => {
              const count = projectsByCategory.get(cat)?.length || 0;
              return (
                <button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                  className={`flex-shrink-0 px-4 py-2 rounded-pill text-subhead font-medium transition-all flex items-center gap-2 ${
                    selectedCategory === cat
                      ? "bg-[var(--accent-primary)] text-white"
                      : "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]"
                  }`}
                >
                  <span>{categoryIcons[cat]}</span>
                  {cat}
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        selectedCategory === cat
                          ? "bg-white/20"
                          : "bg-[var(--glass-fill)]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Projects Content */}
      <section className="px-4 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="space-y-8">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-8 w-48 rounded bg-[var(--glass-fill-subtle)] animate-pulse mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="h-64 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <ImagePlus className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
                <p className="text-title-3 font-semibold text-[var(--text-secondary)] mb-2">
                  No projects yet
                </p>
                <p className="text-body text-[var(--text-tertiary)] mb-6">
                  {isAdmin
                    ? "Start posting your completed work to build your portfolio."
                    : "Check back soon to see our latest projects."}
                </p>
                {isAdmin && (
                  <Button onClick={() => openCreate()}>
                    <Plus className="w-4 h-4 mr-1" /> Post First Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-10">
              {/* Featured Work */}
              {featuredProjects.length > 0 &&
                !selectedCategory && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <Star className="w-6 h-6 text-[var(--accent-secondary)]" />
                      <h2 className="text-title-2 font-bold text-[var(--text-primary)]">
                        Featured Work
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {featuredProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <Card className="overflow-hidden hover:shadow-[var(--glass-shadow)] transition-all duration-300 h-full">
                            {project.images && project.images.length > 0 ? (
                              <ImageSlideshow
                                images={project.images}
                                alt={project.title}
                                className="h-56"
                                showDots={project.images.length > 1}
                                showArrows={project.images.length > 1}
                                autoPlayInterval={20000}
                              />
                            ) : (
                              <div
                                className={`h-56 bg-gradient-to-br ${
                                  categoryGradients[project.category] ||
                                  "from-gray-500 to-gray-600"
                                } flex items-center justify-center`}
                              >
                                <span className="text-6xl opacity-60">
                                  {categoryIcons[project.category] || "🖼️"}
                                </span>
                              </div>
                            )}
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-headline font-bold text-[var(--text-primary)]">
                                    {project.title}
                                  </h3>
                                  {project.description && (
                                    <p className="text-subhead text-[var(--text-secondary)] mt-1 line-clamp-2">
                                      {project.description}
                                    </p>
                                  )}
                                </div>
                                {isAdmin && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={() => openEdit(project)}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-[var(--accent-danger)]"
                                      onClick={() => deleteProject(project.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <Badge
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {categoryIcons[project.category]}{" "}
                                  {project.category}
                                </Badge>
                                {project.clientName && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {project.clientName}
                                  </Badge>
                                )}
                                {project.completedDate && (
                                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                      project.completedDate,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

              {/* Projects by Category */}
              {displayCategories.map((category) => {
                const catProjects =
                  selectedCategory === category
                    ? projectsByCategory.get(category) || []
                    : (projectsByCategory.get(category) || []).filter(
                        (p) => !p.featured,
                      );

                if (catProjects.length === 0) return null;

                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {categoryIcons[category]}
                        </span>
                        <h2 className="text-title-2 font-bold text-[var(--text-primary)]">
                          {category}
                        </h2>
                        <Badge variant="secondary" className="text-[10px]">
                          {catProjects.length} project
                          {catProjects.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openCreate(category)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {catProjects.map((project, index) => (
                        <motion.div
                          key={project.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: index * 0.05,
                          }}
                        >
                          <Card className="overflow-hidden hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98] h-full">
                            {project.images && project.images.length > 0 ? (
                              <ImageSlideshow
                                images={project.images}
                                alt={project.title}
                                className="h-44"
                                showDots={project.images.length > 1}
                                showArrows={project.images.length > 1}
                                autoPlayInterval={20000}
                              />
                            ) : (
                              <div
                                className={`h-44 bg-gradient-to-br ${
                                  categoryGradients[category] ||
                                  "from-gray-500 to-gray-600"
                                } flex items-center justify-center`}
                              >
                                <span className="text-5xl opacity-60">
                                  {categoryIcons[category] || "🖼️"}
                                </span>
                              </div>
                            )}
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-subhead font-semibold text-[var(--text-primary)]">
                                    {project.title}
                                  </h3>
                                  {project.description && (
                                    <p className="text-caption text-[var(--text-tertiary)] mt-1 line-clamp-2">
                                      {project.description}
                                    </p>
                                  )}
                                </div>
                                {isAdmin && (
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => openEdit(project)}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 text-[var(--accent-danger)]"
                                      onClick={() =>
                                        deleteProject(project.id)
                                      }
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                {project.clientName && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    {project.clientName}
                                  </Badge>
                                )}
                                {project.completedDate && (
                                  <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(
                                      project.completedDate,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto">
          <Card variant="strong" className="text-center p-8 lg:p-12">
            <h2 className="text-title-1 font-bold text-[var(--text-primary)] mb-4">
              Want similar results?
            </h2>
            <p className="text-body text-[var(--text-secondary)] mb-8 max-w-lg mx-auto">
              Let us bring your vision to life. Get a free quote for your next
              printing project and experience the WXY difference.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => (window.location.href = "/calculator")}>
                Get Free Quote
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = "/auth")}
              >
                Contact Us
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Post Completed Work"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Project Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Corporate Branding for ABC Ltd"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Brief description of the work done"
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="flex flex-wrap gap-1.5">
                {PROJECT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-1.5 rounded-pill text-caption font-medium transition-all ${
                      form.category === cat
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]"
                    }`}
                  >
                    {categoryIcons[cat]} {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  value={form.clientName}
                  onChange={(e) =>
                    setForm({ ...form, clientName: e.target.value })
                  }
                  placeholder="e.g. ABC Ltd"
                />
              </div>
              <div className="space-y-2">
                <Label>Completion Date</Label>
                <Input
                  type="date"
                  value={form.completedDate}
                  onChange={(e) =>
                    setForm({ ...form, completedDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="featured-work"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
                className="w-4 h-4 rounded"
              />
              <Label htmlFor="featured-work" className="cursor-pointer">
                Feature this project on the main page
              </Label>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Project Images</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="work-images"
                onChange={handleImageUpload}
              />
              {form.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {form.images.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative group rounded-[var(--radius-md)] overflow-hidden border border-[var(--glass-border)]"
                    >
                      <img
                        src={img}
                        alt={`Image ${idx + 1}`}
                        className="w-full aspect-square object-cover"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  document.getElementById("work-images")?.click()
                }
                disabled={uploading}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {uploading
                  ? "Processing..."
                  : `Add Images (${form.images.length} uploaded)`}
              </Button>
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={save}>
                {editingProject ? "Save Changes" : "Post Project"}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
