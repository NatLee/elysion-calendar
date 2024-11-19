import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">艾莉森日曆快速查詢系統</h1>
      <Link 
        href="/rooms" 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        查看包廂狀態
      </Link>
    </main>
  );
}