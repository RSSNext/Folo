const isWebBuild = !!process.env.WEB_BUILD || !!process.env.VERCEL

module.exports = {
  plugins: {
    tailwindcss: {},
    "tailwindcss/nesting": {},

    ...(isWebBuild ? { autoprefixer: {} } : {}),
    ...(process.env.NODE_ENV === "production" ? { cssnano: {} } : {}),
  },
}
