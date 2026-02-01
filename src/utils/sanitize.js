function sanitizeUser(user) {
  if (!user) return null;
  // user can be doc or lean object
  const u = user.toObject ? user.toObject() : user;
  return {
    id: String(u._id),
    fullName: u.fullName,
    age: u.age ?? null,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    blocked: !!u.blocked,
    stats: u.stats || { videosWatched: 0, testsAvg: 0, guidesDownloaded: 0, ratingPlace: null },
    createdAt: u.createdAt,
    updatedAt: u.updatedAt
  };
}

module.exports = { sanitizeUser };

