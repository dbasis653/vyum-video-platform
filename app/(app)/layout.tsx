"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  LogOutIcon,
  MenuIcon,
  LayoutDashboardIcon,
  Share2Icon,
  UploadIcon,
  ImageIcon,
} from "lucide-react";

const sidebarItems = [
  { href: "/home", icon: LayoutDashboardIcon, label: "Home" },
  { href: "/image-upload", icon: Share2Icon, label: "Image Upload" },
  { href: "/video-upload", icon: UploadIcon, label: "Video Upload" },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogoClick = () => {
    router.push("/");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="drawer lg:drawer-open">
      <input
        id="sidebar-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={sidebarOpen}
        onChange={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* ── Main content area ── */}
      <div
        className="drawer-content flex flex-col min-h-screen"
        style={{ background: "#0B1220" }}
      >
        {/* Navbar */}
        <header
          className="w-full sticky top-0 z-20"
          style={{
            background: "rgba(11,18,32,0.88)",
            borderBottom: "1px solid rgba(34,211,238,0.1)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="navbar max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile hamburger */}
            <div className="flex-none lg:hidden">
              <label
                htmlFor="sidebar-drawer"
                className="btn btn-square btn-ghost drawer-button"
                style={{ color: "rgba(34,211,238,0.65)" }}
              >
                <MenuIcon size={20} />
              </label>
            </div>

            {/* Brand */}
            <div className="flex-1">
              <Link href="/" onClick={handleLogoClick}>
                <div
                  className="btn btn-ghost normal-case text-lg font-bold tracking-tight cursor-pointer font-mono"
                  style={{ color: "#22D3EE" }}
                >
                  Your own Content-Vault
                </div>
              </Link>
            </div>

            {/* User info */}
            <div className="flex-none flex items-center gap-2">
              {user && (
                <>
                  <div
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{
                      background: "rgba(34,211,238,0.06)",
                      border: "1px solid rgba(34,211,238,0.12)",
                    }}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                      <img
                        src={user.imageUrl}
                        alt={
                          user.username || user.emailAddresses[0].emailAddress
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span
                      className="text-xs font-mono truncate max-w-35"
                      style={{ color: "rgba(186,230,255,0.65)" }}
                    >
                      {user.username || user.emailAddresses[0].emailAddress}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="btn btn-ghost btn-circle btn-sm"
                    title="Sign out"
                    style={{ color: "rgba(248,113,113,0.55)" }}
                  >
                    <LogOutIcon size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="grow">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 my-8">
            {children}
          </div>
        </main>
      </div>

      {/* ── Sidebar ── */}
      <div className="drawer-side z-30">
        <label htmlFor="sidebar-drawer" className="drawer-overlay" />
        <aside
          className="w-64 h-full flex flex-col"
          style={{
            background: "#0B1220",
            borderRight: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-center px-4 py-5"
            style={{ borderBottom: "1px solid rgba(34,211,238,0.08)" }}
          >
            <Link href="/" onClick={handleLogoClick} className="w-full">
              <img
                src="/images/vyum-logo.png"
                alt="Vyum"
                width={360}
                height={144}
                className="h-auto w-auto object-contain"
                style={{
                  filter: "drop-shadow(0 0 14px rgba(34,211,238,0.18))",
                }}
              />
            </Link>
          </div>

          {/* Nav items */}
          <ul className="flex flex-col gap-1 p-3 grow mt-2">
            {sidebarItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm font-mono tracking-wide"
                    style={{
                      background: active
                        ? "rgba(34,211,238,0.1)"
                        : "transparent",
                      color: active ? "#22D3EE" : "rgba(186,230,255,0.5)",
                      border: active
                        ? "1px solid rgba(34,211,238,0.18)"
                        : "1px solid transparent",
                    }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon size={15} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Sign out */}
          {user && (
            <div
              className="p-3"
              style={{ borderTop: "1px solid rgba(34,211,238,0.08)" }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-mono transition-all"
                style={{
                  color: "rgba(248,113,113,0.6)",
                  border: "1px solid rgba(248,113,113,0.14)",
                }}
              >
                <LogOutIcon size={14} />
                Sign Out
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
