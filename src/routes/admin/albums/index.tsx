import {
  useMutation,
  useQueryClient,
  useSuspenseInfiniteQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pin,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AlbumItem } from "@/features/albums/albums.schema";
import {
  createAlbumFn,
  deleteAlbumFn,
  updateAlbumFn,
} from "@/features/albums/api/albums.admin.api";
import {
  ALBUMS_KEYS,
  adminAlbumsInfiniteQueryOptions,
} from "@/features/albums/queries";
import { uploadImageFn } from "@/features/media/api/media.api";
import { useMediaPicker } from "@/features/media/components/media-library/hooks/use-media-picker";
import { MEDIA_KEYS } from "@/features/media/queries";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/admin/albums/")({
  ssr: false,
  component: AdminAlbumsPage,
});

function AdminAlbumsPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Infinite query for albums
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(adminAlbumsInfiniteQueryOptions(20));

  const allAlbums = data.pages.flatMap((page) => page.items);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await deleteAlbumFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success("相册动态已删除");
      queryClient.invalidateQueries({ queryKey: ALBUMS_KEYS.all });
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error("删除失败: " + String(err));
    },
  });

  // Toggle Pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: number; pinned: boolean }) => {
      return await updateAlbumFn({
        data: {
          id,
          pinnedAt: pinned ? null : new Date().toISOString(),
        },
      });
    },
    onSuccess: () => {
      toast.success("置顶状态已更新");
      queryClient.invalidateQueries({ queryKey: ALBUMS_KEYS.all });
    },
    onError: (err) => {
      toast.error("更新置顶失败: " + String(err));
    },
  });

  // Toggle Status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: number;
      status: "draft" | "published";
    }) => {
      return await updateAlbumFn({
        data: {
          id,
          status: status === "published" ? "draft" : "published",
        },
      });
    },
    onSuccess: () => {
      toast.success("发布状态已更新");
      queryClient.invalidateQueries({ queryKey: ALBUMS_KEYS.all });
    },
    onError: (err) => {
      toast.error("更新状态失败: " + String(err));
    },
  });

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border/30 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-serif font-medium tracking-tight text-foreground flex items-center gap-3">
            <Camera size={28} className="text-muted-foreground" />
            相册管理
          </h1>
          <p className="text-xs font-mono tracking-widest text-muted-foreground uppercase">
            ALBUMS & MOMENTS MANAGEMENT
          </p>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="rounded-none bg-foreground text-background hover:bg-foreground/90 font-mono text-[10px] uppercase tracking-widest h-9 px-4 flex items-center gap-2"
        >
          <Plus size={14} />
          发布新动态
        </Button>
      </div>

      {/* Albums List */}
      <div className="space-y-4">
        {allAlbums.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground font-mono text-sm border border-dashed border-border/40 p-12">
            暂无相册动态，点击右上角发布一条生活瞬间吧！
          </div>
        ) : (
          <div className="border border-border/30 divide-y divide-border/20 bg-card">
            {allAlbums.map((album) => {
              const cover = album.media?.[0];
              const isPinned = !!album.pinnedAt;

              return (
                <div
                  key={album.id}
                  className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:bg-muted/10 transition-colors"
                >
                  {/* Left: Images + Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-border/40 bg-muted/20 flex items-center justify-center">
                      {cover ? (
                        <img
                          src={cover.url}
                          alt="封面"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon
                          size={20}
                          className="text-muted-foreground/40"
                        />
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            album.status === "published"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {album.status === "published" ? "已发布" : "草稿"}
                        </span>
                        {isPinned && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Pin size={10} className="rotate-45" />
                            置顶
                          </span>
                        )}
                        {album.location && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                            <MapPin size={11} />
                            {album.location}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-foreground/90 line-clamp-2 leading-relaxed">
                        {album.content}
                      </p>

                      <div className="text-xs font-mono text-muted-foreground/60 flex items-center gap-3">
                        <span>
                          {formatDate(album.publishedAt || album.createdAt)}
                        </span>
                        <span>· {album.media?.length ?? 0} 张照片</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setEditingAlbum(album)}
                      className="px-2.5 py-1 rounded border border-border/40 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      编辑
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        togglePinMutation.mutate({
                          id: album.id,
                          pinned: isPinned,
                        })
                      }
                      className="px-2.5 py-1 rounded border border-border/40 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {isPinned ? "取消置顶" : "置顶"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: album.id,
                          status: album.status,
                        })
                      }
                      className="px-2.5 py-1 rounded border border-border/40 hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      {album.status === "published" ? "转为草稿" : "发布"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingId(album.id)}
                      className="p-1.5 rounded border border-border/40 hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-colors"
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="pt-4 flex justify-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="font-mono text-xs"
            >
              {isFetchingNextPage ? "加载中..." : "加载更多动态"}
            </Button>
          </div>
        )}
      </div>

      {/* Create Album Modal */}
      {showCreateModal && (
        <AlbumFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ALBUMS_KEYS.all });
          }}
        />
      )}

      {/* Edit Album Modal */}
      {editingAlbum && (
        <AlbumFormModal
          initialData={editingAlbum}
          onClose={() => setEditingAlbum(null)}
          onSuccess={() => {
            setEditingAlbum(null);
            queryClient.invalidateQueries({ queryKey: ALBUMS_KEYS.all });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId !== null) {
            deleteMutation.mutate(deletingId);
          }
        }}
        title="确认删除动态"
        message="您确定要永久删除这条相册动态吗？此操作无法撤销。"
        confirmLabel="确认删除"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function AlbumFormModal({
  initialData,
  onClose,
  onSuccess,
}: {
  initialData?: AlbumItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState(initialData?.content ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  const [selectedMediaIds, setSelectedMediaIds] = useState<number[]>(
    initialData?.media?.map((m) => m.id) ?? [],
  );
  const [status, setStatus] = useState<"published" | "draft">(
    initialData?.status ?? "published",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Newly uploaded media items or initial media items
  const [localMediaItems, setLocalMediaItems] = useState<
    Array<{ id: number; url: string; fileName: string }>
  >(initialData?.media ?? []);

  // Hook into media picker
  const { mediaItems, isPending: isMediaPending } = useMediaPicker();

  // Combine local freshly uploaded/initial media with mediaItems from query
  const combinedMedia = useMemo(() => {
    const map = new Map<
      number,
      { id: number; url: string; fileName: string }
    >();
    for (const item of localMediaItems) {
      map.set(item.id, item);
    }
    for (const item of mediaItems) {
      if (!map.has(item.id)) {
        map.set(item.id, {
          id: item.id,
          url: item.url,
          fileName: item.fileName,
        });
      }
    }
    return Array.from(map.values());
  }, [localMediaItems, mediaItems]);

  const handleToggleMedia = (id: number) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleUploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const validFiles = files.filter((f) => f.type.startsWith("image/"));
      if (validFiles.length === 0) {
        toast.error("请选择或粘贴有效的图片文件 (PNG, JPG, WEBP, GIF)");
        return;
      }

      setIsUploading(true);
      const newUploadedIds: number[] = [];
      const newItems: Array<{ id: number; url: string; fileName: string }> = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(
          `正在上传 (${i + 1}/${validFiles.length}): ${file.name}`,
        );

        try {
          const formData = new FormData();
          formData.append("image", file);
          const res = await uploadImageFn({ data: formData });

          if (res.error) {
            toast.error(
              `图片 ${file.name} 上传失败: ${res.error.reason || "请检查格式或网络"}`,
            );
          } else if (res.data) {
            newUploadedIds.push(res.data.id);
            newItems.push({
              id: res.data.id,
              url: res.data.url,
              fileName: res.data.fileName,
            });
          }
        } catch (err) {
          toast.error(`图片 ${file.name} 上传出错: ${String(err)}`);
        }
      }

      if (newUploadedIds.length > 0) {
        setLocalMediaItems((prev) => [...newItems, ...prev]);
        setSelectedMediaIds((prev) => [...prev, ...newUploadedIds]);
        toast.success(`成功添加 ${newUploadedIds.length} 张照片！`);
        queryClient.invalidateQueries({ queryKey: MEDIA_KEYS.all });
      }

      setIsUploading(false);
      setUploadProgress("");
    },
    [queryClient],
  );

  // Global window paste listener while modal is open
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const files = Array.from(e.clipboardData?.files || []);

      const hasImageItem = items.some((item) => item.type.startsWith("image/"));
      const hasImageFile = files.some((file) => file.type.startsWith("image/"));

      // If user is pasting text and no images, let it pass through to textarea/input
      if (!hasImageItem && !hasImageFile) {
        return;
      }

      // Intercept image pasting
      e.preventDefault();

      const imageFiles: File[] = [];

      for (const file of files) {
        if (file.type.startsWith("image/")) {
          imageFiles.push(file);
        }
      }

      if (imageFiles.length === 0) {
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              const ext = file.type.split("/")[1] || "png";
              const namedFile =
                file.name && file.name !== "image.png"
                  ? file
                  : new File(
                      [file],
                      `paste-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`,
                      { type: file.type },
                    );
              imageFiles.push(namedFile);
            }
          }
        }
      }

      if (imageFiles.length > 0) {
        handleUploadFiles(imageFiles);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleUploadFiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("请输入动态文字内容");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialData) {
        await updateAlbumFn({
          data: {
            id: initialData.id,
            content: content.trim(),
            location: location.trim() || null,
            mediaIds: selectedMediaIds,
            status,
          },
        });
        toast.success("相册动态已更新！");
      } else {
        await createAlbumFn({
          data: {
            content: content.trim(),
            location: location.trim() || undefined,
            mediaIds: selectedMediaIds,
            status,
          },
        });
        toast.success("动态已成功发布！");
      }
      onSuccess();
    } catch (err) {
      toast.error("操作失败: " + String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Camera size={18} className="text-primary" />
            <h2 className="font-serif font-medium text-lg">
              {initialData ? "编辑相册动态" : "新建相册动态"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              动态文案 *
            </label>
            <Textarea
              placeholder="分享此时此刻的想法、心情或生活片段..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
              className="resize-none font-sans text-sm"
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <MapPin size={12} />
              位置标记 (可选)
            </label>
            <Input
              placeholder="例如：北京 · 朝阳公园 / 杭州西湖"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-sm font-sans"
            />
          </div>

          {/* Media Upload & Paste Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                照片选择与上传
              </label>
              <span className="text-[11px] font-mono text-muted-foreground/60">
                支持直接按 Ctrl+V 粘贴
              </span>
            </div>

            {/* Upload / Paste Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const droppedFiles = Array.from(e.dataTransfer.files).filter(
                  (f) => f.type.startsWith("image/"),
                );
                if (droppedFiles.length > 0) {
                  handleUploadFiles(droppedFiles);
                }
              }}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[0.99]"
                  : isUploading
                    ? "border-primary/50 bg-primary/5 cursor-wait"
                    : "border-border/60 hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleUploadFiles(Array.from(e.target.files));
                    e.target.value = "";
                  }
                }}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-1 text-primary">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-xs font-mono">
                    {uploadProgress || "正在上传图片..."}
                  </span>
                </div>
              ) : (
                <>
                  <div className="size-9 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground">
                    <Upload size={18} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-foreground">
                      按{" "}
                      <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-muted rounded border border-border/80 shadow-xs font-semibold">
                        Ctrl + V
                      </kbd>{" "}
                      直接粘贴截图，或点击选择本地照片
                    </p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      支持拖拽图片到此处 · 自动上传并加入动态 · 支持 PNG, JPG,
                      WEBP, GIF
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Selected Media Preview Strip */}
            {selectedMediaIds.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span>
                    已选照片 ({selectedMediaIds.length} 张，第 1 张为封面)
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedMediaIds([])}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                  >
                    清空已选
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5">
                  {selectedMediaIds.map((id, index) => {
                    const item = combinedMedia.find((m) => m.id === id);
                    if (!item) return null;
                    return (
                      <div
                        key={id}
                        className="relative size-16 shrink-0 rounded-lg overflow-hidden border border-border/60 group"
                      >
                        <img
                          src={item.url}
                          alt={item.fileName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 px-1 rounded bg-black/75 text-white text-[9px] font-mono font-bold">
                          {index === 0 ? "封面" : index + 1}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMedia(id);
                          }}
                          className="absolute top-1 right-1 size-4 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                          title="移除"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media Picker History Grid */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  媒体库历史照片
                </label>
                <span className="text-[11px] font-mono text-muted-foreground/60">
                  点击勾选或取消
                </span>
              </div>

              {isMediaPending && combinedMedia.length === 0 ? (
                <div className="py-6 flex items-center justify-center text-muted-foreground text-xs font-mono">
                  <Loader2 size={16} className="animate-spin mr-2" />
                  加载历史照片...
                </div>
              ) : combinedMedia.length === 0 ? (
                <div className="p-4 border border-dashed border-border/40 text-center text-xs font-mono text-muted-foreground rounded-lg">
                  暂无历史照片，请在上方直接粘贴截图 (Ctrl+V) 或点击上传
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1.5 border border-border/30 rounded-xl bg-muted/10">
                  {combinedMedia.map((img) => {
                    const isSelected = selectedMediaIds.includes(img.id);
                    const orderIndex = selectedMediaIds.indexOf(img.id);

                    return (
                      <div
                        key={img.id}
                        onClick={() => handleToggleMedia(img.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? "border-primary ring-2 ring-primary/40 scale-95"
                            : "border-border/40 hover:opacity-90"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.fileName}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1 right-1 size-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono font-bold flex items-center justify-center shadow-sm">
                            {orderIndex + 1}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Publish status */}
          <div className="pt-2 flex items-center justify-between border-t border-border/30">
            <div className="flex items-center gap-3">
              <label className="text-xs font-mono text-muted-foreground">
                状态:
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "published" | "draft")
                }
                className="text-xs font-mono bg-muted/40 border border-border/40 rounded px-2.5 py-1 text-foreground"
              >
                <option value="published">立即发布</option>
                <option value="draft">存为草稿</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting || isUploading}
                className="font-mono text-xs h-8 px-4"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="font-mono text-xs h-8 px-5"
              >
                {isSubmitting
                  ? "保存中..."
                  : initialData
                    ? "保存修改"
                    : "确认发布"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
