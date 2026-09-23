import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Globe,
  Home,
  History,
  Lock,
  Maximize2,
  Menu,
  MoreHorizontal,
  Plus,
  RotateCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { sound } from "../../services/soundService";

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  loading: boolean;
  bookmarked: boolean;
  muted?: boolean;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  logo: string;
  gradient: string;
}

interface SpeedDialItem {
  id: string;
  name: string;
  url: string;
  domain: string;
  logo: string;
  gradient: string;
}

interface NewsItem {
  id: string;
  source: string;
  title: string;
  category: string;
  image: string;
  time: string;
}

const START_PAGE = "browser://start";
const HISTORY_KEY = "abhishek-browser-history";
const BOOKMARKS_KEY = "abhishek-browser-bookmarks";

const SEARCH_ENGINES = [
  { name: "Google", short: "G", url: "https://www.google.com/search?q=" },
  { name: "DuckDuckGo", short: "D", url: "https://duckduckgo.com/?q=" },
  { name: "Bing", short: "B", url: "https://www.bing.com/search?q=" },
];

const SPEED_DIAL: SpeedDialItem[] = [
  {
    id: "portfolio",
    name: "Abhishek",
    url: "https://abhishek-os-seven.vercel.app/",
    domain: "abhishek-os-seven.vercel.app",
    logo: "A",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "github",
    name: "GitHub",
    url: "https://github.com",
    domain: "github.com",
    logo: "GH",
    gradient: "from-slate-600 to-slate-950",
  },
  {
    id: "youtube",
    name: "YouTube",
    url: "https://youtube.com",
    domain: "youtube.com",
    logo: "▶",
    gradient: "from-red-500 to-red-700",
  },
  {
    id: "figma",
    name: "Figma",
    url: "https://figma.com",
    domain: "figma.com",
    logo: "F",
    gradient: "from-pink-500 to-violet-600",
  },
  {
    id: "vercel",
    name: "Vercel",
    url: "https://vercel.com",
    domain: "vercel.com",
    logo: "▲",
    gradient: "from-zinc-700 to-black",
  },
  {
    id: "amazon",
    name: "Amazon",
    url: "https://amazon.com",
    domain: "amazon.com",
    logo: "a",
    gradient: "from-orange-400 to-yellow-500",
  },
  {
    id: "velosa",
    name: "Velosa",
    url: "https://velosa.studio",
    domain: "velosa.studio",
    logo: "V",
    gradient: "from-violet-500 to-fuchsia-600",
  },
];

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  {
    id: "portfolio",
    title: "Abhishek Portfolio",
    url: "https://abhishek-os-seven.vercel.app/",
    domain: "abhishek-os-seven.vercel.app",
    logo: "A",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com",
    domain: "github.com",
    logo: "GH",
    gradient: "from-slate-600 to-slate-950",
  },
  {
    id: "youtube",
    title: "YouTube",
    url: "https://youtube.com",
    domain: "youtube.com",
    logo: "▶",
    gradient: "from-red-500 to-red-700",
  },
];

const NEWS: NewsItem[] = [
  {
    id: "1",
    source: "The Verge",
    title: "The next generation of personal computing is becoming beautifully visual",
    category: "TECH",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop",
    time: "18 min ago",
  },
  {
    id: "2",
    source: "WIRED",
    title: "Designers are building richer experiences around spatial interfaces",
    category: "DESIGN",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000&auto=format&fit=crop",
    time: "42 min ago",
  },
  {
    id: "3",
    source: "TechCrunch",
    title: "AI interfaces are moving from chat windows into creative workflows",
    category: "AI",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop",
    time: "1 hr ago",
  },
  {
    id: "4",
    source: "Fast Company",
    title: "Why spatial UI is becoming a major product design language",
    category: "DESIGN",
    image:
      "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=1000&auto=format&fit=crop",
    time: "2 hr ago",
  },
];

const CATEGORIES = [
  "ALL",
  "AI",
  "DESIGN",
  "TECH",
  "BUSINESS",
  "SCIENCE",
  "SPORTS",
  "NEWS",
];

const getHostname = (value: string) => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0];
  }
};

const isInternal = (value: string) => value.startsWith("browser://");

const looksLikeUrl = (value: string) =>
  /^https?:\/\//i.test(value) ||
  /^www\./i.test(value) ||
  /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(value);

const normalizeUrl = (value: string) => {
  const input = value.trim();
  if (!input) return START_PAGE;
  if (isInternal(input)) return input;
  if (looksLikeUrl(input)) {
    return /^https?:\/\//i.test(input) ? input : `https://${input}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
};

const createId = (prefix = "tab") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createTab = (): BrowserTab => ({
  id: createId(),
  title: "New Tab",
  url: START_PAGE,
  history: [START_PAGE],
  historyIndex: 0,
  loading: false,
  bookmarked: false,
});

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length)}…` : value;

const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const ArrowRightIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 6H10M6.5 2.5L10 6L6.5 9.5"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BrowserApp: React.FC = () => {
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [tabs, setTabs] = useState<BrowserTab[]>(() => {
    const tab = createTab();
    tab.id = "tab-main";
    return [tab];
  });
  const [activeTabId, setActiveTabId] = useState("tab-main");
  const [addressInput, setAddressInput] = useState(START_PAGE);
  const [searchText, setSearchText] = useState("");
  const [searchEngine, setSearchEngine] = useState(SEARCH_ENGINES[0]);
  const [showEngineMenu, setShowEngineMenu] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [hoveredDial, setHoveredDial] = useState<string | null>(null);
  const [notification, setNotification] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [bookmarks, setBookmarks] =
    useState<BookmarkItem[]>(DEFAULT_BOOKMARKS);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const activeTab =
    tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];

  useEffect(() => {
    setBookmarks(readStorage<BookmarkItem[]>(BOOKMARKS_KEY, DEFAULT_BOOKMARKS));
    setRecentUrls(readStorage<string[]>(HISTORY_KEY, []));
  }, []);

  useEffect(() => {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(recentUrls.slice(0, 30)));
  }, [recentUrls]);

  const notify = useCallback((message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 1800);
  }, []);

  const updateTab = useCallback(
    (id: string, updates: Partial<BrowserTab>) => {
      setTabs((current) =>
        current.map((tab) =>
          tab.id === id ? { ...tab, ...updates } : tab,
        ),
      );
    },
    [],
  );

  useEffect(() => {
    if (activeTab) setAddressInput(activeTab.url);
  }, [activeTabId, activeTab?.url]);

  const navigate = useCallback(
    (value: string, pushHistory = true) => {
      const finalUrl = normalizeUrl(value);
      const title = isInternal(finalUrl)
        ? "New Tab"
        : getHostname(finalUrl);

      setAddressInput(finalUrl);

      setTabs((current) =>
        current.map((tab) => {
          if (tab.id !== activeTabId) return tab;

          const nextHistory = pushHistory
            ? [
                ...tab.history.slice(0, tab.historyIndex + 1),
                finalUrl,
              ]
            : tab.history;

          return {
            ...tab,
            url: finalUrl,
            title,
            history: nextHistory,
            historyIndex: pushHistory
              ? nextHistory.length - 1
              : tab.historyIndex,
            loading: !isInternal(finalUrl),
          };
        }),
      );

      if (!isInternal(finalUrl)) {
        setRecentUrls((current) => [
          finalUrl,
          ...current.filter((url) => url !== finalUrl),
        ]);
        window.setTimeout(
          () => updateTab(activeTabId, { loading: false }),
          650,
        );
      }

      sound.playClick();
    },
    [activeTabId, updateTab],
  );

  const handleAddressSubmit = (event: FormEvent) => {
    event.preventDefault();
    navigate(addressInput);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = searchText.trim();
    if (!query) return;
    navigate(`${searchEngine.url}${encodeURIComponent(query)}`);
  };

  const handleNewTab = () => {
    const tab = createTab();
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
    setAddressInput(START_PAGE);
    setSearchText("");
    sound.playClick();
  };

  const duplicateTab = () => {
    if (!activeTab) return;
    const tab: BrowserTab = {
      ...activeTab,
      id: createId(),
      history: [...activeTab.history],
    };
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
    notify("Tab duplicated");
  };

  const closeTab = (
    id: string,
    event?: React.MouseEvent,
  ) => {
    event?.stopPropagation();

    if (tabs.length === 1) {
      navigate(START_PAGE);
      return;
    }

    const index = tabs.findIndex((tab) => tab.id === id);
    const remaining = tabs.filter((tab) => tab.id !== id);
    setTabs(remaining);

    if (activeTabId === id) {
      const next = remaining[index] ?? remaining[index - 1] ?? remaining[0];
      setActiveTabId(next.id);
      setAddressInput(next.url);
    }
    sound.playClick();
  };

  const goBack = () => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const nextIndex = activeTab.historyIndex - 1;
    const nextUrl = activeTab.history[nextIndex];

    updateTab(activeTabId, {
      url: nextUrl,
      title: isInternal(nextUrl) ? "New Tab" : getHostname(nextUrl),
      historyIndex: nextIndex,
      loading: !isInternal(nextUrl),
    });
    setAddressInput(nextUrl);
    sound.playClick();
  };

  const goForward = () => {
    if (
      !activeTab ||
      activeTab.historyIndex >= activeTab.history.length - 1
    )
      return;

    const nextIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.history[nextIndex];

    updateTab(activeTabId, {
      url: nextUrl,
      title: isInternal(nextUrl) ? "New Tab" : getHostname(nextUrl),
      historyIndex: nextIndex,
      loading: !isInternal(nextUrl),
    });
    setAddressInput(nextUrl);
    sound.playClick();
  };

  const reloadPage = () => {
    updateTab(activeTabId, { loading: true });
    sound.playClick();
    window.setTimeout(
      () => updateTab(activeTabId, { loading: false }),
      650,
    );
  };

  const toggleBookmark = () => {
    if (!activeTab) return;

    const next = !activeTab.bookmarked;
    updateTab(activeTabId, { bookmarked: next });

    if (next) {
      const item: BookmarkItem = {
        id: createId("bookmark"),
        title: activeTab.title || getHostname(activeTab.url),
        url: activeTab.url,
        domain: getHostname(activeTab.url),
        logo: getHostname(activeTab.url).slice(0, 2).toUpperCase(),
        gradient: "from-cyan-500 to-blue-600",
      };
      setBookmarks((current) => [
        item,
        ...current.filter((bookmark) => bookmark.url !== item.url),
      ]);
      notify("Added to bookmarks");
    } else {
      setBookmarks((current) =>
        current.filter((bookmark) => bookmark.url !== activeTab.url),
      );
      notify("Removed from bookmarks");
    }
    sound.playClick();
  };

  const openBookmark = (item: BookmarkItem) => {
    navigate(item.url);
    setShowBookmarks(false);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifier && key === "l") {
        event.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      } else if (modifier && key === "t") {
        event.preventDefault();
        handleNewTab();
      } else if (modifier && key === "w") {
        event.preventDefault();
        closeTab(activeTabId);
      } else if (modifier && key === "d") {
        event.preventDefault();
        duplicateTab();
      } else if (modifier && key === "r") {
        event.preventDefault();
        reloadPage();
      } else if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        goBack();
      } else if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        goForward();
      } else if (event.key === "Escape") {
        setShowEngineMenu(false);
        setShowBookmarks(false);
        setShowSettings(false);
        setShowMenu(false);
        setShowHistory(false);
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [activeTabId, tabs, activeTab]);

  const filteredNews = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return NEWS.filter((item) => {
      const categoryMatch =
        selectedCategory === "ALL" ||
        item.category === selectedCategory;

      const searchMatch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [selectedCategory, searchText]);

  const renderStartPage = () => (
    <div
      className="relative min-h-full overflow-y-auto overflow-x-hidden bg-[#070a10]"
      onMouseMove={handleMouseMove}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: mousePosition.x * -28,
            y: mousePosition.y * -16,
          }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/[0.09] blur-[120px]"
        />
        <motion.div
          animate={{
            x: mousePosition.x * 35,
            y: mousePosition.y * 20,
          }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
          className="absolute -right-40 top-10 h-[560px] w-[560px] rounded-full bg-violet-500/[0.09] blur-[130px]"
        />
        <motion.div
          animate={{
            x: mousePosition.x * 15,
            y: mousePosition.y * 35,
          }}
          transition={{ type: "spring", stiffness: 70, damping: 25 }}
          className="absolute bottom-0 left-1/3 h-[440px] w-[440px] rounded-full bg-blue-500/[0.06] blur-[120px]"
        />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 48,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute right-[12%] top-[15%] h-72 w-72 rounded-full border border-cyan-400/10"
        >
          <div className="absolute -left-1 top-1/2 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,.9)]" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 68,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute right-[9%] top-[11%] h-96 w-96 rounded-full border border-violet-400/10"
        >
          <div className="absolute right-5 top-1/2 h-1.5 w-1.5 rounded-full bg-violet-300 shadow-[0_0_20px_rgba(167,139,250,.9)]" />
        </motion.div>

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px] px-5 py-10 md:px-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 backdrop-blur-xl">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            Your personal start page
          </div>

          <h1 className="text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
            Good morning,
            <span className="ml-2 bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              Abhishek.
            </span>
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-slate-500">
            A faster, calmer and more cinematic place to start browsing.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          onSubmit={handleSearch}
          className="relative z-40 mx-auto max-w-[700px]"
        >
          <div className="group relative">
            <div className="absolute -inset-1 rounded-[25px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-violet-500/20 opacity-0 blur-xl transition duration-500 group-focus-within:opacity-100" />
            <div className="relative flex h-16 items-center rounded-[20px] border border-white/15 bg-[#111722]/90 p-1.5 shadow-[0_30px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEngineMenu((value) => !value)}
                  className="flex h-11 items-center gap-1.5 rounded-2xl px-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/[0.08] text-xs font-black">
                    {searchEngine.short}
                  </span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                <AnimatePresence>
                  {showEngineMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.96 }}
                      className="absolute left-0 top-13 w-48 rounded-2xl border border-white/10 bg-[#121823]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
                    >
                      {SEARCH_ENGINES.map((engine) => (
                        <button
                          key={engine.name}
                          type="button"
                          onClick={() => {
                            setSearchEngine(engine);
                            setShowEngineMenu(false);
                            notify(`${engine.name} selected`);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                        >
                          <span className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 font-black">
                              {engine.short}
                            </span>
                            {engine.name}
                          </span>
                          {searchEngine.name === engine.name && (
                            <Check className="h-3.5 w-3.5 text-cyan-400" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Search className="ml-1 h-4 w-4 shrink-0 text-slate-500" />
              <input
                autoFocus
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search the web or type a URL"
                className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-slate-600"
              />

              <button
                type="submit"
                className="mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-lg transition hover:scale-[1.03] active:scale-95"
              >
                <ArrowRightIcon />
              </button>
            </div>
          </div>
        </motion.form>

        <section className="mx-auto mt-12 max-w-[900px]">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                Speed Dial
              </h2>
              <p className="mt-1 text-[9px] text-slate-600">
                Your favorite destinations
              </p>
            </div>
            <button
              onClick={() => notify("Speed Dial customization is ready")}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-white/5 hover:text-white"
              title="Customize"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
            {SPEED_DIAL.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.045 }}
                whileHover={{
                  y: -7,
                  rotateX: 5,
                  rotateY: index % 2 === 0 ? 3 : -3,
                  scale: 1.035,
                }}
                whileTap={{ scale: 0.96 }}
                onMouseEnter={() => setHoveredDial(item.id)}
                onMouseLeave={() => setHoveredDial(null)}
                onClick={() => navigate(item.url)}
                className="group relative text-center"
                style={{ transformPerspective: 700 }}
              >
                <div className="relative mx-auto flex aspect-square w-full max-w-[88px] items-center justify-center">
                  <div
                    className={`absolute inset-2 rounded-[23px] bg-gradient-to-br ${item.gradient} opacity-20 blur-xl transition duration-500 group-hover:opacity-60`}
                  />
                  <div
                    className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[23px] border border-white/15 bg-gradient-to-br ${item.gradient} shadow-[0_16px_35px_rgba(0,0,0,.32)]`}
                  >
                    <span className="relative z-10 text-lg font-black text-white drop-shadow-lg">
                      {item.logo}
                    </span>
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent" />
                    <motion.div
                      animate={{
                        x: hoveredDial === item.id ? "170%" : "-120%",
                      }}
                      transition={{ duration: 0.7 }}
                      className="absolute inset-y-0 w-1/2 rotate-12 bg-white/25 blur-md"
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <div className="truncate text-[10px] font-bold text-slate-300 transition group-hover:text-white">
                    {item.name}
                  </div>
                  <div className="mt-0.5 truncate text-[8px] text-slate-600">
                    {item.domain}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-12 grid max-w-[900px] grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Developer Hub",
              text: "Jump back into GitHub and your projects.",
              onClick: () => navigate("https://github.com"),
            },
            {
              icon: Bookmark,
              title: "Reading List",
              text: `${bookmarks.length} saved destinations`,
              onClick: () => setShowBookmarks(true),
            },
            {
              icon: History,
              title: "Recently Visited",
              text: `${recentUrls.length} recent pages`,
              onClick: () => setShowHistory(true),
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.title}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.985 }}
                onClick={card.onClick}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 text-left backdrop-blur-xl transition hover:border-white/15 hover:bg-white/[0.06]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-xs font-black text-white">
                  {card.title}
                </div>
                <p className="mt-1 text-[9px] leading-5 text-slate-600">
                  {card.text}
                </p>
              </motion.button>
            );
          })}
        </section>

        <section className="mx-auto mt-12 max-w-[1050px]">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400">
                  Personalized feed
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Today&apos;s stories
              </h2>
            </div>
            <button
              onClick={() => notify("Feed refreshed")}
              className="flex items-center gap-2 rounded-xl px-2 py-1 text-[9px] font-bold text-slate-600 transition hover:bg-white/5 hover:text-white"
            >
              Refresh
              <RotateCw className="h-3 w-3" />
            </button>
          </div>

          <div className="mb-4 flex gap-1 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[8px] font-black tracking-wider transition ${
                  selectedCategory === category
                    ? "bg-white text-slate-950"
                    : "text-slate-600 hover:bg-white/5 hover:text-slate-300"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredNews.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -5 }}
                className="group overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.03]"
              >
                <div className="relative aspect-[1.55] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[7px] font-black tracking-wider text-white backdrop-blur-md">
                    {item.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[8px] font-black uppercase tracking-wider text-cyan-400">
                      {item.source}
                    </span>
                    <span className="text-[8px] text-slate-600">
                      {item.time}
                    </span>
                  </div>
                  <h3 className="line-clamp-3 text-[11px] font-bold leading-5 text-white">
                    {item.title}
                  </h3>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <div className="mx-auto mt-12 max-w-[1050px] pb-10 text-center text-[8px] font-semibold tracking-[0.15em] text-slate-700">
          ABHISHEK BROWSER · PRIVATE · FAST · CINEMATIC
        </div>
      </div>
    </div>
  );

  const renderPortfolio = () => (
    <div className="min-h-full overflow-y-auto bg-[#070b12] p-6 text-white md:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between gap-5">
          <div>
            <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-cyan-400">
              Personal Portfolio
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Abhishek Kuntare
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Frontend-focused full-stack developer building modern,
              interactive and AI-powered web experiences.
            </p>
          </div>
          <div className="hidden h-24 w-24 items-center justify-center rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-500 to-blue-600 text-4xl font-black shadow-2xl md:flex">
            A
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              title: "Abhishek OS",
              description:
                "A cinematic desktop operating system experience built with React and TypeScript.",
              color: "from-cyan-500/20 to-blue-500/5",
            },
            {
              title: "Velosa Studio",
              description:
                "A premium digital product and design studio experience.",
              color: "from-purple-500/20 to-fuchsia-500/5",
            },
            {
              title: "ComfortPro HVAC",
              description:
                "A conversion-focused service business website.",
              color: "from-orange-500/20 to-red-500/5",
            },
            {
              title: "Aura Atelier",
              description:
                "AI-powered fashion studio and marketplace.",
              color: "from-lime-500/20 to-emerald-500/5",
            },
          ].map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -7, scale: 1.01 }}
              className={`rounded-[25px] border border-white/10 bg-gradient-to-br ${project.color} p-6 shadow-2xl`}
            >
              <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-black">{project.title}</h2>
              <p className="mt-2 text-xs leading-6 text-slate-400">
                {project.description}
              </p>
              <button
                onClick={() => notify(`${project.title} selected`)}
                className="mt-5 flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-cyan-400"
              >
                Explore
                <ArrowRightIcon />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExternalPage = () => (
    <div className="relative h-full min-h-full bg-white">
      <AnimatePresence>
        {activeTab.loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-0 z-20 h-0.5 overflow-hidden bg-slate-200"
          >
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
              className="h-full w-1/3 bg-cyan-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <iframe
        key={activeTab.url}
        src={activeTab.url}
        title={activeTab.title}
        className="h-full min-h-[600px] w-full border-0 bg-white"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        onLoad={() => updateTab(activeTab.id, { loading: false })}
      />
    </div>
  );

  const renderHistoryPanel = () => (
    <AnimatePresence>
      {showHistory && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.98 }}
          className="absolute right-3 top-3 z-[160] w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-3xl border border-white/10 bg-[#10151f]/95 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white">
                History
              </div>
              <div className="mt-1 text-[8px] text-slate-600">
                Recently visited pages
              </div>
            </div>
            <button
              onClick={() => setShowHistory(false)}
              className="rounded-xl p-2 text-slate-500 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {recentUrls.length === 0 ? (
              <div className="px-4 py-10 text-center text-[9px] text-slate-600">
                No browsing history yet.
              </div>
            ) : (
              recentUrls.map((url) => (
                <button
                  key={url}
                  onClick={() => {
                    navigate(url);
                    setShowHistory(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left hover:bg-white/[0.06]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-bold text-slate-200">
                      {getHostname(url)}
                    </div>
                    <div className="mt-0.5 truncate text-[8px] text-slate-600">
                      {url}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {recentUrls.length > 0 && (
            <button
              onClick={() => {
                setRecentUrls([]);
                notify("History cleared");
              }}
              className="m-2 w-[calc(100%-16px)] rounded-xl border border-white/[0.07] px-3 py-2 text-[9px] font-bold text-slate-500 hover:bg-white/5 hover:text-white"
            >
              Clear history
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      className={`relative flex h-full w-full select-none flex-col overflow-hidden bg-[#080b11] text-white ${
        fullscreen ? "ring-1 ring-cyan-400/20" : ""
      }`}
    >
      {/* Tab strip */}
      <div className="relative z-50 flex h-[45px] shrink-0 items-end border-b border-white/[0.08] bg-[#11151d]/95 px-2 backdrop-blur-2xl">
        <div className="hidden w-[82px] shrink-0 items-center gap-2 pl-2 md:flex">
          <button
            onClick={() => notify("Close is handled by the host window")}
            className="h-3 w-3 rounded-full bg-[#ff5f57] transition hover:brightness-125"
            title="Close"
          />
          <button
            onClick={() => notify("Minimize is handled by the host window")}
            className="h-3 w-3 rounded-full bg-[#febc2e] transition hover:brightness-125"
            title="Minimize"
          />
          <button
            onClick={() => setFullscreen((value) => !value)}
            className="h-3 w-3 rounded-full bg-[#28c840] transition hover:brightness-125"
            title="Toggle fullscreen"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const active = tab.id === activeTabId;

            return (
              <motion.div
                layout
                key={tab.id}
                onClick={() => {
                  setActiveTabId(tab.id);
                  setAddressInput(tab.url);
                  sound.playClick();
                }}
                className={`group relative flex h-[37px] min-w-[145px] max-w-[245px] cursor-pointer items-center gap-2 rounded-t-[12px] border-x border-t px-3 transition-all ${
                  active
                    ? "border-white/[0.08] bg-[#080b11] text-white shadow-[0_-5px_25px_rgba(0,0,0,.15)]"
                    : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                  />
                )}

                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06]">
                  {tab.loading ? (
                    <RotateCw className="h-3 w-3 animate-spin text-cyan-400" />
                  ) : isInternal(tab.url) ? (
                    <Sparkles className="h-3 w-3 text-cyan-400" />
                  ) : (
                    <Globe className="h-3 w-3 text-slate-500" />
                  )}
                </div>

                <span className="min-w-0 flex-1 truncate text-[10px] font-semibold">
                  {truncate(tab.title, 25)}
                </span>

                {tab.bookmarked && (
                  <Star className="h-2.5 w-2.5 shrink-0 fill-cyan-400 text-cyan-400" />
                )}

                <button
                  onClick={(event) => closeTab(tab.id, event)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition ${
                    active
                      ? "opacity-60 hover:bg-white/10 hover:opacity-100"
                      : "opacity-0 group-hover:opacity-100 hover:bg-white/10"
                  }`}
                  title="Close tab"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            );
          })}

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleNewTab}
            className="mb-1 ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
            title="New Tab"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="hidden items-center gap-1 pl-2 sm:flex">
          <button
            onClick={() => {
              setShowBookmarks((value) => !value);
              setShowHistory(false);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
            title="Bookmarks"
          >
            <Bookmark className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setShowMenu((value) => !value);
              setShowSettings(false);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
            title="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative z-40 flex h-[52px] shrink-0 items-center gap-1.5 border-b border-white/[0.07] bg-[#0d1118]/95 px-3 backdrop-blur-2xl">
        <div className="flex items-center">
          <button
            onClick={goBack}
            disabled={!activeTab || activeTab.historyIndex <= 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
            title="Back (Alt+Left)"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            onClick={goForward}
            disabled={
              !activeTab ||
              activeTab.historyIndex >= activeTab.history.length - 1
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
            title="Forward (Alt+Right)"
          >
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            onClick={reloadPage}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
            title="Reload (Ctrl/Cmd+R)"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${
                activeTab?.loading ? "animate-spin" : ""
              }`}
            />
          </button>

          <button
            onClick={() => navigate(START_PAGE)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white sm:flex"
            title="Home"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleAddressSubmit}
          className="group relative flex min-w-0 flex-1"
        >
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 opacity-0 blur-lg transition group-focus-within:opacity-100" />

          <div className="relative flex h-9 min-w-0 flex-1 items-center rounded-xl border border-white/[0.08] bg-white/[0.045] transition group-focus-within:border-cyan-400/20 group-focus-within:bg-white/[0.06]">
            <div className="flex w-9 shrink-0 items-center justify-center">
              {isInternal(activeTab.url) ? (
                <Globe className="h-3.5 w-3.5 text-slate-500" />
              ) : (
                <Lock className="h-3 w-3 text-emerald-400" />
              )}
            </div>

            <input
              ref={addressInputRef}
              value={addressInput}
              onChange={(event) => setAddressInput(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              className="min-w-0 flex-1 bg-transparent text-[10px] font-medium text-slate-300 outline-none placeholder:text-slate-600"
              placeholder="Search or enter website address"
            />

            <button
              type="button"
              onClick={toggleBookmark}
              className="mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
              title={
                activeTab.bookmarked ? "Remove bookmark" : "Add bookmark"
              }
            >
              {activeTab.bookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5 text-cyan-400" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </form>

        <div className="flex items-center">
          <button
            onClick={() => {
              setShowHistory((value) => !value);
              setShowBookmarks(false);
              setShowSettings(false);
              setShowMenu(false);
            }}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white sm:flex"
            title="History"
          >
            <Clock3 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => {
              setShowSettings((value) => !value);
              setShowBookmarks(false);
              setShowMenu(false);
              setShowHistory(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setFullscreen((value) => !value)}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white md:flex"
            title="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => {
              setShowMenu((value) => !value);
              setShowSettings(false);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/10 hover:text-white"
            title="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Bookmarks */}
        <AnimatePresence>
          {showBookmarks && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute right-20 top-12 z-[150] w-[300px] rounded-2xl border border-white/10 bg-[#121721]/95 p-2 shadow-2xl backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-600">
                  Bookmarks
                </div>
                <button
                  onClick={() => setShowBookmarks(false)}
                  className="rounded-lg p-1 text-slate-600 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {bookmarks.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/[0.06]"
                  >
                    <button
                      onClick={() => openBookmark(item)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${item.gradient} text-[10px] font-black`}
                      >
                        {item.logo}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[10px] font-bold text-white">
                          {item.title}
                        </div>
                        <div className="truncate text-[8px] text-slate-600">
                          {item.domain}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() =>
                        setBookmarks((current) =>
                          current.filter((bookmark) => bookmark.id !== item.id),
                        )
                      }
                      className="rounded-lg p-1.5 text-slate-700 opacity-0 transition group-hover:opacity-100 hover:bg-white/10 hover:text-white"
                      title="Remove bookmark"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute right-10 top-12 z-[150] w-64 rounded-2xl border border-white/10 bg-[#121721]/95 p-2 shadow-2xl backdrop-blur-2xl"
            >
              <div className="px-3 py-2">
                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-slate-600">
                  Browser Settings
                </div>
              </div>

              {[
                {
                  label: "Privacy & Security",
                  icon: ShieldCheck,
                  action: () => notify("Privacy controls opened"),
                },
                {
                  label: "Appearance",
                  icon: Sparkles,
                  action: () => notify("Appearance controls opened"),
                },
                {
                  label: "Search Engine",
                  icon: Search,
                  action: () => setShowEngineMenu(true),
                },
                {
                  label: "Keyboard Shortcuts",
                  icon: Zap,
                  action: () => setShowShortcuts(true),
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      setShowSettings(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    {item.label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main menu */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute right-2 top-12 z-[150] w-60 rounded-2xl border border-white/10 bg-[#121721]/95 p-2 shadow-2xl backdrop-blur-2xl"
            >
              {[
                {
                  label: "New Tab",
                  shortcut: "Ctrl/Cmd+T",
                  action: handleNewTab,
                },
                {
                  label: "Duplicate Tab",
                  shortcut: "Ctrl/Cmd+D",
                  action: duplicateTab,
                },
                {
                  label: "History",
                  shortcut: "Ctrl/Cmd+Y",
                  action: () => setShowHistory(true),
                },
                {
                  label: "Bookmarks",
                  shortcut: "Ctrl/Cmd+Shift+B",
                  action: () => setShowBookmarks(true),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    item.action();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <span>{item.label}</span>
                  <span className="text-[8px] text-slate-600">
                    {item.shortcut}
                  </span>
                </button>
              ))}

              <div className="my-1 h-px bg-white/[0.06]" />

              <button
                onClick={() => {
                  setShowMenu(false);
                  notify("Developer tools are handled by the host app");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[10px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Developer Tools
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <main className="relative flex-1 overflow-hidden">
        {activeTab.url === START_PAGE
          ? renderStartPage()
          : activeTab.url.includes("abhishek-os-seven.vercel.app")
            ? renderPortfolio()
            : activeTab.url.includes("velosa.studio")
              ? renderPortfolio()
              : renderExternalPage()}
      </main>

      {renderHistoryPanel()}

      {/* Shortcuts modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[220] flex items-center justify-center bg-black/55 p-5 backdrop-blur-md"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-white/10 bg-[#10151f] p-5 shadow-2xl"
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-white">
                    Keyboard shortcuts
                  </div>
                  <div className="mt-1 text-[9px] text-slate-600">
                    Faster navigation without leaving the keyboard.
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {[
                  ["Focus address bar", "Ctrl/Cmd + L"],
                  ["New tab", "Ctrl/Cmd + T"],
                  ["Close tab", "Ctrl/Cmd + W"],
                  ["Duplicate tab", "Ctrl/Cmd + D"],
                  ["Reload", "Ctrl/Cmd + R"],
                  ["Back / Forward", "Alt + ← / →"],
                  ["Close popups", "Esc"],
                ].map(([label, shortcut]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-xl bg-white/[0.035] px-3 py-2.5"
                  >
                    <span className="text-[10px] font-semibold text-slate-300">
                      {label}
                    </span>
                    <kbd className="rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1 text-[8px] font-bold text-slate-500">
                      {shortcut}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom status */}
      <div className="flex h-5 shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#0b0f15] px-3 text-[7px] font-semibold text-slate-700">
        <div className="flex items-center gap-3">
          <span>Abhishek Browser</span>
          <span className="hidden sm:inline">
            <ShieldCheck className="mr-1 inline h-2.5 w-2.5 text-emerald-500/70" />
            Secure browsing enabled
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>{getHostname(activeTab.url)}</span>
          <span>100%</span>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="pointer-events-none absolute bottom-9 left-1/2 z-[300] -translate-x-1/2 rounded-full border border-white/10 bg-[#121721]/95 px-4 py-2.5 text-[9px] font-bold text-white shadow-2xl backdrop-blur-2xl"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrowserApp;
