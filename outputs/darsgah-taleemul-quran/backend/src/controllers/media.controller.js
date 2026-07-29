import { Gallery, Video } from "../models/Content.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { extractYouTubeVideoId, youtubeEmbedUrl, youtubeThumbnailUrl } from "../utils/youtube.js";

function videoPayload(body, user) {
  const id = extractYouTubeVideoId(body.youtubeUrl);
  if (!String(body.title || "").trim()) {
    const error = new Error("Video title is required");
    error.statusCode = 422;
    throw error;
  }
  if (!id && body.videoType !== "MP4") {
    const error = new Error("Enter a valid YouTube URL");
    error.statusCode = 422;
    throw error;
  }
  return {
    title: body.title,
    videoType: body.videoType || "YouTube",
    youtubeVideoId: id,
    youtubeUrl: body.youtubeUrl,
    videoUrl: body.videoUrl,
    embedUrl: id ? youtubeEmbedUrl(id) : body.youtubeUrl,
    thumbnailUrl: id ? youtubeThumbnailUrl(id) : "",
    description: body.description,
    category: body.category,
    duration: body.duration || "",
    displayOrder: Number(body.displayOrder || 0),
    isFeatured: body.isFeatured === true || body.isFeatured === "true" || body.isFeatured === "on",
    published: body.published !== false && body.published !== "false",
    showOnHome: body.showOnHome !== false && body.showOnHome !== "false",
    createdBy: user?._id
  };
}

export async function listGallery(req, res) {
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const filter = {};
  if (req.query.featured === "true") filter.isFeatured = true;
  if (req.query.category) filter.category = req.query.category;
  const [items, total] = await Promise.all([
    Gallery.find(filter).sort("-createdAt").skip((page - 1) * limit).limit(limit).lean(),
    Gallery.countDocuments(filter)
  ]);
  res.json({ items, total, page, pages: Math.ceil(total / limit) });
}

export async function createGallery(req, res) {
  const file = req.file ? await uploadToCloudinary(req.file, "darsgah/gallery") : null;
  const photo = await Gallery.create({
    title: req.body.title,
    description: req.body.description,
    caption: req.body.caption,
    category: req.body.category || req.body.album,
    album: req.body.album || req.body.category,
    eventDate: req.body.eventDate || undefined,
    displayOrder: Number(req.body.displayOrder || 0),
    isFeatured: req.body.isFeatured === true || req.body.isFeatured === "true" || req.body.isFeatured === "on",
    published: req.body.published !== "false",
    imageUrl: file?.url || req.body.imageUrl,
    thumbnailUrl: file?.url || req.body.thumbnailUrl,
    cloudinaryPublicId: file?.publicId,
    uploadedBy: req.user?.name || req.user?.username || "Admin",
    uploadDate: new Date()
  });
  res.status(201).json({ message: "Gallery photo saved", photo });
}

export async function updateGallery(req, res) {
  const update = { ...req.body };
  if (req.file) {
    const file = await uploadToCloudinary(req.file, "darsgah/gallery");
    update.imageUrl = file.url;
    update.cloudinaryPublicId = file.publicId;
  }
  if ("isFeatured" in update) update.isFeatured = update.isFeatured === true || update.isFeatured === "true" || update.isFeatured === "on";
  const photo = await Gallery.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!photo) return res.status(404).json({ message: "Gallery photo not found" });
  res.json({ message: "Gallery photo updated", photo });
}

export async function deleteGallery(req, res) {
  await Gallery.findByIdAndDelete(req.params.id);
  res.json({ message: "Gallery photo deleted" });
}

export async function listVideos(req, res) {
  const filter = {};
  if (req.query.home === "true") filter.showOnHome = true;
  if (req.query.published === "true") filter.published = true;
  if (req.query.category) filter.category = req.query.category;
  const items = await Video.find(filter).sort("-isFeatured displayOrder -createdAt").limit(Math.min(Number(req.query.limit) || 12, 50)).lean();
  res.json({ items });
}

export async function createVideo(req, res) {
  const payload = videoPayload(req.body, req.user);
  if (payload.youtubeVideoId && await Video.exists({ youtubeVideoId: payload.youtubeVideoId })) return res.status(409).json({ message: "This YouTube video already exists." });
  const video = await Video.create(payload);
  res.status(201).json({ message: "Video saved", video });
}

export async function updateVideo(req, res) {
  const payload = videoPayload(req.body, req.user);
  if (payload.youtubeVideoId && await Video.exists({ youtubeVideoId: payload.youtubeVideoId, _id: { $ne: req.params.id } })) return res.status(409).json({ message: "This YouTube video already exists." });
  delete payload.createdBy;
  const video = await Video.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!video) return res.status(404).json({ message: "Video not found" });
  res.json({ message: "Video updated", video });
}

export async function deleteVideo(req, res) {
  await Video.findByIdAndDelete(req.params.id);
  res.json({ message: "Video deleted" });
}
