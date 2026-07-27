import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Platform (target A) runs on Vercel. Client-site targets B/C live in their
  // own repos/projects — this app is the dashboard + API + CMS + admin only.
  reactStrictMode: true,
}

export default nextConfig
