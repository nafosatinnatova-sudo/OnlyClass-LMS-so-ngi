const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Track = require("./models/Track");

async function ensureAdmin({ config }) {
  const email = config.ADMIN_EMAIL;
  const existing = await User.findOne({ email }).lean();
  if (existing) return;

  const admin = await User.create({
    fullName: "OnlyClass",
    age: null,
    email,
    phone: null,
    role: "admin",
    blocked: false,
    passwordHash: await bcrypt.hash(config.ADMIN_PASSWORD, 10),
    stats: { videosWatched: 0, testsAvg: 0, guidesDownloaded: 0, ratingPlace: null }
  });

  console.log(`Seeded admin: ${admin.email}`);
}

async function ensureDemo({ config }) {
  if (!config.SEED_DEMO) return;

  // demo users
  const demos = [
    {
      fullName: "Demo Student",
      age: 18,
      email: "student@onlyclass.local",
      phone: "+998700000001",
      role: "student",
      password: "Student123!",
      stats: { videosWatched: 1, testsAvg: 84, guidesDownloaded: 1, ratingPlace: 12 }
    },
    {
      fullName: "Demo Teacher",
      age: 24,
      email: "teacher@onlyclass.local",
      phone: "+998700000002",
      role: "teacher",
      password: "Teacher123!",
      stats: { videosWatched: 0, testsAvg: 0, guidesDownloaded: 0, ratingPlace: 3 }
    }
  ];

  for (const d of demos) {
    const exists = await User.findOne({ email: d.email }).lean();
    if (!exists) {
      await User.create({
        fullName: d.fullName,
        age: d.age,
        email: d.email,
        phone: d.phone,
        role: d.role,
        blocked: false,
        passwordHash: await bcrypt.hash(d.password, 10),
        stats: d.stats
      });
      console.log(`Seeded demo user: ${d.email}`);
    }
  }

  // demo tracks
  const demoTracks = [
    {
      title: "Frontend (HTML/CSS/JS)",
      description: "Noldan boshlab zamonaviy UI/UX va real loyihalar.",
      imageUrl: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=60"
    },
    {
      title: "Backend (Node.js)",
      description: "Express, JWT, role-based access, REST API.",
      imageUrl: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=60"
    }
  ];

  for (const t of demoTracks) {
    const exists = await Track.findOne({ title: t.title }).lean();
    if (!exists) {
      await Track.create(t);
      console.log(`Seeded demo track: ${t.title}`);
    }
  }
}

async function seedAll({ config }) {
  await ensureAdmin({ config });
  await ensureDemo({ config });
}

module.exports = { seedAll };

