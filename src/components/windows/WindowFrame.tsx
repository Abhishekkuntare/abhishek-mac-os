import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';

import {
  motion,
  AnimatePresence,
} from 'motion/react';

import {
  Minus,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';

import { WindowState } from '../../types/desktop';
import { useOS } from '../../context/OSContext';

interface WindowFrameProps {
  window: WindowState;
  children: React.ReactNode;
}

type SnapPosition =
  | 'left'
  | 'right'
  | 'top'
  | 'maximize'
  | null;

type ResizeDirection =
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw';

interface SavedWindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DragStart {
  mouseX: number;
  mouseY: number;
  winX: number;
  winY: number;
}

interface ResizeStart {
  mouseX: number;
  mouseY: number;
  winX: number;
  winY: number;
  winW: number;
  winH: number;
}

const MENU_BAR_HEIGHT = 32;

const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 220;

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: win,
  children,
}) => {
  const {
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    moveWindow,
    resizeWindow,
    snapWindow,
    settings,
  } = useOS();

  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [isDragging, setIsDragging] =
    useState(false);

  const [resizingDir, setResizingDir] =
    useState<ResizeDirection | null>(null);

  const [showSnapMenu, setShowSnapMenu] =
    useState(false);

  const [snapPreview, setSnapPreview] =
    useState<SnapPosition>(null);

  /*
   * THIS CONTROLS THE ACTUAL WINDOW FULLSCREEN
   */
  const [isFullscreen, setIsFullscreen] =
    useState(false);

  /*
   * Store the previous window dimensions
   * so we can restore them.
   */
  const savedBoundsRef =
    useRef<SavedWindowBounds | null>(null);

  /*
   * ============================================================
   * REFS
   * ============================================================
   */

  const dragStartRef =
    useRef<DragStart>({
      mouseX: 0,
      mouseY: 0,
      winX: 0,
      winY: 0,
    });

  const resizeStartRef =
    useRef<ResizeStart>({
      mouseX: 0,
      mouseY: 0,
      winX: 0,
      winY: 0,
      winW: 0,
      winH: 0,
    });

  /*
   * ============================================================
   * HELPERS
   * ============================================================
   */

  const clamp = useCallback(
    (
      value: number,
      min: number,
      max: number,
    ) => {
      return Math.min(
        Math.max(value, min),
        max,
      );
    },
    [],
  );

  /*
   * ============================================================
   * FULLSCREEN CURRENT WINDOW
   * ============================================================
   *
   * IMPORTANT:
   *
   * This does NOT use browser fullscreen.
   *
   * It makes only the current OS window occupy
   * the desktop area.
   * ============================================================
   */

  const enterFullscreen =
    useCallback(() => {
      if (isFullscreen) {
        return;
      }

      /*
       * Save current window position and size.
       */
      savedBoundsRef.current = {
        x: win.x,
        y: win.y,
        width: win.width,
        height: win.height,
      };

      setIsFullscreen(true);

      setShowSnapMenu(false);
      setSnapPreview(null);

      focusWindow(win.id);
    }, [
      isFullscreen,
      win.x,
      win.y,
      win.width,
      win.height,
      win.id,
      focusWindow,
    ]);

  const exitFullscreen =
    useCallback(() => {
      if (!isFullscreen) {
        return;
      }

      setIsFullscreen(false);

      setShowSnapMenu(false);
      setSnapPreview(null);

      /*
       * Restore the exact dimensions
       * the window had before fullscreen.
       */
      const saved =
        savedBoundsRef.current;

      if (saved) {
        resizeWindow(
          win.id,
          saved.width,
          saved.height,
          saved.x,
          saved.y,
        );
      }

      savedBoundsRef.current = null;

      focusWindow(win.id);
    }, [
      isFullscreen,
      resizeWindow,
      win.id,
      focusWindow,
    ]);

  const toggleFullscreen =
    useCallback(() => {
      if (isFullscreen) {
        exitFullscreen();
      } else {
        enterFullscreen();
      }
    }, [
      isFullscreen,
      enterFullscreen,
      exitFullscreen,
    ]);

  /*
   * ============================================================
   * ESCAPE TO EXIT FULLSCREEN
   * ============================================================
   */

  useEffect(() => {
    const handleKeyDown = (
      e: KeyboardEvent,
    ) => {
      if (
        e.key === 'Escape' &&
        isFullscreen
      ) {
        exitFullscreen();
      }

      if (
        e.key === 'Escape' &&
        showSnapMenu
      ) {
        setShowSnapMenu(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [
    isFullscreen,
    exitFullscreen,
    showSnapMenu,
  ]);

  /*
   * ============================================================
   * DRAG START
   * ============================================================
   */

  const handlePointerDownTitle =
    useCallback(
      (
        e: React.PointerEvent<HTMLDivElement>,
      ) => {
        if (
          e.pointerType === 'mouse' &&
          e.button !== 0
        ) {
          return;
        }

        const target =
          e.target as HTMLElement;

        /*
         * Don't drag when clicking
         * window control buttons.
         */
        if (
          target.closest(
            '.window-control-btn',
          )
        ) {
          return;
        }

        focusWindow(win.id);

        /*
         * Fullscreen windows should not
         * move around.
         */
        if (isFullscreen) {
          return;
        }

        /*
         * Maximized OS windows also shouldn't
         * be dragged here.
         */
        if (win.isMaximized) {
          return;
        }

        e.preventDefault();

        try {
          e.currentTarget.setPointerCapture(
            e.pointerId,
          );
        } catch {
          // Ignore pointer capture failures.
        }

        setIsDragging(true);

        dragStartRef.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          winX: win.x,
          winY: win.y,
        };
      },
      [
        focusWindow,
        win.id,
        win.x,
        win.y,
        win.isMaximized,
        isFullscreen,
      ],
    );

  /*
   * ============================================================
   * DOUBLE CLICK TITLE BAR
   * ============================================================
   */

  const handleDoubleClickTitle =
    useCallback(
      (
        e: React.MouseEvent<HTMLDivElement>,
      ) => {
        const target =
          e.target as HTMLElement;

        if (
          target.closest(
            '.window-control-btn',
          )
        ) {
          return;
        }

        e.preventDefault();

        toggleFullscreen();
      },
      [toggleFullscreen],
    );

  /*
   * ============================================================
   * RESIZE START
   * ============================================================
   */

  const handlePointerDownResize =
    useCallback(
      (
        e: React.PointerEvent<HTMLDivElement>,
        direction: ResizeDirection,
      ) => {
        if (isFullscreen) {
          return;
        }

        if (win.isMaximized) {
          return;
        }

        if (
          e.pointerType === 'mouse' &&
          e.button !== 0
        ) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        focusWindow(win.id);

        try {
          e.currentTarget.setPointerCapture(
            e.pointerId,
          );
        } catch {
          // Ignore pointer capture failures.
        }

        setResizingDir(direction);

        resizeStartRef.current = {
          mouseX: e.clientX,
          mouseY: e.clientY,
          winX: win.x,
          winY: win.y,
          winW: win.width,
          winH: win.height,
        };
      },
      [
        isFullscreen,
        win.isMaximized,
        win.id,
        win.x,
        win.y,
        win.width,
        win.height,
        focusWindow,
      ],
    );

  /*
   * ============================================================
   * POINTER MOVE
   * ============================================================
   */

  useEffect(() => {
    if (
      !isDragging &&
      !resizingDir
    ) {
      return;
    }

    const handlePointerMove =
      (e: PointerEvent) => {
        /*
         * ======================================================
         * DRAGGING
         * ======================================================
         */

        if (isDragging) {
          const dx =
            e.clientX -
            dragStartRef.current.mouseX;

          const dy =
            e.clientY -
            dragStartRef.current.mouseY;

          const screenWidth =
            window.innerWidth;

          const screenHeight =
            window.innerHeight;

          const newX = clamp(
            dragStartRef.current.winX +
              dx,
            -win.width + 40,
            screenWidth - 80,
          );

          const newY = clamp(
            dragStartRef.current.winY +
              dy,
            MENU_BAR_HEIGHT,
            screenHeight - 40,
          );

          moveWindow(
            win.id,
            newX,
            newY,
          );

          /*
           * Snap preview.
           */

          const edgeDistance = 18;

          if (
            e.clientX <= edgeDistance
          ) {
            setSnapPreview('left');
          } else if (
            e.clientX >=
            screenWidth -
              edgeDistance
          ) {
            setSnapPreview('right');
          } else if (
            e.clientY <=
            MENU_BAR_HEIGHT + 6
          ) {
            setSnapPreview('top');
          } else {
            setSnapPreview(null);
          }
        }

        /*
         * ======================================================
         * RESIZING
         * ======================================================
         */

        if (resizingDir) {
          const dx =
            e.clientX -
            resizeStartRef.current.mouseX;

          const dy =
            e.clientY -
            resizeStartRef.current.mouseY;

          const {
            winX,
            winY,
            winW,
            winH,
          } = resizeStartRef.current;

          const screenWidth =
            window.innerWidth;

          const screenHeight =
            window.innerHeight;

          let targetW = winW;
          let targetH = winH;
          let targetX = winX;
          let targetY = winY;

          /*
           * East.
           */
          if (
            resizingDir.includes('e')
          ) {
            targetW =
              winW + dx;
          }

          /*
           * South.
           */
          if (
            resizingDir.includes('s')
          ) {
            targetH =
              winH + dy;
          }

          /*
           * West.
           */
          if (
            resizingDir.includes('w')
          ) {
            targetW =
              winW - dx;

            targetX =
              winX + dx;
          }

          /*
           * North.
           */
          if (
            resizingDir.includes('n')
          ) {
            targetH =
              winH - dy;

            targetY =
              winY + dy;
          }

          /*
           * Minimum width.
           */
          if (
            targetW <
            MIN_WINDOW_WIDTH
          ) {
            if (
              resizingDir.includes(
                'w',
              )
            ) {
              targetX =
                winX +
                winW -
                MIN_WINDOW_WIDTH;
            }

            targetW =
              MIN_WINDOW_WIDTH;
          }

          /*
           * Minimum height.
           */
          if (
            targetH <
            MIN_WINDOW_HEIGHT
          ) {
            if (
              resizingDir.includes(
                'n',
              )
            ) {
              targetY =
                winY +
                winH -
                MIN_WINDOW_HEIGHT;
            }

            targetH =
              MIN_WINDOW_HEIGHT;
          }

          /*
           * Don't resize above menu bar.
           */
          if (
            targetY <
            MENU_BAR_HEIGHT
          ) {
            if (
              resizingDir.includes(
                'n',
              )
            ) {
              targetH -=
                MENU_BAR_HEIGHT -
                targetY;
            }

            targetY =
              MENU_BAR_HEIGHT;
          }

          /*
           * Don't resize past right edge.
           */
          if (
            targetX +
              targetW >
            screenWidth
          ) {
            if (
              resizingDir.includes(
                'e',
              )
            ) {
              targetW =
                screenWidth -
                targetX;
            }
          }

          /*
           * Don't resize past bottom.
           */
          if (
            targetY +
              targetH >
            screenHeight
          ) {
            if (
              resizingDir.includes(
                's',
              )
            ) {
              targetH =
                screenHeight -
                targetY;
            }
          }

          targetW = Math.max(
            MIN_WINDOW_WIDTH,
            targetW,
          );

          targetH = Math.max(
            MIN_WINDOW_HEIGHT,
            targetH,
          );

          resizeWindow(
            win.id,
            targetW,
            targetH,
            targetX,
            targetY,
          );
        }
      };

    const handlePointerUp =
      () => {
        /*
         * Finish drag.
         */

        if (isDragging) {
          setIsDragging(false);

          if (snapPreview) {
            snapWindow(
              win.id,
              snapPreview as any,
            );
          }

          setSnapPreview(null);
        }

        /*
         * Finish resize.
         */

        if (resizingDir) {
          setResizingDir(null);
        }
      };

    window.addEventListener(
      'pointermove',
      handlePointerMove,
    );

    window.addEventListener(
      'pointerup',
      handlePointerUp,
    );

    window.addEventListener(
      'pointercancel',
      handlePointerUp,
    );

    return () => {
      window.removeEventListener(
        'pointermove',
        handlePointerMove,
      );

      window.removeEventListener(
        'pointerup',
        handlePointerUp,
      );

      window.removeEventListener(
        'pointercancel',
        handlePointerUp,
      );
    };
  }, [
    isDragging,
    resizingDir,
    snapPreview,
    win.id,
    win.width,
    win.height,
    moveWindow,
    resizeWindow,
    snapWindow,
    clamp,
  ]);

  /*
   * ============================================================
   * MINIMIZED
   * ============================================================
   */

  if (win.isMinimized) {
    return null;
  }

  const isLight =
    settings.theme === 'light';

  /*
   * ============================================================
   * SNAP PREVIEW
   * ============================================================
   */

  const snapPreviewElement =
    snapPreview &&
    isDragging ? (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.98,
        }}
        transition={{
          duration: 0.15,
        }}
        className={`
          fixed
          pointer-events-none
          z-[999]
          rounded-2xl
          border-2
          border-sky-400
          bg-sky-400/15
          backdrop-blur-md
          shadow-[0_0_50px_rgba(56,189,248,0.12)]

          ${
            snapPreview === 'left'
              ? 'left-2 top-10 bottom-24 w-[calc(50%-12px)]'
              : snapPreview === 'right'
                ? 'right-2 top-10 bottom-24 w-[calc(50%-12px)]'
                : 'left-2 right-2 top-10 bottom-24'
          }
        `}
      />
    ) : null;

  /*
   * ============================================================
   * WINDOW POSITION
   * ============================================================
   *
   * THIS IS THE IMPORTANT PART.
   *
   * When isFullscreen = true:
   *
   * left   = 0
   * top    = menu bar height
   * width  = 100vw
   * height = viewport minus menu bar
   *
   * Only THIS window becomes fullscreen.
   * ============================================================
   */

  const windowStyle: React.CSSProperties =
    isFullscreen
      ? {
          left: 0,
          top: MENU_BAR_HEIGHT,
          width: '100vw',
          height: `calc(100vh - ${MENU_BAR_HEIGHT}px)`,
          zIndex: 9999,
        }
      : {
          left: win.x,
          top: win.y,
          width: win.width,
          height: win.height,
          zIndex: win.zIndex,
        };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
      <AnimatePresence>
        {snapPreviewElement}
      </AnimatePresence>

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.94,
          y: 14,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
        }}
        transition={{
          type: 'spring',
          stiffness: 320,
          damping: 28,
          mass: 0.8,
        }}
        style={{
          ...windowStyle,

          willChange:
            isDragging ||
            resizingDir
              ? 'left, top, width, height'
              : 'auto',
        }}
        onPointerDown={() =>
          focusWindow(win.id)
        }
        className={`
          fixed
          flex
          flex-col
          overflow-hidden
          rounded-2xl
          select-none
          touch-none
          isolate

          ${
            isFullscreen
              ? `
                rounded-none
                shadow-none
                ring-0
              `
              : `
                shadow-2xl
              `
          }

          ${
            win.isFocused ||
            isFullscreen
              ? `
                ring-1
                ring-white/20
                shadow-[0_25px_70px_rgba(0,0,0,0.65)]
              `
              : `
                ring-1
                ring-white/10
                shadow-[0_15px_40px_rgba(0,0,0,0.42)]
                opacity-95
              `
          }

          ${
            isLight
              ? 'glass-panel-light text-slate-800'
              : 'glass-panel text-white'
          }

          ${
            isDragging
              ? 'cursor-grabbing'
              : ''
          }

          ${
            resizingDir
              ? 'transition-none'
              : 'transition-shadow duration-200'
          }
        `}
      >
        {/* =====================================================
            TITLE BAR
        ====================================================== */}

        <div
          onPointerDown={
            handlePointerDownTitle
          }
          onDoubleClick={
            handleDoubleClickTitle
          }
          className={`
            relative
            z-40
            h-10
            shrink-0
            px-3.5
            flex
            items-center
            justify-between
            border-b
            select-none
            touch-none
            transition-colors

            ${
              isLight
                ? `
                  bg-white/40
                  border-slate-200/50
                `
                : `
                  bg-white/5
                  border-white/10
                `
            }

            ${
              isFullscreen
                ? 'cursor-default'
                : isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
            }
          `}
        >
          {/* =================================================
              TRAFFIC LIGHTS
          ================================================== */}

          <div className="flex items-center gap-2 relative shrink-0">
            {/* CLOSE */}

            <button
              type="button"
              aria-label="Close window"
              onClick={e => {
                e.stopPropagation();

                /*
                 * If fullscreen, clear
                 * fullscreen state first.
                 */
                if (isFullscreen) {
                  setIsFullscreen(false);
                  savedBoundsRef.current =
                    null;
                }

                closeWindow(win.id);
              }}
              className="
                window-control-btn
                group
                w-3
                h-3
                rounded-full
                bg-rose-500
                hover:bg-rose-600
                flex
                items-center
                justify-center
                text-rose-950
                transition-all
                duration-150
                active:scale-90
                hover:scale-110
              "
              title="Close"
            >
              <X
                className="
                  w-2
                  h-2
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                "
              />
            </button>

            {/* MINIMIZE */}

            <button
              type="button"
              aria-label="Minimize window"
              onClick={e => {
                e.stopPropagation();

                /*
                 * If minimized from fullscreen,
                 * remember the fullscreen state
                 * should not remain visible.
                 */
                if (isFullscreen) {
                  setIsFullscreen(false);
                  savedBoundsRef.current =
                    null;
                }

                minimizeWindow(win.id);
              }}
              className="
                window-control-btn
                group
                w-3
                h-3
                rounded-full
                bg-amber-500
                hover:bg-amber-600
                flex
                items-center
                justify-center
                text-amber-950
                transition-all
                duration-150
                active:scale-90
                hover:scale-110
              "
              title="Minimize"
            >
              <Minus
                className="
                  w-2
                  h-2
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                "
              />
            </button>

            {/* =================================================
                GREEN FULLSCREEN BUTTON
            ================================================== */}

            <div className="relative">
              <button
                type="button"
                aria-label={
                  isFullscreen
                    ? 'Restore window'
                    : 'Fullscreen window'
                }
                onClick={e => {
                  e.stopPropagation();

                  /*
                   * THIS is the important change.
                   *
                   * Do NOT call:
                   *
                   * maximizeWindow(win.id)
                   *
                   * Instead use our own fullscreen
                   * function.
                   */
                  toggleFullscreen();
                }}
                onMouseEnter={() =>
                  setShowSnapMenu(true)
                }
                className="
                  window-control-btn
                  group
                  w-3
                  h-3
                  rounded-full
                  bg-emerald-500
                  hover:bg-emerald-600
                  flex
                  items-center
                  justify-center
                  text-emerald-950
                  transition-all
                  duration-150
                  active:scale-90
                  hover:scale-110
                "
                title={
                  isFullscreen
                    ? 'Restore window'
                    : 'Fullscreen'
                }
              >
                {isFullscreen ? (
                  <Minimize2
                    className="
                      w-2
                      h-2
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                    "
                  />
                ) : (
                  <Maximize2
                    className="
                      w-2
                      h-2
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                    "
                  />
                )}
              </button>

              {/* =================================================
                  SNAP MENU
              ================================================== */}

              <AnimatePresence>
                {showSnapMenu && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 6,
                      scale: 0.95,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 6,
                      scale: 0.95,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 28,
                    }}
                    onMouseLeave={() =>
                      setShowSnapMenu(false)
                    }
                    className="
                      absolute
                      left-0
                      top-6
                      z-[1000]
                      p-2
                      rounded-xl
                      glass-panel
                      shadow-2xl
                      border
                      border-white/20
                      flex
                      gap-2
                    "
                  >
                    {/* LEFT */}

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();

                        /*
                         * If fullscreen,
                         * restore first.
                         */
                        if (isFullscreen) {
                          exitFullscreen();
                        }

                        snapWindow(
                          win.id,
                          'left',
                        );

                        setShowSnapMenu(
                          false,
                        );
                      }}
                      className="
                        p-1.5
                        rounded-lg
                        hover:bg-white/20
                        text-white
                        flex
                        flex-col
                        items-center
                        gap-1
                        transition-all
                        active:scale-95
                      "
                      title="Tile Left"
                    >
                      <div
                        className="
                          w-7
                          h-5
                          border
                          border-white/50
                          rounded
                          flex
                          overflow-hidden
                        "
                      >
                        <div
                          className="
                            w-1/2
                            h-full
                            bg-sky-400/60
                          "
                        />
                      </div>

                      <span className="text-[9px]">
                        Left
                      </span>
                    </button>

                    {/* RIGHT */}

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();

                        if (isFullscreen) {
                          exitFullscreen();
                        }

                        snapWindow(
                          win.id,
                          'right',
                        );

                        setShowSnapMenu(
                          false,
                        );
                      }}
                      className="
                        p-1.5
                        rounded-lg
                        hover:bg-white/20
                        text-white
                        flex
                        flex-col
                        items-center
                        gap-1
                        transition-all
                        active:scale-95
                      "
                      title="Tile Right"
                    >
                      <div
                        className="
                          w-7
                          h-5
                          border
                          border-white/50
                          rounded
                          flex
                          overflow-hidden
                        "
                      >
                        <div
                          className="
                            w-1/2
                            h-full
                            ml-auto
                            bg-sky-400/60
                          "
                        />
                      </div>

                      <span className="text-[9px]">
                        Right
                      </span>
                    </button>

                    {/* FULLSCREEN */}

                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();

                        /*
                         * This is now the same
                         * fullscreen behavior as
                         * the green button.
                         */
                        toggleFullscreen();

                        setShowSnapMenu(
                          false,
                        );
                      }}
                      className="
                        p-1.5
                        rounded-lg
                        hover:bg-white/20
                        text-white
                        flex
                        flex-col
                        items-center
                        gap-1
                        transition-all
                        active:scale-95
                      "
                      title={
                        isFullscreen
                          ? 'Restore'
                          : 'Fullscreen'
                      }
                    >
                      <div
                        className="
                          w-7
                          h-5
                          border
                          border-white/50
                          rounded
                          relative
                          overflow-hidden
                        "
                      >
                        <div
                          className="
                            absolute
                            inset-0
                            bg-sky-400/60
                          "
                        />
                      </div>

                      <span className="text-[9px]">
                        {isFullscreen
                          ? 'Restore'
                          : 'Full'}
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* =================================================
              WINDOW TITLE
          ================================================== */}

          <div
            className="
              absolute
              left-1/2
              -translate-x-1/2
              max-w-[45%]
              min-w-0
              text-xs
              font-semibold
              tracking-wide
              truncate
              opacity-90
              pointer-events-none
            "
          >
            {win.title}
          </div>

          {/* BALANCER */}

          <div className="w-14 shrink-0" />
        </div>

        {/* =====================================================
            WINDOW CONTENT
        ====================================================== */}

        <div
          className="
            flex-1
            min-h-0
            overflow-hidden
            relative
            flex
            flex-col
          "
        >
          {children}
        </div>

        {/* =====================================================
            RESIZE HANDLES
        ====================================================== */}

        {!win.isMaximized &&
          !isFullscreen && (
            <>
              {/* NORTH */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    'n',
                  )
                }
                className="
                  absolute
                  z-50
                  top-0
                  left-2
                  right-2
                  h-1.5
                  cursor-n-resize
                  touch-none
                "
              />

              {/* SOUTH */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    's',
                  )
                }
                className="
                  absolute
                  z-50
                  bottom-0
                  left-2
                  right-2
                  h-1.5
                  cursor-s-resize
                  touch-none
                "
              />

              {/* WEST */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    'w',
                  )
                }
                className="
                  absolute
                  z-50
                  left-0
                  top-2
                  bottom-2
                  w-1.5
                  cursor-w-resize
                  touch-none
                "
              />

              {/* EAST */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    'e',
                  )
                }
                className="
                  absolute
                  z-50
                  right-0
                  top-2
                  bottom-2
                  w-1.5
                  cursor-e-resize
                  touch-none
                "
              />

              {/* NORTH-WEST */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    'nw',
                  )
                }
                className="
                  absolute
                  z-50
                  top-0
                  left-0
                  w-3
                  h-3
                  cursor-nw-resize
                  touch-none
                "
              />

              {/* NORTH-EAST */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    'ne',
                  )
                }
                className="
                  absolute
                  z-50
                  top-0
                  right-0
                  w-3
                  h-3
                  cursor-ne-resize
                  touch-none
                "
              />

              {/* SOUTH-WEST */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    'sw',
                  )
                }
                className="
                  absolute
                  z-50
                  bottom-0
                  left-0
                  w-3
                  h-3
                  cursor-sw-resize
                  touch-none
                "
              />

              {/* SOUTH-EAST */}

              <div
                onPointerDown={e =>
                  handlePointerDownResize(
                    e,
                    'se',
                  )
                }
                className="
                  absolute
                  z-50
                  bottom-0
                  right-0
                  w-3
                  h-3
                  cursor-se-resize
                  touch-none
                "
              />
            </>
          )}
      </motion.div>
    </>
  );
};