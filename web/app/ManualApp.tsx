"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookHeart,
  BookMarked,
  Bookmark,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  HeartHandshake,
  Home,
  List,
  Menu,
  Moon,
  Search,
  Settings2,
  Share2,
  ShieldAlert,
  Sparkles,
  Sun,
  Type,
  WifiOff,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  manualChapters,
  manualUpdated,
  type ManualChapter,
} from "./manual-data";

type Theme = "light" | "dark";
type QuickNeed = {
  title: string;
  description: string;
  chapter: string;
  section?: string;
  tone: string;
};

const quickNeeds: QuickNeed[] = [
  {
    title: "Mi cuerpo sigue en alerta",
    description: "Miedo, sobresaltos, temblores o sensación de peligro.",
    chapter: "guia-1",
    section: "por-que-tengo-tanto-miedo",
    tone: "blue",
  },
  {
    title: "No consigo descansar",
    description: "Sueño alterado, agotamiento y pensamientos que no paran.",
    chapter: "guia-2",
    tone: "indigo",
  },
  {
    title: "Estoy atravesando una pérdida",
    description: "Duelo, culpa, ausencia, objetos y fechas difíciles.",
    chapter: "guia-3",
    tone: "gold",
  },
  {
    title: "Quiero acompañar a alguien",
    description: "Cómo estar cerca sin invadir, juzgar ni apresurar.",
    chapter: "guia-4",
    tone: "green",
  },
  {
    title: "Necesito ayudar a un niño",
    description: "Palabras, rutinas y señales según la edad.",
    chapter: "guia-5",
    tone: "coral",
  },
  {
    title: "Estoy cuidando y ya no puedo más",
    description: "Cansancio por compasión y cuidado de quienes ayudan.",
    chapter: "guia-6",
    tone: "teal",
  },
];

const groundingSteps = [
  {
    number: "5",
    label: "cosas que puedes ver",
    prompt: "Mira despacio. No necesitas nombrarlas en voz alta.",
  },
  {
    number: "4",
    label: "cosas que puedes sentir con el tacto",
    prompt: "La ropa, el suelo, una superficie o tus manos.",
  },
  {
    number: "3",
    label: "sonidos que puedes escuchar",
    prompt: "Cerca o lejos. Solo observa que están ahí.",
  },
  {
    number: "2",
    label: "olores que puedes reconocer",
    prompt: "Si no encuentras dos, recuerda un olor seguro.",
  },
  {
    number: "1",
    label: "cosa que quieres recordar ahora",
    prompt: "Por ejemplo: «Estoy aquí. Este momento está pasando».",
  },
];

const chapterNumber = (chapter: ManualChapter) => {
  const match = chapter.title.match(/^Guía\s+(\d+)/);
  if (match) return match[1].padStart(2, "0");
  if (chapter.id === "introduccion") return "00";
  return "•";
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const resultExcerpt = (chapter: ManualChapter, query: string) => {
  const plain = chapter.searchText.replace(/\s+/g, " ").trim();
  const index = normalize(plain).indexOf(normalize(query));
  const start = Math.max(0, index > -1 ? index - 72 : 0);
  const end = Math.min(plain.length, start + 190);
  return `${start > 0 ? "…" : ""}${plain.slice(start, end)}${
    end < plain.length ? "…" : ""
  }`;
};

export function ManualApp() {
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<Theme>("light");
  const [fontScale, setFontScale] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.72);
  const [progress, setProgress] = useState(0);
  const [lastRead, setLastRead] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [groundingStep, setGroundingStep] = useState(0);
  const [online, setOnline] = useState(true);
  const articleRef = useRef<HTMLElement>(null);

  const currentChapter = useMemo(
    () =>
      manualChapters.find((chapter) => chapter.id === currentChapterId) ?? null,
    [currentChapterId],
  );

  const mainChapters = useMemo(
    () =>
      manualChapters.filter((chapter) =>
        [
          "introduccion",
          "guia-1",
          "guia-2",
          "guia-3",
          "guia-4",
          "guia-5",
          "guia-6",
          "guia-7",
          "herramientas-practicas",
          "palabras-para-seguir-caminando",
        ].includes(chapter.id),
      ),
    [],
  );

  const searchResults = useMemo(() => {
    const cleanQuery = normalize(query.trim());
    if (cleanQuery.length < 2) return [];
    return manualChapters
      .filter((chapter) =>
        normalize(
          `${chapter.title} ${chapter.subtitle} ${chapter.searchText}`,
        ).includes(cleanQuery),
      )
      .slice(0, 10);
  }, [query]);

  const navigate = useCallback((chapterId?: string, sectionId?: string) => {
    const nextHash = chapterId
      ? `${chapterId}${sectionId ? `/${sectionId}` : ""}`
      : "";
    if (nextHash) window.location.hash = nextHash;
    else history.pushState(null, "", `${location.pathname}${location.search}`);
    setCurrentChapterId(chapterId ?? null);
    setActiveSection(sectionId ?? "");
    setMenuOpen(false);
    setSearchOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (chapterId) {
      localStorage.setItem("guia-last-read", chapterId);
      setLastRead(chapterId);
    }
    if (sectionId) {
      window.setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, []);

  useEffect(() => {
    const readHash = () => {
      const [chapterId, sectionId] = location.hash.replace(/^#/, "").split("/");
      if (manualChapters.some((chapter) => chapter.id === chapterId)) {
        setCurrentChapterId(chapterId);
        setActiveSection(sectionId ?? "");
        if (sectionId) {
          window.setTimeout(
            () => document.getElementById(sectionId)?.scrollIntoView(),
            100,
          );
        }
      } else {
        setCurrentChapterId(null);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    const storedTheme = localStorage.getItem("guia-theme") as Theme | null;
    const storedScale = Number(localStorage.getItem("guia-font-scale"));
    const storedLine = Number(localStorage.getItem("guia-line-height"));
    const storedBookmarks = JSON.parse(
      localStorage.getItem("guia-bookmarks") ?? "[]",
    ) as string[];
    const storedLastRead = localStorage.getItem("guia-last-read");
    if (storedTheme === "dark" || storedTheme === "light") setTheme(storedTheme);
    if (storedScale >= 0.9 && storedScale <= 1.3) setFontScale(storedScale);
    if (storedLine >= 1.55 && storedLine <= 1.95) setLineHeight(storedLine);
    setBookmarks(storedBookmarks);
    setLastRead(storedLastRead);
    setOnline(navigator.onLine);
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty(
      "--reader-scale",
      fontScale.toString(),
    );
    document.documentElement.style.setProperty(
      "--reader-leading",
      lineHeight.toString(),
    );
    localStorage.setItem("guia-theme", theme);
    localStorage.setItem("guia-font-scale", fontScale.toString());
    localStorage.setItem("guia-line-height", lineHeight.toString());
  }, [theme, fontScale, lineHeight]);

  useEffect(() => {
    if (!currentChapter) {
      setProgress(0);
      return;
    }
    const onScroll = () => {
      const article = articleRef.current;
      if (!article) return;
      const start = article.offsetTop;
      const total = Math.max(1, article.offsetHeight - window.innerHeight);
      const value = Math.min(100, Math.max(0, ((scrollY - start) / total) * 100));
      setProgress(value);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [currentChapter]);

  useEffect(() => {
    if (!currentChapter) return;
    const headings = Array.from(
      articleRef.current?.querySelectorAll<HTMLElement>("h2[id], h3[id]") ?? [],
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [currentChapter]);

  const toggleBookmark = () => {
    if (!currentChapter) return;
    const key = `${currentChapter.id}/${activeSection}`;
    const next = bookmarks.includes(key)
      ? bookmarks.filter((bookmark) => bookmark !== key)
      : [...bookmarks, key];
    setBookmarks(next);
    localStorage.setItem("guia-bookmarks", JSON.stringify(next));
  };

  const shareCurrent = async () => {
    const data = {
      title: currentChapter?.title ?? "Guía de reconstrucción psicológica",
      text:
        currentChapter?.subtitle ??
        "Cuando todo se derrumba por dentro y por fuera.",
      url: location.href,
    };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else await navigator.clipboard?.writeText(location.href);
  };

  const currentMainIndex = currentChapter
    ? mainChapters.findIndex((item) => item.id === currentChapter.id)
    : -1;
  const previousChapter =
    currentMainIndex > 0 ? mainChapters[currentMainIndex - 1] : null;
  const nextChapter =
    currentMainIndex >= 0 && currentMainIndex < mainChapters.length - 1
      ? mainChapters[currentMainIndex + 1]
      : null;
  const bookmarkKey = currentChapter
    ? `${currentChapter.id}/${activeSection}`
    : "";

  return (
    <div className="site-shell">
      <div className="reading-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate()}
          aria-label="Ir al inicio"
        >
          <span className="brand-mark">V</span>
          <span>
            <strong>Reconstrucción</strong>
            <small>Guía psicológica</small>
          </span>
        </button>
        <div className="topbar-chapter" aria-live="polite">
          {currentChapter ? currentChapter.title : "Venezuela · 2026"}
        </div>
        <div className="topbar-actions">
          {!online && (
            <span className="offline-badge">
              <WifiOff size={15} />
              Sin conexión
            </span>
          )}
          <button
            className="icon-button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar en la guía"
          >
            <Search size={20} />
          </button>
          <button
            className="icon-button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Ajustar lectura"
          >
            <Type size={20} />
          </button>
          <button
            className="icon-button mobile-only"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir capítulos"
          >
            <Menu size={21} />
          </button>
        </div>
      </header>

      {currentChapter ? (
        <div className="reader-layout">
          <aside className="reader-sidebar">
            <button className="back-home" onClick={() => navigate()}>
              <ArrowLeft size={17} />
              Volver al inicio
            </button>
            <nav aria-label="Capítulos de la guía">
              <p className="nav-label">Capítulos</p>
              {mainChapters.map((chapter) => (
                <button
                  key={chapter.id}
                  className={chapter.id === currentChapter.id ? "active" : ""}
                  onClick={() => navigate(chapter.id)}
                >
                  <span>{chapterNumber(chapter)}</span>
                  <span>{chapter.subtitle || chapter.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="reader-main">
            <article ref={articleRef} className="manual-article">
              <div className="article-kicker">
                <span>
                  {currentChapter.minutes} min de lectura aproximada
                </span>
                <div>
                  <button onClick={toggleBookmark}>
                    {bookmarks.includes(bookmarkKey) ? (
                      <BookMarked size={18} />
                    ) : (
                      <Bookmark size={18} />
                    )}
                    Guardar
                  </button>
                  <button onClick={shareCurrent}>
                    <Share2 size={18} />
                    Compartir
                  </button>
                </div>
              </div>
              <h1>{currentChapter.title}</h1>
              {currentChapter.subtitle && (
                <p className="article-subtitle">{currentChapter.subtitle}</p>
              )}
              <div
                className="article-content"
                dangerouslySetInnerHTML={{ __html: currentChapter.html }}
              />
            </article>

            <nav className="chapter-pagination" aria-label="Seguir leyendo">
              {previousChapter ? (
                <button onClick={() => navigate(previousChapter.id)}>
                  <ArrowLeft size={18} />
                  <span>
                    <small>Anterior</small>
                    {previousChapter.title}
                  </span>
                </button>
              ) : (
                <span />
              )}
              {nextChapter ? (
                <button
                  className="next"
                  onClick={() => navigate(nextChapter.id)}
                >
                  <span>
                    <small>Siguiente</small>
                    {nextChapter.title}
                  </span>
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button className="next" onClick={() => navigate()}>
                  <span>
                    <small>Terminar</small>
                    Volver al inicio
                  </span>
                  <Home size={18} />
                </button>
              )}
            </nav>
          </main>

          <aside className="section-sidebar">
            <p className="nav-label">En este capítulo</p>
            <nav aria-label="Apartados del capítulo">
              {currentChapter.sections.map((section) => (
                <button
                  key={section.id}
                  className={`${section.level === 3 ? "nested" : ""} ${
                    activeSection === section.id ? "active" : ""
                  }`}
                  onClick={() => navigate(currentChapter.id, section.id)}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      ) : (
        <main className="home-page">
          <section className="hero">
            <div className="hero-copy">
              <span className="eyebrow">
                <Sparkles size={16} />
                Primeros auxilios psicológicos ampliados
              </span>
              <h1>
                Volver a respirar
                <br />
                también es <em>reconstruir.</em>
              </h1>
              <p>
                Una guía para comprender lo que sientes, atravesar el duelo y
                acompañar a otras personas después de una catástrofe.
              </p>
              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => navigate(lastRead ?? "introduccion")}
                >
                  <BookHeart size={20} />
                  {lastRead ? "Continuar donde lo dejé" : "Comenzar la guía"}
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search size={19} />
                  Buscar una pregunta
                </button>
              </div>
              <div className="hero-meta">
                <span>
                  <Check size={15} />
                  Lectura gratuita
                </span>
                <span>
                  <Check size={15} />
                  Guarda tu progreso
                </span>
                <span>
                  <Check size={15} />
                  Disponible sin conexión
                </span>
              </div>
            </div>
            <div className="cover-stage">
              <div className="cover-glow" />
              <img
                src="./portada-guia.jpg"
                alt="Portada de la Guía de reconstrucción psicológica"
              />
              <div className="cover-note">
                <span>Edición 2026</span>
                <strong>Venezuela</strong>
              </div>
            </div>
          </section>

          <section className="urgent-note">
            <ShieldAlert size={23} />
            <div>
              <strong>Si tú o alguien cercano corre peligro</strong>
              <p>
                Busca atención urgente en el servicio de emergencias o centro
                sanitario disponible más cercano. No dejes sola a la persona.
              </p>
            </div>
            <button onClick={() => navigate("antes-de-empezar", "aviso-importante")}>
              Leer el aviso
              <ChevronRight size={18} />
            </button>
          </section>

          <section className="needs-section">
            <div className="section-heading">
              <span>Empieza por lo que necesitas hoy</span>
              <h2>No tienes que leerlo todo de una vez.</h2>
              <p>
                Elige la frase que más se parece a este momento. Puedes volver
                al resto cuando tengas fuerzas.
              </p>
            </div>
            <div className="needs-grid">
              {quickNeeds.map((need) => (
                <button
                  key={need.title}
                  className={`need-card ${need.tone}`}
                  onClick={() => navigate(need.chapter, need.section)}
                >
                  <span className="need-icon">
                    <HeartHandshake size={22} />
                  </span>
                  <strong>{need.title}</strong>
                  <p>{need.description}</p>
                  <span className="card-link">
                    Abrir esta parte
                    <ArrowRight size={17} />
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="grounding-section">
            <div className="grounding-copy">
              <span className="eyebrow calm">
                <Sparkles size={16} />
                Una pausa antes de seguir
              </span>
              <h2>Vuelve al presente en cinco pasos.</h2>
              <p>
                Si notas que leer activa demasiado tu cuerpo, detente. Apoya los
                pies y prueba este recorrido sin exigirte hacerlo perfecto.
              </p>
              <p className="grounding-disclaimer">
                Puedes parar en cualquier momento. Esto no sustituye atención
                profesional.
              </p>
            </div>
            <div className="grounding-card">
              <div className="grounding-progress">
                {groundingSteps.map((_, index) => (
                  <span
                    key={index}
                    className={index <= groundingStep ? "active" : ""}
                  />
                ))}
              </div>
              <div className="grounding-number">
                {groundingSteps[groundingStep].number}
              </div>
              <h3>{groundingSteps[groundingStep].label}</h3>
              <p>{groundingSteps[groundingStep].prompt}</p>
              <button
                onClick={() =>
                  setGroundingStep((step) =>
                    step === groundingSteps.length - 1 ? 0 : step + 1,
                  )
                }
              >
                {groundingStep === groundingSteps.length - 1
                  ? "Volver a empezar"
                  : "Siguiente paso"}
                <ArrowRight size={18} />
              </button>
            </div>
          </section>

          <section className="chapters-section">
            <div className="section-heading horizontal">
              <div>
                <span>La guía completa</span>
                <h2>Un camino que puedes recorrer a tu ritmo.</h2>
              </div>
              <a href="./guia-reconstruccion-psicologica.pdf" download>
                <Download size={18} />
                Descargar PDF
              </a>
            </div>
            <div className="chapter-list">
              {mainChapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => navigate(chapter.id)}
                >
                  <span className="chapter-index">{chapterNumber(chapter)}</span>
                  <span className="chapter-copy">
                    <small>{chapter.title}</small>
                    <strong>{chapter.subtitle || chapter.title}</strong>
                    <span>{chapter.description}</span>
                  </span>
                  <span className="chapter-time">{chapter.minutes} min</span>
                  <ChevronRight className="chapter-arrow" size={20} />
                </button>
              ))}
            </div>
          </section>

          <section className="authors-strip">
            <div className="authors-mark">IP · AA</div>
            <div>
              <span>Una guía escrita desde la experiencia</span>
              <h2>Indira Lucía Parra y Antonio José Arnal Meinhardt</h2>
              <p>
                Psiquiatría, duelo, atención a víctimas y respuesta humana ante
                emergencias en Venezuela.
              </p>
            </div>
            <button onClick={() => navigate("sobre-los-autores")}>
              Conocer a los autores
              <ArrowRight size={18} />
            </button>
          </section>

          <footer>
            <div>
              <strong>Guía de reconstrucción psicológica</strong>
              <p>Cuando todo se derrumba por dentro y por fuera.</p>
            </div>
            <div className="footer-links">
              <button onClick={() => navigate("antes-de-empezar")}>
                Aviso importante
              </button>
              <button onClick={() => navigate("referencias")}>
                Referencias
              </button>
              <a href="./guia-reconstruccion-psicologica.pdf">PDF</a>
            </div>
            <small>
              © 2026 Indira Lucía Parra y Antonio José Arnal Meinhardt ·
              Información revisada el {manualUpdated}.
            </small>
          </footer>
        </main>
      )}

      <nav className="mobile-bottom-nav" aria-label="Navegación principal">
        <button
          className={!currentChapter ? "active" : ""}
          onClick={() => navigate()}
        >
          <Home size={20} />
          Inicio
        </button>
        <button onClick={() => setMenuOpen(true)}>
          <List size={20} />
          Capítulos
        </button>
        <button onClick={() => setSearchOpen(true)}>
          <Search size={20} />
          Buscar
        </button>
        <button onClick={() => setSettingsOpen(true)}>
          <Type size={20} />
          Lectura
        </button>
      </nav>

      {searchOpen && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="search-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Buscar en la guía"
          >
            <div className="sheet-heading">
              <div>
                <span>Encuentra una palabra o una pregunta</span>
                <h2>Buscar en la guía</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSearchOpen(false)}
                aria-label="Cerrar búsqueda"
              >
                <X size={21} />
              </button>
            </div>
            <label className="search-input">
              <Search size={21} />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej.: miedo, culpa, dormir, niños…"
              />
              {query && (
                <button onClick={() => setQuery("")} aria-label="Borrar">
                  <X size={17} />
                </button>
              )}
            </label>
            <div className="search-results">
              {query.trim().length < 2 ? (
                <div className="search-empty">
                  <CircleHelp size={27} />
                  <p>
                    Escribe al menos dos letras. No importa si no usas las
                    palabras exactas del manual.
                  </p>
                </div>
              ) : searchResults.length ? (
                searchResults.map((chapter) => (
                  <button key={chapter.id} onClick={() => navigate(chapter.id)}>
                    <span>{chapter.title}</span>
                    <strong>{chapter.subtitle || chapter.title}</strong>
                    <p>{resultExcerpt(chapter, query)}</p>
                    <ChevronRight size={19} />
                  </button>
                ))
              ) : (
                <div className="search-empty">
                  <Search size={27} />
                  <p>
                    No encontramos esa expresión. Prueba con una palabra más
                    breve o revisa los capítulos.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {settingsOpen && (
        <div className="modal-backdrop align-right" role="presentation">
          <section
            className="settings-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Ajustes de lectura"
          >
            <div className="sheet-heading">
              <div>
                <span>Haz que el texto se adapte a ti</span>
                <h2>Ajustes de lectura</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSettingsOpen(false)}
                aria-label="Cerrar ajustes"
              >
                <X size={21} />
              </button>
            </div>
            <div className="setting-group">
              <label>
                <Type size={19} />
                Tamaño del texto
              </label>
              <div className="segmented">
                {[0.9, 1, 1.15, 1.3].map((scale) => (
                  <button
                    key={scale}
                    className={fontScale === scale ? "active" : ""}
                    onClick={() => setFontScale(scale)}
                  >
                    {scale === 0.9
                      ? "A"
                      : scale === 1
                        ? "A+"
                        : scale === 1.15
                          ? "A++"
                          : "A+++"}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>
                <Settings2 size={19} />
                Espacio entre líneas
              </label>
              <div className="segmented">
                {[1.58, 1.72, 1.9].map((value) => (
                  <button
                    key={value}
                    className={lineHeight === value ? "active" : ""}
                    onClick={() => setLineHeight(value)}
                  >
                    {value === 1.58 ? "Compacto" : value === 1.72 ? "Cómodo" : "Amplio"}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-group">
              <label>Tema</label>
              <div className="theme-options">
                <button
                  className={theme === "light" ? "active" : ""}
                  onClick={() => setTheme("light")}
                >
                  <Sun size={19} />
                  Claro
                </button>
                <button
                  className={theme === "dark" ? "active" : ""}
                  onClick={() => setTheme("dark")}
                >
                  <Moon size={19} />
                  Oscuro
                </button>
              </div>
            </div>
            {bookmarks.length > 0 && (
              <div className="saved-block">
                <label>
                  <BookMarked size={19} />
                  Guardados en este dispositivo
                </label>
                {bookmarks.slice(-5).map((bookmark) => {
                  const [chapterId, sectionId] = bookmark.split("/");
                  const chapter = manualChapters.find(
                    (item) => item.id === chapterId,
                  );
                  const section = chapter?.sections.find(
                    (item) => item.id === sectionId,
                  );
                  return (
                    <button
                      key={bookmark}
                      onClick={() => {
                        setSettingsOpen(false);
                        navigate(chapterId, sectionId || undefined);
                      }}
                    >
                      <span>{chapter?.title}</span>
                      <strong>{section?.title || chapter?.subtitle}</strong>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {menuOpen && (
        <div className="modal-backdrop align-left" role="presentation">
          <section
            className="menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Capítulos"
          >
            <div className="sheet-heading">
              <div>
                <span>Lee a tu ritmo</span>
                <h2>Capítulos</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar capítulos"
              >
                <X size={21} />
              </button>
            </div>
            <nav>
              {mainChapters.map((chapter) => (
                <button
                  key={chapter.id}
                  className={currentChapter?.id === chapter.id ? "active" : ""}
                  onClick={() => navigate(chapter.id)}
                >
                  <span>{chapterNumber(chapter)}</span>
                  <div>
                    <small>{chapter.title}</small>
                    <strong>{chapter.subtitle || chapter.title}</strong>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ))}
            </nav>
          </section>
        </div>
      )}
    </div>
  );
}
