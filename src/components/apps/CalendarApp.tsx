import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Bell,
  BellOff,
  Search,
  X,
  Trash2,
  Edit3,
  Check,
  Users,
  Video,
  Globe2,
  MoreHorizontal,
  Sparkles,
  CalendarDays,
  ListTodo,
  Image as ImageIcon,
  Tag,
  AlertCircle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Navigation,
  Repeat,
  SlidersHorizontal,
  Zap,
  Star,
} from 'lucide-react';

import { sound } from '../../services/soundService';

interface Attendee {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  startTime: string;
  endTime: string;
  day: number;
  month: number;
  year: number;
  color: string;
  location?: string;
  description?: string;
  image?: string;
  category?: string;
  priority?: 'Low' | 'Medium' | 'High';
  notification?: string;
  attendees?: Attendee[];
  isOnline?: boolean;
  completed?: boolean;
  allDay?: boolean;
}

const EVENT_IMAGES = {
  release:
    'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=900&q=85',
  design:
    'https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=900&q=85',
  ai:
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=900&q=85',
  meeting:
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=900&q=85',
  coding:
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85',
  strategy:
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85',
};

const AVATARS = [
  'https://i.pravatar.cc/100?img=12',
  'https://i.pravatar.cc/100?img=32',
  'https://i.pravatar.cc/100?img=47',
  'https://i.pravatar.cc/100?img=51',
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: '1',
    title: 'Abhishek OS 1.0 Release Party',
    time: '10:00 AM - 11:30 AM',
    startTime: '10:00',
    endTime: '11:30',
    day: 19,
    month: 8,
    year: 2026,
    color: '#3b82f6',
    location: 'Studio Pro Space',
    description:
      'Celebrate the first major release of Abhishek OS with the product and design team.',
    image: EVENT_IMAGES.release,
    category: 'Launch',
    priority: 'High',
    notification: '15 minutes before',
    attendees: [
      {
        id: '1',
        name: 'Abhishek',
        initials: 'AK',
        avatar: AVATARS[0],
      },
      {
        id: '2',
        name: 'Rahul',
        initials: 'RS',
        avatar: AVATARS[1],
      },
      {
        id: '3',
        name: 'Priya',
        initials: 'PS',
        avatar: AVATARS[2],
      },
    ],
  },
  {
    id: '2',
    title: 'Velosa Design Critique',
    time: '2:00 PM - 3:00 PM',
    startTime: '14:00',
    endTime: '15:00',
    day: 19,
    month: 8,
    year: 2026,
    color: '#a855f7',
    location: 'Design Lab',
    description:
      'Review the latest Velosa interface concepts, motion system and responsive layouts.',
    image: EVENT_IMAGES.design,
    category: 'Design',
    priority: 'Medium',
    notification: '10 minutes before',
    attendees: [
      {
        id: '4',
        name: 'Neha',
        initials: 'NS',
        avatar: AVATARS[3],
      },
      {
        id: '5',
        name: 'Abhishek',
        initials: 'AK',
        avatar: AVATARS[0],
      },
    ],
  },
  {
    id: '3',
    title: 'Neural Core Performance Benchmark',
    time: '4:30 PM - 5:30 PM',
    startTime: '16:30',
    endTime: '17:30',
    day: 22,
    month: 8,
    year: 2026,
    color: '#10b981',
    description:
      'Run the latest AI benchmark suite and compare model response performance.',
    image: EVENT_IMAGES.ai,
    category: 'AI',
    priority: 'High',
    notification: '30 minutes before',
    isOnline: true,
    attendees: [
      {
        id: '6',
        name: 'AI Team',
        initials: 'AI',
        avatar: AVATARS[1],
      },
    ],
  },
  {
    id: '4',
    title: 'Product Strategy Session',
    time: '11:00 AM - 12:00 PM',
    startTime: '11:00',
    endTime: '12:00',
    day: 23,
    month: 8,
    year: 2026,
    color: '#f97316',
    location: 'Conference Room A',
    description:
      'Roadmap planning, upcoming product milestones and quarterly priorities.',
    image: EVENT_IMAGES.strategy,
    category: 'Strategy',
    priority: 'Medium',
    notification: '15 minutes before',
  },
  {
    id: '5',
    title: 'Frontend Architecture Review',
    time: '3:00 PM - 4:30 PM',
    startTime: '15:00',
    endTime: '16:30',
    day: 24,
    month: 8,
    year: 2026,
    color: '#06b6d4',
    location: 'Engineering Lab',
    description:
      'Review the React architecture, component system and desktop application structure.',
    image: EVENT_IMAGES.coding,
    category: 'Engineering',
    priority: 'High',
    notification: '15 minutes before',
    attendees: [
      {
        id: '7',
        name: 'Abhishek',
        initials: 'AK',
        avatar: AVATARS[0],
      },
      {
        id: '8',
        name: 'Dev Team',
        initials: 'DT',
        avatar: AVATARS[2],
      },
    ],
  },
  {
    id: '6',
    title: 'Client Discovery Call',
    time: '6:00 PM - 6:45 PM',
    startTime: '18:00',
    endTime: '18:45',
    day: 26,
    month: 8,
    year: 2026,
    color: '#ec4899',
    location: 'Google Meet',
    description:
      'Initial discovery session to understand the client product requirements.',
    image: EVENT_IMAGES.meeting,
    category: 'Client',
    priority: 'Medium',
    notification: '10 minutes before',
    isOnline: true,
  },
];

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#a855f7',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#ec4899',
  '#ef4444',
];

const CATEGORY_COLORS: Record<string, string> = {
  Launch: '#3b82f6',
  Design: '#a855f7',
  AI: '#10b981',
  Strategy: '#f97316',
  Engineering: '#06b6d4',
  Client: '#ec4899',
  Personal: '#ef4444',
};

const formatTime = (time: string) => {
  const [hoursString, minutes] = time.split(':');
  let hours = Number(hoursString);

  const period = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
};

const formatEventTime = (start: string, end: string) =>
  `${formatTime(start)} - ${formatTime(end)}`;

export const CalendarApp: React.FC = () => {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(2026, 8, 19),
  );

  const [selectedDay, setSelectedDay] = useState(19);

  const [events, setEvents] = useState<CalendarEvent[]>(
    INITIAL_EVENTS,
  );

  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null);

  const [showEventModal, setShowEventModal] = useState(false);

  const [editingEvent, setEditingEvent] =
    useState<CalendarEvent | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [showSearch, setShowSearch] = useState(false);

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>(
    'month',
  );

  const [notificationEnabled, setNotificationEnabled] =
    useState(true);

  const [showFilters, setShowFilters] = useState(false);

  const [activeCategory, setActiveCategory] =
    useState<string>('All');

  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '2026-09-19',
    startTime: '10:00',
    endTime: '11:00',
    location: '',
    description: '',
    category: 'Personal',
    color: '#3b82f6',
    priority: 'Medium' as CalendarEvent['priority'],
    notification: '15 minutes before',
    image: EVENT_IMAGES.meeting,
    isOnline: false,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(
    year,
    month + 1,
    0,
  ).getDate();

  const startDayOffset = new Date(
    year,
    month,
    1,
  ).getDay();

  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const selectedDayEvents = useMemo(() => {
    return events
      .filter(
        event =>
          event.day === selectedDay &&
          event.month === month &&
          event.year === year,
      )
      .filter(event => {
        const matchesSearch =
          event.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          event.location
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesCategory =
          activeCategory === 'All' ||
          event.category === activeCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
  }, [
    events,
    selectedDay,
    month,
    year,
    searchQuery,
    activeCategory,
  ]);

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter(event => {
        const eventDate = new Date(
          event.year,
          event.month,
          event.day,
          Number(event.startTime.split(':')[0]),
          Number(event.startTime.split(':')[1]),
        );

        const referenceDate = new Date(
          year,
          month,
          selectedDay,
        );

        return eventDate >= referenceDate;
      })
      .sort((a, b) => {
        const first = new Date(
          a.year,
          a.month,
          a.day,
          Number(a.startTime.split(':')[0]),
          Number(a.startTime.split(':')[1]),
        ).getTime();

        const second = new Date(
          b.year,
          b.month,
          b.day,
          Number(b.startTime.split(':')[0]),
          Number(b.startTime.split(':')[1]),
        ).getTime();

        return first - second;
      })
      .slice(0, 5);
  }, [events, year, month, selectedDay]);

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(events.map(event => event.category).filter(Boolean)),
    ) as string[];

    return ['All', ...values];
  }, [events]);

  useEffect(() => {
    if (!notificationEnabled) return;

    const timer = window.setTimeout(() => {
      // Notification-ready hook.
      // Connect your desktop notification service here.
    }, 500);

    return () => window.clearTimeout(timer);
  }, [notificationEnabled]);

  const goToPreviousMonth = () => {
    sound.playClick();

    setCurrentDate(
      previous => new Date(
        previous.getFullYear(),
        previous.getMonth() - 1,
        1,
      ),
    );

    setSelectedDay(1);
  };

  const goToNextMonth = () => {
    sound.playClick();

    setCurrentDate(
      previous => new Date(
        previous.getFullYear(),
        previous.getMonth() + 1,
        1,
      ),
    );

    setSelectedDay(1);
  };

  const goToToday = () => {
    sound.playClick();

    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    );

    setSelectedDay(today.getDate());
  };

  const openCreateEvent = () => {
    sound.playClick();

    setEditingEvent(null);

    setNewEvent({
      title: '',
      date: `${year}-${String(month + 1).padStart(
        2,
        '0',
      )}-${String(selectedDay).padStart(2, '0')}`,
      startTime: '10:00',
      endTime: '11:00',
      location: '',
      description: '',
      category: 'Personal',
      color: '#3b82f6',
      priority: 'Medium',
      notification: '15 minutes before',
      image: EVENT_IMAGES.meeting,
      isOnline: false,
    });

    setShowEventModal(true);
  };

  const openEditEvent = (event: CalendarEvent) => {
    sound.playClick();

    setEditingEvent(event);

    setNewEvent({
      title: event.title,
      date: `${event.year}-${String(event.month + 1).padStart(
        2,
        '0',
      )}-${String(event.day).padStart(2, '0')}`,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || '',
      description: event.description || '',
      category: event.category || 'Personal',
      color: event.color,
      priority: event.priority || 'Medium',
      notification:
        event.notification || '15 minutes before',
      image: event.image || EVENT_IMAGES.meeting,
      isOnline: Boolean(event.isOnline),
    });

    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const saveEvent = () => {
    if (!newEvent.title.trim()) return;

    sound.playClick();

    const [eventYear, eventMonth, eventDay] =
      newEvent.date.split('-').map(Number);

    const eventData: CalendarEvent = {
      id:
        editingEvent?.id ||
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
      title: newEvent.title.trim(),
      time: formatEventTime(
        newEvent.startTime,
        newEvent.endTime,
      ),
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      day: eventDay,
      month: eventMonth - 1,
      year: eventYear,
      color: newEvent.color,
      location: newEvent.location || undefined,
      description: newEvent.description || undefined,
      category: newEvent.category,
      priority: newEvent.priority,
      notification: newEvent.notification,
      image: newEvent.image,
      isOnline: newEvent.isOnline,
      attendees: [],
    };

    if (editingEvent) {
      setEvents(previous =>
        previous.map(event =>
          event.id === editingEvent.id
            ? eventData
            : event,
        ),
      );
    } else {
      setEvents(previous => [...previous, eventData]);
    }

    setCurrentDate(
      new Date(eventYear, eventMonth - 1, 1),
    );

    setSelectedDay(eventDay);

    setShowEventModal(false);
    setEditingEvent(null);
  };

  const deleteEvent = (eventId: string) => {
    sound.playClick();

    setEvents(previous =>
      previous.filter(event => event.id !== eventId),
    );

    setSelectedEvent(null);
  };

  const toggleComplete = (eventId: string) => {
    sound.playClick();

    setEvents(previous =>
      previous.map(event =>
        event.id === eventId
          ? {
              ...event,
              completed: !event.completed,
            }
          : event,
      ),
    );

    setSelectedEvent(previous =>
      previous
        ? {
            ...previous,
            completed: !previous.completed,
          }
        : null,
    );
  };

  return (
    <div className="relative flex-1 flex h-full min-h-0 bg-[#070b13] text-white overflow-hidden select-none">

      {/* Ambient 3D background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-sky-500/10 blur-[120px] animate-pulse" />

        <div
          className="absolute -bottom-48 right-[-100px] w-[620px] h-[620px] rounded-full bg-violet-500/10 blur-[140px] animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />

        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/[0.035] blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="shrink-0 px-4 sm:px-6 pt-5 pb-4 border-b border-white/[0.07] bg-slate-950/50 backdrop-blur-2xl">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="relative">
                <div className="absolute inset-0 bg-sky-500/30 blur-xl rounded-2xl" />

                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/20">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                    Calendar
                  </h1>

                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/20 text-[9px] font-bold text-sky-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    SMART
                  </span>
                </div>

                <p className="text-[10px] text-slate-500">
                  Plan your time. Build your future.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">

              {showSearch && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10">
                  <Search className="w-3.5 h-3.5 text-slate-500" />

                  <input
                    value={searchQuery}
                    onChange={e =>
                      setSearchQuery(e.target.value)
                    }
                    placeholder="Search events..."
                    className="w-44 bg-transparent outline-none text-xs text-white placeholder:text-slate-600"
                    autoFocus
                  />

                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowSearch(previous => !previous)}
                className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.09] transition-all"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={() =>
                  setNotificationEnabled(
                    previous => !previous,
                  )
                }
                className={`p-2.5 rounded-xl border transition-all ${
                  notificationEnabled
                    ? 'bg-sky-500/10 border-sky-400/20 text-sky-300'
                    : 'bg-white/[0.05] border-white/[0.08] text-slate-500'
                }`}
                title="Notifications"
              >
                {notificationEnabled ? (
                  <Bell className="w-4 h-4" />
                ) : (
                  <BellOff className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={openCreateEvent}
                className="group relative overflow-hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-xs font-bold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 hover:-translate-y-0.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">
                  New Event
                </span>

                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-5">

            <div className="flex items-center gap-2">

              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] transition-all"
              >
                <ChevronLeft className="w-4 h-4 text-slate-300" />
              </button>

              <button
                onClick={goToNextMonth}
                className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] transition-all"
              >
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </button>

              <button
                onClick={goToToday}
                className="ml-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/[0.09] transition-all"
              >
                Today
              </button>

              <div className="ml-2 hidden sm:block">
                <h2 className="text-sm font-bold">
                  {MONTH_NAMES[month]} {year}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={() =>
                  setShowFilters(previous => !previous)
                }
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-semibold transition-all ${
                  showFilters
                    ? 'bg-sky-500/10 border-sky-400/20 text-sky-300'
                    : 'bg-white/[0.05] border-white/[0.08] text-slate-400'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>

              <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">

                <button
                  onClick={() => setViewMode('month')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'month'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-500'
                  }`}
                  title="Month view"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setViewMode('agenda')}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === 'agenda'
                      ? 'bg-white/10 text-white'
                      : 'text-slate-500'
                  }`}
                  title="Agenda view"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter row */}
          {showFilters && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 animate-in fade-in slide-in-from-top-2 duration-300">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() =>
                    setActiveCategory(category)
                  }
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all ${
                    activeCategory === category
                      ? 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                      : 'bg-white/[0.03] border-white/[0.07] text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {category !== 'All' && (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background:
                          CATEGORY_COLORS[category] ||
                          '#64748b',
                      }}
                    />
                  )}

                  {category}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Content */}
        {viewMode === 'month' ? (
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

            {/* Calendar */}
            <div className="flex-1 min-w-0 p-3 sm:p-5 overflow-auto">

              {/* Mobile month title */}
              <div className="sm:hidden flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-bold">
                    {MONTH_NAMES[month]} {year}
                  </h2>
                  <p className="text-[9px] text-slate-500">
                    {events.filter(
                      event =>
                        event.month === month &&
                        event.year === year,
                    ).length}{' '}
                    events this month
                  </p>
                </div>

                <CalendarIcon className="w-4 h-4 text-sky-400" />
              </div>

              {/* Week header */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
                {WEEK_DAYS.map(day => (
                  <div
                    key={day}
                    className="text-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-600 py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Month grid */}
              <div
                className="grid grid-cols-7 gap-1.5 sm:gap-2"
                style={{
                  gridAutoRows:
                    'minmax(88px, 1fr)',
                }}
              >
                {Array.from({
                  length: startDayOffset,
                }).map((_, index) => (
                  <div
                    key={`empty-${index}`}
                    className="rounded-2xl bg-white/[0.015] border border-white/[0.025]"
                  />
                ))}

                {Array.from({
                  length: daysInMonth,
                }).map((_, index) => {
                  const dayNum = index + 1;

                  const dayEvents = events.filter(
                    event =>
                      event.day === dayNum &&
                      event.month === month &&
                      event.year === year &&
                      (activeCategory === 'All' ||
                        event.category === activeCategory),
                  );

                  const selected =
                    selectedDay === dayNum;

                  const todayCell =
                    isToday(dayNum);

                  return (
                    <div
                      key={dayNum}
                      onClick={() => {
                        setSelectedDay(dayNum);
                        sound.playClick();
                      }}
                      className={`
                        group relative min-h-[88px] rounded-xl sm:rounded-2xl
                        border p-1.5 sm:p-2 cursor-pointer
                        overflow-hidden transition-all duration-300
                        hover:-translate-y-0.5 hover:shadow-2xl
                        ${
                          selected
                            ? 'bg-sky-500/[0.10] border-sky-400/40 shadow-lg shadow-sky-500/10'
                            : 'bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.055] hover:border-white/[0.12]'
                        }
                      `}
                    >

                      {/* Day header */}
                      <div className="flex items-center justify-between">

                        <span
                          className={`
                            flex items-center justify-center
                            w-6 h-6 rounded-lg text-[10px] font-bold
                            ${
                              todayCell
                                ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                                : selected
                                  ? 'text-sky-300'
                                  : 'text-slate-400'
                            }
                          `}
                        >
                          {dayNum}
                        </span>

                        {dayEvents.length > 0 && (
                          <span className="text-[8px] text-slate-600">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Events */}
                      <div className="mt-1.5 space-y-1 overflow-hidden">

                        {dayEvents
                          .slice(0, 3)
                          .map(event => (
                            <button
                              key={event.id}
                              onClick={e => {
                                e.stopPropagation();
                                sound.playClick();
                                setSelectedEvent(event);
                              }}
                              className="relative w-full text-left rounded-lg overflow-hidden border border-white/10 bg-black/20 hover:bg-black/40 transition-all group/event"
                            >
                              {event.image && (
                                <div className="h-5 sm:h-7 relative overflow-hidden">
                                  <img
                                    src={event.image}
                                    alt=""
                                    className="w-full h-full object-cover opacity-60 group-hover/event:opacity-90 group-hover/event:scale-105 transition-all duration-500"
                                  />

                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                </div>
                              )}

                              <div className="px-1.5 py-1">
                                <div className="flex items-center gap-1">
                                  <span
                                    className="shrink-0 w-1.5 h-1.5 rounded-full"
                                    style={{
                                      background:
                                        event.color,
                                    }}
                                  />

                                  <span className="truncate text-[8px] sm:text-[9px] font-semibold text-slate-200">
                                    {event.title}
                                  </span>
                                </div>

                                <span className="hidden sm:block text-[7px] text-slate-500 mt-0.5">
                                  {event.startTime}
                                </span>
                              </div>
                            </button>
                          ))}

                        {dayEvents.length > 3 && (
                          <div className="text-center text-[8px] text-sky-400 font-semibold">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>

                      {/* Selected glow */}
                      {selected && (
                        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-sky-400/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schedule sidebar */}
            <aside className="w-full lg:w-[350px] xl:w-[390px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.07] bg-slate-900/30 backdrop-blur-xl flex flex-col min-h-[340px] lg:min-h-0">

              {/* Selected date */}
              <div className="p-5 border-b border-white/[0.07]">

                <div className="flex items-start justify-between">

                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-sky-400 font-bold">
                      Selected Day
                    </p>

                    <h3 className="mt-1 text-lg font-bold">
                      {MONTH_NAMES[month]} {selectedDay}
                    </h3>

                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {selectedDayEvents.length}{' '}
                      scheduled event
                      {selectedDayEvents.length !== 1
                        ? 's'
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setNotificationEnabled(
                          previous => !previous,
                        )
                      }
                      className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-slate-400 hover:text-white transition-all"
                    >
                      {notificationEnabled ? (
                        <Bell className="w-3.5 h-3.5" />
                      ) : (
                        <BellOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={openCreateEvent}
                      className="p-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-sky-300 hover:bg-sky-500/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="flex-1 overflow-auto p-4">

                {selectedDayEvents.length === 0 ? (
                  <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center">

                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-sky-500/10 blur-2xl rounded-full" />

                      <div className="relative w-16 h-16 rounded-3xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                        <CalendarDays className="w-7 h-7 text-slate-600" />
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-300">
                      Nothing scheduled
                    </h4>

                    <p className="text-[10px] text-slate-600 max-w-[200px] mt-1">
                      Your schedule is clear for this day.
                    </p>

                    <button
                      onClick={openCreateEvent}
                      className="mt-5 px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-400/20 text-[10px] font-bold text-sky-300 hover:bg-sky-500/20 transition-all"
                    >
                      Create an event
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">

                    {selectedDayEvents.map(
                      (event, index) => (
                        <button
                          key={event.id}
                          onClick={() =>
                            setSelectedEvent(event)
                          }
                          className="group w-full text-left relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] hover:bg-white/[0.065] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-2xl transition-all duration-300"
                          style={{
                            animationDelay: `${index * 80}ms`,
                          }}
                        >

                          {/* Event image */}
                          {event.image && (
                            <div className="relative h-24 overflow-hidden">

                              <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover opacity-65 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-black/20 to-transparent" />

                              <div className="absolute top-3 left-3 flex items-center gap-1.5">

                                {event.category && (
                                  <span className="px-2 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[8px] font-bold text-white">
                                    {event.category}
                                  </span>
                                )}

                                {event.priority ===
                                  'High' && (
                                  <span className="px-2 py-1 rounded-lg bg-red-500/20 backdrop-blur-md border border-red-400/20 text-[8px] font-bold text-red-300">
                                    HIGH
                                  </span>
                                )}
                              </div>

                              <div className="absolute bottom-3 left-3 right-3">
                                <h4 className="text-sm font-bold text-white line-clamp-1">
                                  {event.title}
                                </h4>
                              </div>
                            </div>
                          )}

                          <div className="p-3.5">

                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                              <Clock className="w-3.5 h-3.5 text-sky-400" />

                              <span>
                                {event.time}
                              </span>
                            </div>

                            {event.location && (
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                                {event.isOnline ? (
                                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                                )}

                                <span className="truncate">
                                  {event.location}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3">

                              <div className="flex items-center">

                                {event.attendees
                                  ?.slice(0, 3)
                                  .map(
                                    (
                                      attendee,
                                      attendeeIndex,
                                    ) => (
                                      <div
                                        key={
                                          attendee.id
                                        }
                                        className="w-6 h-6 rounded-full border-2 border-[#111722] overflow-hidden bg-slate-800"
                                        style={{
                                          marginLeft:
                                            attendeeIndex ===
                                            0
                                              ? 0
                                              : -7,
                                        }}
                                      >
                                        {attendee.avatar ? (
                                          <img
                                            src={
                                              attendee.avatar
                                            }
                                            alt={
                                              attendee.name
                                            }
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="w-full h-full flex items-center justify-center text-[7px] font-bold">
                                            {
                                              attendee.initials
                                            }
                                          </span>
                                        )}
                                      </div>
                                    ),
                                  )}

                                {event.attendees &&
                                  event.attendees
                                    .length >
                                    3 && (
                                    <span className="ml-2 text-[8px] text-slate-500">
                                      +
                                      {event.attendees
                                        .length -
                                        3}
                                    </span>
                                  )}
                              </div>

                              <div
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  background:
                                    event.color,
                                  boxShadow: `0 0 12px ${event.color}`,
                                }}
                              />
                            </div>
                          </div>
                        </button>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Upcoming */}
              <div className="p-4 border-t border-white/[0.07]">

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />

                    <span className="text-[10px] font-bold text-slate-300">
                      Upcoming
                    </span>
                  </div>

                  <span className="text-[8px] text-slate-600">
                    Next 5
                  </span>
                </div>

                <div className="space-y-2 max-h-32 overflow-auto">

                  {upcomingEvents.map(event => (
                    <button
                      key={`upcoming-${event.id}`}
                      onClick={() => {
                        setCurrentDate(
                          new Date(
                            event.year,
                            event.month,
                            1,
                          ),
                        );
                        setSelectedDay(event.day);
                        setSelectedEvent(event);
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.04] transition-all text-left"
                    >
                      <div
                        className="w-1 h-7 rounded-full shrink-0"
                        style={{
                          background: event.color,
                        }}
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[9px] font-semibold text-slate-300">
                          {event.title}
                        </p>

                        <p className="text-[8px] text-slate-600 mt-0.5">
                          {MONTH_NAMES[event.month].slice(
                            0,
                            3,
                          )}{' '}
                          {event.day} ·{' '}
                          {event.startTime}
                        </p>
                      </div>

                      {event.notification && (
                        <Bell className="w-3 h-3 text-slate-600" />
                      )}
                    </button>
                  ))}

                </div>
              </div>
            </aside>
          </div>
        ) : (
          /* Agenda View */
          <div className="flex-1 overflow-auto p-5 sm:p-7">

            <div className="max-w-4xl mx-auto">

              <div className="mb-6">
                <p className="text-[9px] uppercase tracking-[0.2em] text-sky-400 font-bold">
                  Timeline
                </p>

                <h2 className="text-2xl font-bold mt-1">
                  Upcoming Schedule
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Everything coming up in your calendar.
                </p>
              </div>

              <div className="space-y-4">

                {upcomingEvents.map(event => (
                  <div
                    key={`agenda-${event.id}`}
                    onClick={() =>
                      setSelectedEvent(event)
                    }
                    className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.035] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all cursor-pointer"
                  >

                    <div className="flex flex-col sm:flex-row">

                      <div className="sm:w-48 h-32 sm:h-auto overflow-hidden">
                        {event.image ? (
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                          />
                        ) : (
                          <div
                            className="w-full h-full min-h-32"
                            style={{
                              background: `linear-gradient(135deg, ${event.color}40, transparent)`,
                            }}
                          />
                        )}
                      </div>

                      <div className="flex-1 p-5">

                        <div className="flex items-start justify-between gap-4">

                          <div>
                            <div className="flex items-center gap-2 mb-2">

                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  background:
                                    event.color,
                                }}
                              />

                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                {MONTH_NAMES[
                                  event.month
                                ]}{' '}
                                {event.day},{' '}
                                {event.year}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-white">
                              {event.title}
                            </h3>

                            <p className="text-xs text-slate-500 mt-1 max-w-xl">
                              {event.description}
                            </p>
                          </div>

                          {event.priority && (
                            <span
                              className={`shrink-0 px-2 py-1 rounded-lg text-[8px] font-bold ${
                                event.priority ===
                                'High'
                                  ? 'bg-red-500/10 text-red-300 border border-red-400/20'
                                  : event.priority ===
                                      'Medium'
                                    ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-400/20'
                                    : 'bg-slate-500/10 text-slate-400 border border-slate-400/20'
                              }`}
                            >
                              {event.priority}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-5">

                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-sky-400" />
                            {event.time}
                          </div>

                          {event.location && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              {event.isOnline ? (
                                <Video className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                              )}
                              {event.location}
                            </div>
                          )}

                          {event.notification && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                              <Bell className="w-3.5 h-3.5" />
                              {event.notification}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedEvent(null)}
        >

          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[90vh] overflow-auto rounded-[28px] border border-white/[0.12] bg-[#0c121d]/95 shadow-2xl shadow-black/60 backdrop-blur-2xl animate-in zoom-in-95 duration-300"
          >

            {/* Hero image */}
            <div className="relative h-52 overflow-hidden">

              {selectedEvent.image ? (
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${selectedEvent.color}, #111827)`,
                  }}
                />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0c121d] via-black/20 to-transparent" />

              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-black/30 backdrop-blur-xl border border-white/10 text-white hover:bg-black/50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-5 left-5 right-5">

                <div className="flex items-center gap-2 mb-2">

                  {selectedEvent.category && (
                    <span className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10 text-[9px] font-bold">
                      {selectedEvent.category}
                    </span>
                  )}

                  {selectedEvent.priority ===
                    'High' && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/20 backdrop-blur-xl border border-red-400/20 text-[9px] font-bold text-red-300">
                      HIGH PRIORITY
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white">
                  {selectedEvent.title}
                </h2>
              </div>
            </div>

            {/* Details */}
            <div className="p-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div className="p-3 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Time
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200">
                    {selectedEvent.time}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    {selectedEvent.isOnline ? (
                      <Video className="w-3.5 h-3.5" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}

                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Location
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {selectedEvent.location ||
                      'No location'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Bell className="w-3.5 h-3.5" />

                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Reminder
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200">
                    {selectedEvent.notification ||
                      'No reminder'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.035] border border-white/[0.07]">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Tag className="w-3.5 h-3.5" />

                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      Category
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-200">
                    {selectedEvent.category ||
                      'General'}
                  </p>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mt-4">
                  <p className="text-[9px] uppercase tracking-wider font-bold text-slate-600 mb-2">
                    Description
                  </p>

                  <p className="text-xs leading-6 text-slate-400">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {selectedEvent.attendees &&
                selectedEvent.attendees.length > 0 && (
                  <div className="mt-5">

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-slate-500" />

                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600">
                          Attendees
                        </span>
                      </div>

                      <span className="text-[9px] text-slate-600">
                        {
                          selectedEvent.attendees
                            .length
                        }{' '}
                        people
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">

                      {selectedEvent.attendees.map(
                        attendee => (
                          <div
                            key={attendee.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.07]"
                          >
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800">
                              {attendee.avatar ? (
                                <img
                                  src={
                                    attendee.avatar
                                  }
                                  alt={
                                    attendee.name
                                  }
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="w-full h-full flex items-center justify-center text-[7px] font-bold">
                                  {
                                    attendee.initials
                                  }
                                </span>
                              )}
                            </div>

                            <span className="text-[9px] font-semibold text-slate-300">
                              {attendee.name}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/[0.07]">

                <button
                  onClick={() =>
                    toggleComplete(selectedEvent.id)
                  }
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${
                    selectedEvent.completed
                      ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300'
                      : 'bg-white/[0.04] border-white/[0.08] text-slate-300 hover:bg-white/[0.08]'
                  }`}
                >
                  {selectedEvent.completed ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Circle className="w-3.5 h-3.5" />
                  )}

                  {selectedEvent.completed
                    ? 'Completed'
                    : 'Mark Complete'}
                </button>

                <button
                  onClick={() =>
                    openEditEvent(selectedEvent)
                  }
                  className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500/10 border border-sky-400/20 text-[10px] font-bold text-sky-300 hover:bg-sky-500/20 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={() =>
                    deleteEvent(selectedEvent.id)
                  }
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-400/20 text-[10px] font-bold text-red-300 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Event modal */}
      {showEventModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-in fade-in duration-200"
          onClick={() => setShowEventModal(false)}
        >

          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[92vh] overflow-auto rounded-[28px] border border-white/[0.12] bg-[#0b111b]/95 shadow-2xl shadow-black/70 backdrop-blur-2xl animate-in zoom-in-95 duration-300"
          >

            {/* Modal header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/[0.07] bg-[#0b111b]/90 backdrop-blur-xl">

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-400/20 flex items-center justify-center">
                    {editingEvent ? (
                      <Edit3 className="w-4 h-4 text-sky-300" />
                    ) : (
                      <Plus className="w-4 h-4 text-sky-300" />
                    )}
                  </div>

                  <h2 className="text-base font-bold">
                    {editingEvent
                      ? 'Edit Event'
                      : 'Create New Event'}
                  </h2>
                </div>

                <p className="text-[9px] text-slate-600 mt-1 ml-10">
                  Build your schedule with smart event details.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowEventModal(false)
                }
                className="p-2 rounded-xl bg-white/[0.05] text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Title */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Event title
                </label>

                <input
                  value={newEvent.title}
                  onChange={e =>
                    setNewEvent(previous => ({
                      ...previous,
                      title: e.target.value,
                    }))
                  }
                  placeholder="What are you planning?"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-sm text-white placeholder:text-slate-600 focus:border-sky-400/40 focus:bg-white/[0.06] transition-all"
                />
              </div>

              {/* Date and times */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Date
                  </label>

                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={e =>
                      setNewEvent(previous => ({
                        ...previous,
                        date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white focus:border-sky-400/40"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Start
                  </label>

                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={e =>
                      setNewEvent(previous => ({
                        ...previous,
                        startTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white focus:border-sky-400/40"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    End
                  </label>

                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={e =>
                      setNewEvent(previous => ({
                        ...previous,
                        endTime: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white focus:border-sky-400/40"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Location
                </label>

                <div className="relative">
                  {newEvent.isOnline ? (
                    <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                  ) : (
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                  )}

                  <input
                    value={newEvent.location}
                    onChange={e =>
                      setNewEvent(previous => ({
                        ...previous,
                        location: e.target.value,
                      }))
                    }
                    placeholder={
                      newEvent.isOnline
                        ? 'Meeting link or platform'
                        : 'Add a location'
                    }
                    className="w-full pl-10 pr-14 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white placeholder:text-slate-600 focus:border-sky-400/40"
                  />

                  <button
                    onClick={() =>
                      setNewEvent(previous => ({
                        ...previous,
                        isOnline: !previous.isOnline,
                      }))
                    }
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                      newEvent.isOnline
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-white/[0.05] text-slate-500'
                    }`}
                    title="Toggle online meeting"
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Description
                </label>

                <textarea
                  value={newEvent.description}
                  onChange={e =>
                    setNewEvent(previous => ({
                      ...previous,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Add notes, agenda or additional details..."
                  className="w-full resize-none px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white placeholder:text-slate-600 focus:border-sky-400/40"
                />
              </div>

              {/* Category / priority / reminder */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Category
                  </label>

                  <select
                    value={newEvent.category}
                    onChange={e =>
                      setNewEvent(previous => ({
                        ...previous,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white"
                  >
                    <option value="Personal">
                      Personal
                    </option>
                    <option value="Work">Work</option>
                    <option value="Launch">
                      Launch
                    </option>
                    <option value="Design">
                      Design
                    </option>
                    <option value="AI">AI</option>
                    <option value="Engineering">
                      Engineering
                    </option>
                    <option value="Client">
                      Client
                    </option>
                    <option value="Strategy">
                      Strategy
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Priority
                  </label>

                  <select
                    value={newEvent.priority}
                    onChange={e =>
                      setNewEvent(previous => ({
                        ...previous,
                        priority:
                          e.target
                            .value as CalendarEvent['priority'],
                      }))
                    }
                    className="w-full px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">
                      Medium
                    </option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Reminder
                  </label>

                  <select
                    value={newEvent.notification}
                    onChange={e =>
                      setNewEvent(previous => ({
                        ...previous,
                        notification: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08] outline-none text-xs text-white"
                  >
                    <option>
                      At time of event
                    </option>
                    <option>
                      5 minutes before
                    </option>
                    <option>
                      10 minutes before
                    </option>
                    <option>
                      15 minutes before
                    </option>
                    <option>
                      30 minutes before
                    </option>
                    <option>
                      1 hour before
                    </option>
                    <option>
                      1 day before
                    </option>
                  </select>
                </div>
              </div>

              {/* Color */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Event color
                  </label>

                  <span
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: newEvent.color,
                      boxShadow: `0 0 12px ${newEvent.color}`,
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-2">

                  {COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() =>
                        setNewEvent(previous => ({
                          ...previous,
                          color,
                        }))
                      }
                      className={`w-8 h-8 rounded-xl border transition-all ${
                        newEvent.color === color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-white/10 hover:scale-105'
                      }`}
                      style={{
                        background: color,
                        boxShadow:
                          newEvent.color === color
                            ? `0 0 18px ${color}80`
                            : undefined,
                      }}
                    >
                      {newEvent.color === color && (
                        <Check className="w-3.5 h-3.5 mx-auto text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />

                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Event cover
                  </label>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">

                  {Object.entries(EVENT_IMAGES).map(
                    ([name, image]) => (
                      <button
                        key={name}
                        onClick={() =>
                          setNewEvent(previous => ({
                            ...previous,
                            image,
                          }))
                        }
                        className={`relative h-14 rounded-xl overflow-hidden border transition-all ${
                          newEvent.image === image
                            ? 'border-sky-400 ring-2 ring-sky-400/20'
                            : 'border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={image}
                          alt={name}
                          className="w-full h-full object-cover"
                        />

                        {newEvent.image === image && (
                          <div className="absolute inset-0 bg-sky-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-end gap-2 p-5 border-t border-white/[0.07] bg-[#0b111b]/95 backdrop-blur-xl">

              <button
                onClick={() =>
                  setShowEventModal(false)
                }
                className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[10px] font-bold text-slate-400 hover:text-white transition-all"
              >
                Cancel
              </button>

              <button
                onClick={saveEvent}
                disabled={!newEvent.title.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-[10px] font-bold text-white shadow-lg shadow-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-sky-500/40 transition-all"
              >
                {editingEvent
                  ? 'Save Changes'
                  : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};