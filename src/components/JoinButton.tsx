import { useState } from 'react'

/**
 * Tombol utama: menyatakan kamu ikut sebuah acara.
 *
 * Sekarang dikendalikan dari luar (`joined` datang dari data, bukan state
 * sendiri) — sebelumnya tombol ini menyimpan statusnya sendiri, jadi setelah
 * halaman dimuat ulang statusnya selalu kembali ke "Ikut" walaupun orangnya
 * sudah terdaftar.
 *
 * Gerakannya menjawab tindakan orang, bukan menghiasi halaman — warna
 * menyapu dari kiri ke kanan lalu labelnya berubah dengan sentakan kecil,
 * supaya perubahan statusnya terasa terjadi.
 */
export function JoinButton({
  joined = false,
  full = false,
  disabled = false,
  onToggle,
  size = 'md',
}: {
  joined?: boolean
  full?: boolean
  disabled?: boolean
  onToggle?: () => void | Promise<void>
  size?: 'sm' | 'md'
}) {
  const [bump, setBump] = useState(false)
  const [busy, setBusy] = useState(false)

  const pad = size === 'sm' ? 'px-4 py-2 text-xs' : 'px-7 py-3.5 text-sm'

  async function handleClick() {
    if (busy || disabled || (full && !joined)) return
    setBump(true)
    setBusy(true)
    try {
      await onToggle?.()
    } finally {
      setBusy(false)
    }
  }

  if (full && !joined) {
    return (
      <span className={`${pad} inline-block cursor-not-allowed border border-line font-medium text-muted`}>
        Kuota penuh
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onAnimationEnd={() => setBump(false)}
      aria-pressed={joined}
      disabled={disabled || busy}
      className={`group relative overflow-hidden border font-medium transition-colors duration-300 ease-studio disabled:cursor-not-allowed disabled:opacity-60 ${pad} ${
        joined ? 'border-lime text-lime' : 'border-cream text-ink'
      } ${bump ? 'animate-stamp' : ''}`}
    >
      {/* Lapisan isi. Saat belum ikut, tombolnya padat; saat sudah ikut,
          isinya mundur ke kiri dan menyisakan garis tepi saja. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 origin-left bg-lime transition-transform duration-500 ease-studio ${
          joined ? 'scale-x-0' : 'scale-x-100'
        }`}
      />
      <span className="relative">{joined ? 'Kamu ikut' : 'Ikut'}</span>
    </button>
  )
}

/**
 * Untuk acara luar yang pendaftarannya ditangani penyelenggara sendiri.
 * Dibedakan dari tombol Ikut karena akibatnya berbeda: ini membawa orang
 * keluar dari aplikasi.
 */
export function RegisterButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="link-sweep px-1 py-3.5 text-sm font-medium text-cream transition-colors hover:text-lime"
    >
      Daftar di situs penyelenggara
    </a>
  )
}
