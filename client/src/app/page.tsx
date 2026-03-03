"use client";

import Hero from "./_components/Hero";
import Navbar from "./_components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-home-gradient">
      <Navbar />
      <Hero />
    </div>
  );
}
