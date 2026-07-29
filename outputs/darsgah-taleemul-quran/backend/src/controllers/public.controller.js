import { Admission, Book, ContactMessage, Gallery, Notice, Resource, Video } from "../models/Content.js";
import { Event, Faculty, Setting, Syllabus } from "../models/ErpModels.js";

export async function publicHome(_req, res) {
  const [notices, books, resources, gallery, videos, events, faculty, syllabus] = await Promise.all([
    Notice.find({ audience: { $in: ["public", "all"] } }).sort("-createdAt").limit(5).lean(),
    Book.find({ isPublic: true, published: { $ne: false } }).sort("-isFeatured displayOrder -createdAt").limit(8).lean(),
    Resource.find({ isPublic: true, published: { $ne: false } }).sort("-isFeatured displayOrder -createdAt").limit(12).lean(),
    Gallery.find({ published: { $ne: false }, isFeatured: true }).sort("displayOrder -createdAt").limit(6).lean(),
    Video.find({ showOnHome: true, published: true }).sort("-isFeatured displayOrder -createdAt").limit(4).lean(),
    Event.find({ audience: { $in: ["public", "all"] } }).sort("-date").limit(8).lean(),
    Faculty.find({ status: "active", isPublished: { $ne: false } }).populate("assignedSubjects", "name").sort("name").limit(12).lean(),
    Syllabus.find({ isPublic: true, isPublished: { $ne: false } }).sort("-createdAt").limit(8).lean()
  ]);
  res.json({ notices, books, resources, gallery, videos, events, faculty, syllabus });
}

export async function publicList(req, res) {
  const registry = {
    books: Book,
    resources: Resource,
    gallery: Gallery,
    galleryPhotos: Gallery,
    videos: Video,
    notices: Notice,
    events: Event,
    faculty: Faculty,
    syllabus: Syllabus
  };
  const Model = registry[req.params.resource];
  if (!Model) return res.status(404).json({ message: "Public resource not found" });
  const q = req.query.q;
  const filter = {};
  if (["books", "resources", "syllabus"].includes(req.params.resource)) filter.isPublic = true;
  if (req.params.resource === "syllabus") filter.isPublished = { $ne: false };
  if (req.params.resource === "faculty") filter.isPublished = { $ne: false };
  if (req.params.resource === "notices") filter.audience = { $in: ["public", "all"] };
  if (q) filter.$or = ["title", "name", "author", "category", "description"].map((field) => ({ [field]: new RegExp(q, "i") }));
  const items = await Model.find(filter).sort("-createdAt").limit(Math.min(Number(req.query.limit) || 50, 100)).lean();
  res.json({ items });
}

export async function islamicAssistantSettings(_req, res) {
  const record = await Setting.findOne({ key: "islamicAssistant" }).lean();
  const value = record?.value || {};
  res.json({
    enabled: value.enabled !== false,
    publicName: value.publicName || "Darsgah Islamic Assistant",
    greeting:
      value.greeting ||
      "Assalamu Alaikum! I can help with Islamic teachings, Quranic concepts, Hadith, Seerah, Islamic history, worship and Islamic terminology. How may I help you?",
    suggestedQuestions: Array.isArray(value.suggestedQuestions) && value.suggestedQuestions.length
      ? value.suggestedQuestions.slice(0, 8)
      : [
          "What are the five pillars of Islam?",
          "What does Taqwa mean?",
          "How many daily prayers are there?",
          "Explain the meaning of Zakat.",
          "What is the difference between Fard and Sunnah?",
          "Tell me about the importance of good character in Islam."
        ],
    maxMessageLength: Math.min(Number(value.maxMessageLength) || 1000, 1000),
    dailyRequestLimit: Number(value.dailyRequestLimit) || 50,
    disclaimer:
      value.disclaimer ||
      "This assistant provides general Islamic educational information. For personal religious rulings or important matters, please consult a qualified Islamic scholar.",
    homepageVisible: value.homepageVisible !== false,
    displayPosition: value.displayPosition || "bottom-right",
    maintenanceMessage: value.maintenanceMessage || "The Islamic Assistant is currently unavailable."
  });
}

export async function createAdmission(req, res) {
  const admission = await Admission.create(req.body);
  res.status(201).json({ message: "Admission request submitted", admission });
}

export async function createContact(req, res) {
  const contact = await ContactMessage.create(req.body);
  res.status(201).json({ message: "Message received", contact });
}
