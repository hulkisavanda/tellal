import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">tellal.</h1>
        <p className="text-gray-500 mt-3 text-sm leading-relaxed">
          Lead ve mesaj otomasyonu. Devam etmek için giriş yap veya hesap oluştur.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex justify-center rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Giriş
          </Link>
          <Link
            href="/register"
            className="inline-flex justify-center rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Kayıt ol
          </Link>
        </div>
      </div>
    </div>
  )
}
