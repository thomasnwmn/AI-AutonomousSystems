import Image from "next/image";
import MazeGame from './maze'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center justify-center py-10 px-8 bg-white dark:bg-black">
        <MazeGame />
      </main>
    </div>
  );
}
