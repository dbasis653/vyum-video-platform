import Image from "next/image";
import Link from "next/link";
import FloatingBrand from "@/components/FloatingBrand";

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background image */}
      <Image
        src="/images/dog logo.png"
        alt="Vyum Content Vault"
        fill
        className="object-cover object-center"
        priority
      />

      {/* Subtle dark overlay */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Top-left: Auth buttons */}
      <div className="absolute top-6 left-6 flex flex-col gap-3 z-10">
        <Link
          href="/sign-in"
          className="btn rounded-full px-10 font-black uppercase tracking-widest border-none text-black"
          style={{ backgroundColor: "#4ade80" }}
        >
          Sign-In
        </Link>
        <Link
          href="/sign-up"
          className="btn rounded-full px-10 font-black uppercase tracking-widest border-none text-black"
          style={{ backgroundColor: "#22d3ee" }}
        >
          Register
        </Link>
      </div>

      {/* <FloatingBrand className="bottom-6 right-6" /> */}
    </section>
  );
}
