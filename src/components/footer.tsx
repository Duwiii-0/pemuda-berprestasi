const Footer = () => {
  return (
    <footer className="bg-red text-white w-full py-6">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-6">
        {/* Nama Resmi */}
        <h1 className="text-3xl font-bebas tracking-wide">Pemuda Berprestasi</h1>

        {/* Navigasi Cepat */}
        <nav className="flex gap-6 mt-4 md:mt-0 font-plex">
          <a
            href="/"
            className="hover:text-yellow-400 transition-colors duration-200"
          >
            Home
          </a>
          <a
            href="/event"
            className="hover:text-yellow-400 transition-colors duration-200"
          >
            Event
          </a>
          <a
            href="/tutorial"
            className="hover:text-yellow-400 transition-colors duration-200"
          >
            Tutorial
          </a>
        </nav>
      </div>

      {/* Copyright */}
      <div className="mt-4 text-center border-t border-white/20 pt-4">
        <p className="text-sm text-white font-plex">
          © 2025 Pemuda Berprestasi. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
