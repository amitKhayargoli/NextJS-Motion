"use client";

import { useState } from "react";

export default function Page() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-5 flex items-center gap-3 cursor-pointer rounded-md p-2">
          <img src="/icons/Case.png" alt="" />
          <span>Motion Workspace / </span>
          <img src="/icons/Tick Square.png" alt="" />
          <span>Get Started </span>
        </div>
        <img src="/workspace-cover.png" alt="Logo" />

        <div className="p-16">
          <div className="text-gray-400 flex flex-col">
            <h1 className="text-5xl font-bold text-white">
              Welcome to MotionAI
            </h1>
            <h2 className="text-2xl font-semibold mb-6">
              Your Unified Workspace for Intelligent Productivity.
            </h2>

            <p className="text-xl mb-8 max-w-3xl">
              MotionAI ends the fragmentation in your workflow. We merge notes,
              audio, tasks, and meeting summaries into one intelligent platform,
              letting you focus on impact, not tools.
            </p>

            <div className="flex flex-col gap-4">
              <span className="text-white font-bold text-xl mb-2">
                Key Features:
              </span>

              {/* List with Dots */}
              <div className="flex flex-col gap-3">
                {[
                  "Unified Meeting Hub",
                  "AI-Powered Transcription",
                  "Chat with Your Knowledge Base (MindSpace)",
                  "Desktop-Class Experience",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 text-lg">
                    {/* The Dot */}
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-10 text-lg text-gray-300">
              Ready to start? Your first project is waiting. Begin by creating a
              new
              <span className="text-white font-semibold"> Note </span>
              or linking your
              <span className="text-white font-semibold"> calendar</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  const [activeItem, setActiveItem] = useState<string>("Get Started");

  return (
    <div className="py-4 px-4 flex flex-col w-68 bg-[#1F1F1F] h-screen text-white space-y-12">
      <div>
        <ParentSidebarItem icon="/icons/Case.png" title="Motion Workspace" />

        {/* <img src="/icons/collapse-sidebar.svg" alt="Logo" width={24} /> */}

        <div className="ml-auto w-[90%] mt-2 space-y-2">
          {/* Passing both activeItem and setActiveItem as props */}
          <SidebarItem
            icon="/icons/Tick Square.png"
            title="Get Started"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          <SidebarItem
            icon="/icons/Add User.png"
            title="Accounts"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          <SidebarItem
            icon="/icons/Layers.png"
            title="Database"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          <SidebarItem
            icon="/icons/Microphone.png"
            title="MindSpace"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </div>
      </div>
      <div>
        <ParentSidebarItem icon="/icons/Call.png" title="Meetings Space" />
        <div className="ml-auto w-[90%] mt-2 space-y-2">
          {/* Pass both activeItem and setActiveItem as props */}
          <SidebarItem
            icon="/icons/2 User.png"
            title="Local Meetings"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          <SidebarItem
            icon="/icons/Add User.png"
            title="Integrations"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          <SidebarItem
            icon="/icons/Layers.png"
            title="Meeting Notes"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
          <SidebarItem
            icon="/icons/Calendar.png"
            title="Calendar"
            activeItem={activeItem}
            setActiveItem={setActiveItem}
          />
        </div>
      </div>

      <div className="absolute bottom-15 left-8 flex items-center gap-2 cursor-pointer hover:bg-white/10 rounded-md py-2 px-4">
        <img src="/icons/Message circle.png" alt="" />
        <span className="ml-2">Invite Collaborators</span>
      </div>
    </div>
  );
}
function ParentSidebarItem({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer rounded-md p-2">
      <img src={icon} alt="" />
      <span>{title}</span>
      <img src="/icons/chevdown.png" alt="" className="ml-auto" />
    </div>
  );
}

function SidebarItem({
  icon,
  title,
  activeItem,
  setActiveItem,
}: {
  icon: string;
  title: string;
  activeItem: string;
  setActiveItem: (title: string) => void;
}) {
  // Check if this specific item is the active one
  const isActive = activeItem === title;

  return (
    <div
      onClick={() => setActiveItem(title)}
      className={`flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-md pl-4 pr-3 py-2 transition-colors ${
        isActive ? "bg-[#141414]" : ""
      }`}
    >
      <div className="w-5 h-5">
        <img src={icon} alt="" />
      </div>
      <span>{title}</span>
      <img src="/icons/dots.svg" width={24} alt="" className="ml-auto" />
    </div>
  );
}
