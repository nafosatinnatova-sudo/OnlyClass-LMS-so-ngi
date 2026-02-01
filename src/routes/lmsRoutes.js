const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Track = require("../models/Track");
const TeacherProfile = require("../models/TeacherProfile");
const Video = require("../models/Video");
const Test = require("../models/Test");
const Guide = require("../models/Guide");
const Comment = require("../models/Comment");
const Attempt = require("../models/Attempt");

const { asyncHandler } = require("../middleware/asyncHandler");

function idOf(doc) {
  return String(doc._id);
}

function mapTrack(t, teachersCount = 0) {
  return {
    id: idOf(t),
    title: t.title,
    description: t.description,
    imageUrl: t.imageUrl || null,
    createdAt: t.createdAt,
    teachersCount
  };
}

function mapProfile(p, teacherName, counts) {
  return {
    id: idOf(p),
    trackId: String(p.trackId),
    teacherId: String(p.teacherId),
    avatarUrl: p.avatarUrl || null,
    headline: p.headline,
    aboutShort: p.aboutShort,
    createdAt: p.createdAt,
    teacherName,
    videosCount: counts?.videosCount ?? 0,
    testsCount: counts?.testsCount ?? 0,
    guidesCount: counts?.guidesCount ?? 0
  };
}

function mapVideo(v) {
  return {
    id: idOf(v),
    trackId: String(v.trackId),
    profileId: String(v.profileId),
    teacherId: String(v.teacherId),
    videoUrl: v.videoUrl,
    title: v.title,
    description: v.description || null,
    duration: v.duration,
    testId: v.testId ? String(v.testId) : null,
    guideId: v.guideId ? String(v.guideId) : null,
    views: Number(v.views || 0),
    createdAt: v.createdAt
  };
}

function mapTest(t, { forStudent }) {
  const base = {
    id: idOf(t),
    trackId: String(t.trackId),
    profileId: String(t.profileId),
    teacherId: String(t.teacherId),
    imageUrl: t.imageUrl || null,
    title: t.title,
    level: t.level,
    questions: t.questions.map((q) => {
      const safe = {
        imageUrl: q.imageUrl || null,
        text: q.text,
        options: q.options,
        timeoutSeconds: q.timeoutSeconds
      };
      if (!forStudent) safe.correctIndex = q.correctIndex;
      return safe;
    }),
    createdAt: t.createdAt
  };
  return base;
}

function mapGuide(g) {
  return {
    id: idOf(g),
    trackId: String(g.trackId),
    profileId: String(g.profileId),
    teacherId: String(g.teacherId),
    pdfUrl: g.pdfUrl,
    title: g.title,
    description: g.description || null,
    downloadCount: Number(g.downloadCount || 0),
    createdAt: g.createdAt
  };
}

function clampText(s, max) {
  const t = String(s || "").trim();
  return t.length > max ? t.slice(0, max) : t;
}

function isValidObjectId(id) {
  return mongoose.isValidObjectId(String(id));
}

function makeLmsRoutes({ config, authRequired, requireRole, requireTeacherOrAdmin }) {
  const router = express.Router();

  // Tracks list
  router.get(
    "/tracks",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const tracks = await Track.find({}).sort({ createdAt: 1 });
      const profiles = await TeacherProfile.find({}).select("trackId").lean();
      const countByTrack = new Map();
      for (const p of profiles) {
        const k = String(p.trackId);
        countByTrack.set(k, (countByTrack.get(k) || 0) + 1);
      }

      const totals = {
        tracks: tracks.length,
        teachers: await User.countDocuments({ role: "teacher" }),
        students: await User.countDocuments({ role: "student" })
      };

      return res.json({
        tracks: tracks.map((t) => mapTrack(t, countByTrack.get(String(t._id)) || 0)),
        totals
      });
    })
  );

  // Admin: create track
  router.post(
    "/admin/tracks",
    authRequired(config),
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const title = String(req.body?.title || "").trim();
      const description = String(req.body?.description || "").trim();
      const imageUrl = String(req.body?.imageUrl || "").trim() || null;
      if (title.length < 2) return res.status(400).json({ error: "Title is required" });
      if (description.length < 4) return res.status(400).json({ error: "Description is required" });

      const track = await Track.create({ title, description, imageUrl });
      return res.json({ track: mapTrack(track, 0) });
    })
  );

  // Teachers in track
  router.get(
    "/tracks/:trackId/teachers",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { trackId } = req.params;
      if (!isValidObjectId(trackId)) return res.status(404).json({ error: "Track not found" });

      const track = await Track.findById(trackId);
      if (!track) return res.status(404).json({ error: "Track not found" });

      const profiles = await TeacherProfile.find({ trackId }).sort({ createdAt: 1 }).lean();
      const teacherIds = profiles.map((p) => String(p.teacherId));
      const teachers = await User.find({ _id: { $in: teacherIds } }).select("fullName role").lean();
      const teacherNameById = new Map(teachers.map((t) => [String(t._id), t.role === "admin" ? "OnlyClass" : t.fullName]));

      // counts per profile
      const profileIds = profiles.map((p) => String(p._id));
      const [videoCounts, testCounts, guideCounts] = await Promise.all([
        Video.aggregate([{ $match: { profileId: { $in: profileIds.map((x) => new mongoose.Types.ObjectId(x)) } } }, { $group: { _id: "$profileId", c: { $sum: 1 } } }]),
        Test.aggregate([{ $match: { profileId: { $in: profileIds.map((x) => new mongoose.Types.ObjectId(x)) } } }, { $group: { _id: "$profileId", c: { $sum: 1 } } }]),
        Guide.aggregate([{ $match: { profileId: { $in: profileIds.map((x) => new mongoose.Types.ObjectId(x)) } } }, { $group: { _id: "$profileId", c: { $sum: 1 } } }])
      ]);
      const vc = new Map(videoCounts.map((x) => [String(x._id), x.c]));
      const tc = new Map(testCounts.map((x) => [String(x._id), x.c]));
      const gc = new Map(guideCounts.map((x) => [String(x._id), x.c]));

      return res.json({
        track: mapTrack(track, profiles.length),
        profiles: profiles.map((p) =>
          mapProfile(p, teacherNameById.get(String(p.teacherId)) || "Teacher", {
            videosCount: vc.get(String(p._id)) || 0,
            testsCount: tc.get(String(p._id)) || 0,
            guidesCount: gc.get(String(p._id)) || 0
          })
        )
      });
    })
  );

  // Teacher: create profile in track (1 per track per teacher)
  router.post(
    "/teacher/tracks/:trackId/profile",
    authRequired(config),
    requireTeacherOrAdmin,
    asyncHandler(async (req, res) => {
      const { trackId } = req.params;
      if (!isValidObjectId(trackId)) return res.status(404).json({ error: "Track not found" });

      const track = await Track.findById(trackId);
      if (!track) return res.status(404).json({ error: "Track not found" });

      const avatarUrl = String(req.body?.avatarUrl || "").trim() || null;
      const headline = String(req.body?.headline || "").trim();
      const aboutShort = clampText(req.body?.aboutShort, 20);
      if (headline.length < 2) return res.status(400).json({ error: "Headline is required" });
      if (!aboutShort || aboutShort.length < 2) return res.status(400).json({ error: "Short about is required (max 20 chars)" });

      const teacherId = req.user._id;
      const exists = await TeacherProfile.findOne({ trackId, teacherId }).lean();
      if (exists) return res.status(409).json({ error: "Profile already exists for this track" });

      const profile = await TeacherProfile.create({ trackId, teacherId, avatarUrl, headline, aboutShort });
      return res.json({
        profile: mapProfile(profile.toObject(), req.user.role === "admin" ? "OnlyClass" : req.user.fullName, {
          videosCount: 0,
          testsCount: 0,
          guidesCount: 0
        })
      });
    })
  );

  // Profile (teacher info)
  router.get(
    "/profiles/:profileId",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { profileId } = req.params;
      if (!isValidObjectId(profileId)) return res.status(404).json({ error: "Profile not found" });
      const profile = await TeacherProfile.findById(profileId).lean();
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      const teacher = await User.findById(profile.teacherId).select("fullName role").lean();
      const teacherName = teacher ? (teacher.role === "admin" ? "OnlyClass" : teacher.fullName) : "Teacher";
      return res.json({
        profile: {
          ...mapProfile(profile, teacherName, null)
        }
      });
    })
  );

  // Videos list per profile
  router.get(
    "/profiles/:profileId/videos",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { profileId } = req.params;
      if (!isValidObjectId(profileId)) return res.status(404).json({ error: "Profile not found" });
      const profile = await TeacherProfile.findById(profileId).lean();
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      const videos = await Video.find({ profileId }).sort({ createdAt: 1 }).lean();
      return res.json({ profileId, videos: videos.map(mapVideo) });
    })
  );

  // Teacher: add video
  router.post(
    "/teacher/profiles/:profileId/videos",
    authRequired(config),
    requireTeacherOrAdmin,
    asyncHandler(async (req, res) => {
      const { profileId } = req.params;
      if (!isValidObjectId(profileId)) return res.status(404).json({ error: "Profile not found" });
      const profile = await TeacherProfile.findById(profileId).lean();
      if (!profile) return res.status(404).json({ error: "Profile not found" });

      const isOwner = String(profile.teacherId) === String(req.user._id) || req.user.role === "admin";
      if (!isOwner) return res.status(403).json({ error: "Forbidden" });

      const videoUrl = String(req.body?.videoUrl || "").trim();
      const title = String(req.body?.title || "").trim();
      const description = String(req.body?.description || "").trim() || null;
      const duration = String(req.body?.duration || "").trim();
      const testId = req.body?.testId ? String(req.body.testId) : null;
      const guideId = req.body?.guideId ? String(req.body.guideId) : null;

      if (!videoUrl) return res.status(400).json({ error: "Video URL is required" });
      if (title.length < 2) return res.status(400).json({ error: "Title is required" });
      if (!duration) return res.status(400).json({ error: "Duration is required" });

      // validate test/guide ownership if provided
      if (testId) {
        if (!isValidObjectId(testId)) return res.status(400).json({ error: "Invalid testId" });
        const t = await Test.findById(testId).lean();
        if (!t || String(t.teacherId) !== String(profile.teacherId)) return res.status(400).json({ error: "Invalid testId" });
      }
      if (guideId) {
        if (!isValidObjectId(guideId)) return res.status(400).json({ error: "Invalid guideId" });
        const g = await Guide.findById(guideId).lean();
        if (!g || String(g.teacherId) !== String(profile.teacherId)) return res.status(400).json({ error: "Invalid guideId" });
      }

      const video = await Video.create({
        trackId: profile.trackId,
        profileId: profile._id,
        teacherId: profile.teacherId,
        videoUrl,
        title,
        description,
        duration,
        testId: testId ? new mongoose.Types.ObjectId(testId) : null,
        guideId: guideId ? new mongoose.Types.ObjectId(guideId) : null,
        views: 0
      });

      return res.json({ video: mapVideo(video) });
    })
  );

  // Video details (with list + comments)
  router.get(
    "/videos/:videoId",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { videoId } = req.params;
      if (!isValidObjectId(videoId)) return res.status(404).json({ error: "Video not found" });

      const video = await Video.findById(videoId).lean();
      if (!video) return res.status(404).json({ error: "Video not found" });

      const profile = await TeacherProfile.findById(video.profileId).lean();
      const videos = await Video.find({ profileId: video.profileId }).sort({ createdAt: 1 }).lean();

      const comments = await Comment.find({ videoId }).sort({ createdAt: 1 }).lean();
      const userIds = comments.map((c) => String(c.userId));
      const authors = await User.find({ _id: { $in: userIds } }).select("fullName role").lean();
      const nameById = new Map(authors.map((u) => [String(u._id), u.role === "admin" ? "OnlyClass" : u.fullName]));

      return res.json({
        video: mapVideo(video),
        profile: profile
          ? {
              id: String(profile._id),
              trackId: String(profile.trackId),
              teacherId: String(profile.teacherId),
              avatarUrl: profile.avatarUrl || null,
              headline: profile.headline,
              aboutShort: profile.aboutShort,
              createdAt: profile.createdAt
            }
          : null,
        videos: videos.map(mapVideo),
        comments: comments.map((c) => ({
          id: String(c._id),
          videoId: String(c.videoId),
          userId: String(c.userId),
          text: c.text,
          createdAt: c.createdAt,
          authorName: nameById.get(String(c.userId)) || "User"
        }))
      });
    })
  );

  // Watch tracking
  router.post(
    "/videos/:videoId/watch",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { videoId } = req.params;
      if (!isValidObjectId(videoId)) return res.status(404).json({ error: "Video not found" });

      const video = await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }, { new: true }).lean();
      if (!video) return res.status(404).json({ error: "Video not found" });

      await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.videosWatched": 1 } }).lean();
      return res.json({ views: Number(video.views || 0) });
    })
  );

  // Comments (only student + admin)
  router.post(
    "/videos/:videoId/comments",
    authRequired(config),
    asyncHandler(async (req, res) => {
      if (req.user.role !== "student" && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
      const { videoId } = req.params;
      if (!isValidObjectId(videoId)) return res.status(404).json({ error: "Video not found" });

      const text = String(req.body?.text || "").trim();
      if (!text) return res.status(400).json({ error: "Comment text required" });

      const video = await Video.findById(videoId).lean();
      if (!video) return res.status(404).json({ error: "Video not found" });

      const comment = await Comment.create({ videoId, userId: req.user._id, text: clampText(text, 500) });
      return res.json({
        comment: { id: String(comment._id), videoId: String(comment.videoId), userId: String(comment.userId), text: comment.text, createdAt: comment.createdAt }
      });
    })
  );

  // Tests list per profile
  router.get(
    "/profiles/:profileId/tests",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { profileId } = req.params;
      if (!isValidObjectId(profileId)) return res.status(404).json({ error: "Profile not found" });
      const profile = await TeacherProfile.findById(profileId).lean();
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      const tests = await Test.find({ profileId }).sort({ createdAt: 1 }).lean();
      // For list we can keep questions for count
      return res.json({
        profileId,
        tests: tests.map((t) => ({
          id: String(t._id),
          imageUrl: t.imageUrl || null,
          title: t.title,
          level: t.level,
          questions: t.questions,
          createdAt: t.createdAt
        }))
      });
    })
  );

  // Teacher: create test
  router.post(
    "/teacher/profiles/:profileId/tests",
    authRequired(config),
    requireTeacherOrAdmin,
    asyncHandler(async (req, res) => {
      const { profileId } = req.params;
      if (!isValidObjectId(profileId)) return res.status(404).json({ error: "Profile not found" });
      const profile = await TeacherProfile.findById(profileId).lean();
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      const isOwner = String(profile.teacherId) === String(req.user._id) || req.user.role === "admin";
      if (!isOwner) return res.status(403).json({ error: "Forbidden" });

      const imageUrl = String(req.body?.imageUrl || "").trim() || null;
      const title = String(req.body?.title || "").trim();
      const level = String(req.body?.level || "").trim().toLowerCase();
      const questions = Array.isArray(req.body?.questions) ? req.body.questions : [];

      if (title.length < 2) return res.status(400).json({ error: "Title is required" });
      if (!["qiyin", "ortacha", "oson", "o'rta", "o‘rtacha", "easy", "medium", "hard"].includes(level))
        return res.status(400).json({ error: "Invalid level" });
      if (questions.length < 1) return res.status(400).json({ error: "At least 1 question required" });

      let mapped;
      try {
        mapped = questions.map((q, i) => {
          const text = String(q?.text || "").trim();
          const options = Array.isArray(q?.options) ? q.options.map((x) => String(x)) : [];
          const correctIndex = Number(q?.correctIndex);
          const timeoutSeconds = Number(q?.timeoutSeconds);
          if (text.length < 1) throw new Error(`Question ${i + 1}: text required`);
          if (options.length < 2) throw new Error(`Question ${i + 1}: at least 2 options required`);
          if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length)
            throw new Error(`Question ${i + 1}: correctIndex invalid`);
          if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1 || timeoutSeconds > 15)
            throw new Error(`Question ${i + 1}: timeoutSeconds max 15`);
          return {
            imageUrl: q?.imageUrl ? String(q.imageUrl).trim() : null,
            text,
            options,
            correctIndex,
            timeoutSeconds
          };
        });
      } catch (e) {
        return res.status(400).json({ error: e?.message || "Invalid test" });
      }

      const test = await Test.create({
        trackId: profile.trackId,
        profileId: profile._id,
        teacherId: profile.teacherId,
        imageUrl,
        title,
        level,
        questions: mapped
      });

      return res.json({ test: mapTest(test.toObject(), { forStudent: false }) });
    })
  );

  // Test details: student doesn't receive correct answers
  router.get(
    "/tests/:testId",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { testId } = req.params;
      if (!isValidObjectId(testId)) return res.status(404).json({ error: "Test not found" });
      const test = await Test.findById(testId).lean();
      if (!test) return res.status(404).json({ error: "Test not found" });
      const forStudent = req.user.role === "student";
      return res.json({ test: mapTest(test, { forStudent }) });
    })
  );

  // Student: attempt (1st saved, next only visible)
  router.post(
    "/tests/:testId/attempts",
    authRequired(config),
    requireRole("student"),
    asyncHandler(async (req, res) => {
      const { testId } = req.params;
      if (!isValidObjectId(testId)) return res.status(404).json({ error: "Test not found" });
      const answers = Array.isArray(req.body?.answers) ? req.body.answers.map((x) => Number(x)) : [];

      const test = await Test.findById(testId).lean();
      if (!test) return res.status(404).json({ error: "Test not found" });
      if (answers.length !== test.questions.length) return res.status(400).json({ error: "Answers length mismatch" });

      const userId = req.user._id;
      const hasSaved = await Attempt.exists({ testId, userId, saved: true });

      let correctCount = 0;
      for (let i = 0; i < test.questions.length; i++) {
        if (Number(answers[i]) === Number(test.questions[i].correctIndex)) correctCount++;
      }
      const totalQuestions = test.questions.length;
      const scorePercent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
      const result = { correctCount, totalQuestions, scorePercent };

      if (!hasSaved) {
        await Attempt.create({
          testId,
          userId,
          answers,
          saved: true,
          ...result
        });

        // recompute avg from saved attempts
        const savedAttempts = await Attempt.find({ userId, saved: true }).select("scorePercent").lean();
        const avg = Math.round(savedAttempts.reduce((sum, a) => sum + Number(a.scorePercent || 0), 0) / Math.max(1, savedAttempts.length));
        await User.findByIdAndUpdate(userId, { $set: { "stats.testsAvg": avg } }).lean();

        return res.json({ saved: true, result });
      }

      return res.json({ saved: false, result });
    })
  );

  // Guides list per profile
  router.get(
    "/profiles/:profileId/guides",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { profileId } = req.params;
      if (!isValidObjectId(profileId)) return res.status(404).json({ error: "Profile not found" });
      const profile = await TeacherProfile.findById(profileId).lean();
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      const guides = await Guide.find({ profileId }).sort({ createdAt: 1 }).lean();
      return res.json({ profileId, guides: guides.map(mapGuide) });
    })
  );

  // Teacher: add guide (PDF URL)
  router.post(
    "/teacher/profiles/:profileId/guides",
    authRequired(config),
    requireTeacherOrAdmin,
    asyncHandler(async (req, res) => {
      const { profileId } = req.params;
      if (!isValidObjectId(profileId)) return res.status(404).json({ error: "Profile not found" });
      const profile = await TeacherProfile.findById(profileId).lean();
      if (!profile) return res.status(404).json({ error: "Profile not found" });
      const isOwner = String(profile.teacherId) === String(req.user._id) || req.user.role === "admin";
      if (!isOwner) return res.status(403).json({ error: "Forbidden" });

      const pdfUrl = String(req.body?.pdfUrl || "").trim();
      const title = String(req.body?.title || "").trim();
      const description = String(req.body?.description || "").trim() || null;

      if (!pdfUrl) return res.status(400).json({ error: "PDF URL required" });
      if (!/\.pdf(\?|#|$)/i.test(pdfUrl)) return res.status(400).json({ error: "Guide must be a .pdf URL" });
      if (title.length < 2) return res.status(400).json({ error: "Title is required" });

      const guide = await Guide.create({
        trackId: profile.trackId,
        profileId: profile._id,
        teacherId: profile.teacherId,
        pdfUrl,
        title,
        description,
        downloadCount: 0
      });

      return res.json({ guide: mapGuide(guide) });
    })
  );

  // Guide download tracking
  router.post(
    "/guides/:guideId/download",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const { guideId } = req.params;
      if (!isValidObjectId(guideId)) return res.status(404).json({ error: "Guide not found" });
      const guide = await Guide.findByIdAndUpdate(guideId, { $inc: { downloadCount: 1 } }, { new: true }).lean();
      if (!guide) return res.status(404).json({ error: "Guide not found" });

      await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.guidesDownloaded": 1 } }).lean();

      return res.json({ url: guide.pdfUrl, downloadCount: Number(guide.downloadCount || 0) });
    })
  );

  // Statistics
  router.get(
    "/statistics",
    authRequired(config),
    asyncHandler(async (req, res) => {
      const students = await User.find({ role: "student" }).select("fullName stats").lean();
      const teachers = await User.find({ role: "teacher" }).select("fullName").lean();

      const teacherIds = teachers.map((t) => t._id);
      const profiles = await TeacherProfile.find({ teacherId: { $in: teacherIds } }).select("_id teacherId").lean();
      const profileIds = profiles.map((p) => p._id);

      const [vAgg, tAgg, gAgg] = await Promise.all([
        Video.aggregate([{ $match: { profileId: { $in: profileIds } } }, { $group: { _id: "$teacherId", c: { $sum: 1 } } }]),
        Test.aggregate([{ $match: { profileId: { $in: profileIds } } }, { $group: { _id: "$teacherId", c: { $sum: 1 } } }]),
        Guide.aggregate([{ $match: { profileId: { $in: profileIds } } }, { $group: { _id: "$teacherId", c: { $sum: 1 } } }])
      ]);
      const vBy = new Map(vAgg.map((x) => [String(x._id), x.c]));
      const tBy = new Map(tAgg.map((x) => [String(x._id), x.c]));
      const gBy = new Map(gAgg.map((x) => [String(x._id), x.c]));

      return res.json({
        totals: {
          students: students.length,
          teachers: teachers.length,
          tracks: await Track.countDocuments({})
        },
        students: students.map((u) => ({
          id: String(u._id),
          fullName: u.fullName,
          guidesDownloaded: Number(u.stats?.guidesDownloaded || 0),
          videosWatched: Number(u.stats?.videosWatched || 0),
          testsAvg: Number(u.stats?.testsAvg || 0)
        })),
        teachers: teachers.map((t) => ({
          id: String(t._id),
          fullName: t.fullName,
          videosUploaded: vBy.get(String(t._id)) || 0,
          testsCreated: tBy.get(String(t._id)) || 0,
          guidesUploaded: gBy.get(String(t._id)) || 0
        }))
      });
    })
  );

  return router;
}

module.exports = { makeLmsRoutes };

