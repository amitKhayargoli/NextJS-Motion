import Image from "next/image";

interface PillDescProps {
  desc: string;
}
function PillDesc({ desc }: PillDescProps) {
  return (
    <div className="glass bg-[rgba(0, 54, 0, 0.2)] border border-[#375506] px-4 py-2 rounded-full w-fit mb-4 hover:bg-white/20 cursor-pointer">
      <span className="text-[16px]">{desc}</span>
    </div>
  );
}

export default function Hero() {
  return (
    <div className="w-full flex flex-col items-center py-20">
      {/* pill shaped hero desc*/}
      <PillDesc desc="📜✨ Set your life in Motion with AI Notes  " />

      <h1 className="text-5xl font-bold text-center text-[#D2FF89] mb-14">
        All-In-One Collaboration and <br /> Productivity Platform
      </h1>
      <Image src="/Workspace.png" alt={""} width={900} height={400}></Image>

      {/* logos */}
      <div className="flex space-x-12 mt-16">
        <span className="flex items-center">
          <Image src="/icons/logos/Slack.svg" alt="" width={60} height={60} />

          <h1 className="font-semibold text-xl">Slack</h1>
        </span>
        <span className="flex items-center">
          <Image src="/icons/logos/Notion.svg" alt="" width={50} height={50} />
          <h1 className="font-semibold text-xl">Notion</h1>
        </span>
        <span className="flex items-center">
          <Image src="/icons/logos/meet.svg" alt="" width={60} height={60} />
          <h1 className="font-semibold text-xl">Google Meet</h1>
        </span>
        <span className="flex items-center">
          <img src="/icons/logos/Trello.svg" alt="" width={160} />
        </span>
      </div>
    </div>
  );
}
