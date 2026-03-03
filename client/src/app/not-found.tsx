import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-home-gradient text-white flex flex-col">
      <nav className="flex py-4 px-8 border-b border-[#375506]">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" width={40} height={40} alt="MotionAI" />
          <span className="font-bold text-[#70AA12]">MotionAI</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="bg-[#003600]/20 backdrop-blur-md border border-[#375506] rounded-2xl p-12 max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#70AA12]/20 border border-[#70AA12] flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-bold text-[#D2FF89]">?</span>
          </div>

          <h1 className="text-8xl font-bold text-[#D2FF89] mb-2">404</h1>
          <h2 className="text-2xl font-bold text-white mb-4">Page not found</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>

          <Link
            href="/"
            className="inline-block bg-[#70AA12] hover:bg-[#5a8a0e] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
