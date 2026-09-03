import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Calendar,
  Star,
  ImagePlus,
  X,
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

const PROJECT_CATEGORIES = [
  "Business Cards",
  "Banners & Signage",
  "Brochures & Flyers",
  "Books & Catalogs",
  "Posters & Prints",
  "Vehicle Branding",
  "Office Branding",
  "Apparel & Merchandise",
  "Photo & Canvas",
  "Acrylic & Engraving",
  "Other",
];

const gradientColors = [
  "from-blue-500 to-blue-600",
  "from-orange-500 to-orange-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-red-500 to-red-600",
  "from-pink-500 to-pink-600",
  "from-teal-500 to-teal-600",
  "from-indigo-500 to-indigo-600",
];

function getGradient(index: number) {
  return gradientColors[index % gradientColors.length];
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin" || user?.role === "sales";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
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

  const openCreate = () => {
    setEditingProject(null);
    setForm({
      title: "",
      description: "",
      clientName: "",
      category: "",
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
          title: editingProject ? "Project updated" : "Project created",
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

  const toggleFeatured = async (project: Project) => {
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...project, featured: !project.featured }),
      });
      if (res.ok) {
        fetchProjects();
      }
    } catch {
      toast({ title: "Failed to update project", variant: "destructive" });
    }
  };

  const featuredProjects = projects.filter((p) => p.featured);
  const regularProjects = projects.filter((p) => !p.featured);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
              Our Projects
            </h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Showcase of completed work for our clients
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1" /> New Project
            </Button>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImagePlus className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-subhead text-[var(--text-tertiary)]">
              No projects showcased yet.
            </p>
            {isAdmin && (
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" /> Add First Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Featured projects */}
          {featuredProjects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-headline font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Star className="w-5 h-5 text-[var(--accent-secondary)]" />
                Featured Work
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {featuredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-[var(--glass-shadow)] transition-all duration-200 h-full">
                      {project.images && project.images.length > 0 ? (
                        <ImageSlideshow
                          images={project.images}
                          alt={project.title}
                          className="h-52"
                          showDots={project.images.length > 1}
                          showArrows={project.images.length > 1}
                          autoPlayInterval={20000}
                        />
                      ) : (
                        <div
                          className={`h-52 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center`}
                        >
                          <span className="text-5xl opacity-60">🖼️</span>
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
                                onClick={() => toggleFeatured(project)}
                                title="Toggle featured"
                              >
                                <Star className="w-3.5 h-3.5 fill-[var(--accent-secondary)] text-[var(--accent-secondary)]" />
                              </Button>
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
                                onClick={() => deleteProject(project.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {project.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {project.category}
                            </Badge>
                          )}
                          {project.clientName && (
                            <Badge variant="outline" className="text-[10px]">
                              {project.clientName}
                            </Badge>
                          )}
                          {project.completedDate && (
                            <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(project.completedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All projects */}
          {regularProjects.length > 0 && (
            <div className="space-y-4">
              {featuredProjects.length > 0 && (
                <h2 className="text-headline font-semibold text-[var(--text-primary)]">
                  All Projects
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {regularProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: (featuredProjects.length + index) * 0.05,
                    }}
                  >
                    <Card className="overflow-hidden hover:shadow-[var(--glass-shadow)] transition-all duration-200 hover:scale-[0.98] h-full">
                      {project.images && project.images.length > 0 ? (
                        <ImageSlideshow
                          images={project.images}
                          alt={project.title}
                          className="h-40"
                          showDots={project.images.length > 1}
                          showArrows={project.images.length > 1}
                          autoPlayInterval={20000}
                        />
                      ) : (
                        <div
                          className={`h-40 bg-gradient-to-br ${getGradient(index)} flex items-center justify-center`}
                        >
                          <span className="text-4xl opacity-60">🖼️</span>
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
                                onClick={() => toggleFeatured(project)}
                                title="Toggle featured"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </Button>
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
                                onClick={() => deleteProject(project.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {project.category && (
                            <Badge variant="secondary" className="text-[10px]">
                              {project.category}
                            </Badge>
                          )}
                          {project.clientName && (
                            <Badge variant="outline" className="text-[10px]">
                              {project.clientName}
                            </Badge>
                          )}
                          {project.completedDate && (
                            <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(project.completedDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "New Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Title</Label>
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
                placeholder="Brief description of the project"
              />
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
                <Label>Category</Label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {PROJECT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`px-2 py-1 rounded-pill text-[10px] font-medium transition-all ${
                        form.category === cat
                          ? "bg-[var(--accent-primary)] text-white"
                          : "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) =>
                    setForm({ ...form, featured: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="featured" className="cursor-pointer">
                  Featured project
                </Label>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Project Images</Label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="project-images"
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
                  document.getElementById("project-images")?.click()
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
                {editingProject ? "Save Changes" : "Create Project"}
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
