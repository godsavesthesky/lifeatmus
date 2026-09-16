/**
 * Penutup halaman. Nama besar yang terpotong di tepi bawah adalah satu-
 * satunya hiasan di sini — sisanya teks kecil yang tenang, karena footer
 * bukan tempat orang mencari sesuatu.
 */
export function Footer() {
  return (
    <footer className="mt-32 overflow-hidden border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-5 py-10 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-10">
        <p>Platform acara internal. Hanya untuk lingkungan kantor.</p>
        <p>
          Dibuat Izzy sebagai proyek pribadi.{' '}
          <a
            href="https://www.instagram.com/_azizizi/"
            target="_blank"
            rel="noopener noreferrer"
            className="link-sweep text-lime"
          >
            @_azizizi
          </a>
        </p>
      </div>

      <div
        aria-hidden="true"
        className="font-display select-none px-5 text-[22vw] leading-[0.72] tracking-tightest text-cream/[0.06] md:px-10"
        style={{ marginBottom: '-0.18em' }}
      >
        WEEKLYHUB
      </div>
    </footer>
  )
}