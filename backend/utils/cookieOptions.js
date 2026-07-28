// Frontend and backend are deployed on different domains in production
// (e.g. vercel.app vs onrender.com), so the auth cookie must be sent
// cross-site: that requires sameSite: 'none', which browsers only honor
// when secure is also true. In local dev, frontend/backend run on
// different localhost ports but the same site, so 'lax' + non-secure
// (plain http) both work and are simpler to debug with.
export const getJwtCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };
};
