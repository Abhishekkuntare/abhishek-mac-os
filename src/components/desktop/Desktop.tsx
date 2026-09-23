// // import React, { useState, useEffect, useRef, useMemo } from 'react';
// // import { motion, AnimatePresence } from 'motion/react';
// // import {
// //   Folder,
// //   FileText,
// //   Terminal,
// //   Code2,
// //   Trash2,
// //   Image,
// //   RefreshCw,
// //   Monitor,
// //   Tv,
// //   Maximize2,
// //   Minimize2,
// //   HardDrive,
// //   UploadCloud,
// //   Laptop,
// //   Plus,
// //   Grid,
// //   Copy,
// //   ClipboardPaste,
// //   Scissors,
// //   Files,
// //   X,
// //   FileSpreadsheet,
// //   FileCode,
// //   Sparkles,
// //   Smartphone,
// //   Info,
// //   Pin,
// //   PinOff,
// //   ExternalLink,
// // } from 'lucide-react';
// // import { useOS } from '../../context/OSContext';
// // import { LiveWallpaper } from './LiveWallpaper';
// // import { DesktopWidgets } from './DesktopWidgets';
// // import { vfs } from '../../services/virtualFileSystem';
// // import { sound } from '../../services/soundService';
// // import { VirtualFile } from '../../types/desktop';
// // import { AppFeaturesModal } from '../system/AppFeaturesModal';

// // interface ContextMenuState {
// //   x: number;
// //   y: number;
// //   visible: boolean;
// //   targetId?: string | null;
// // }

// // interface Position {
// //   x: number;
// //   y: number;
// // }

// // type DesktopItem =
// //   | {
// //       id: string;
// //       name: string;
// //       isSystem: true;
// //       type: string;
// //       appId: string;
// //       icon: React.ComponentType<{ className?: string }>;
// //       gradient: string;
// //     }
// //   | {
// //       id: string;
// //       name: string;
// //       isSystem: false;
// //       type: string;
// //       file: VirtualFile;
// //     };

// // const DESKTOP_POS_KEY = 'abhishek_os_desktop_icon_positions_v2';

// // export const Desktop: React.FC = () => {
// //   const {
// //     currentWallpaper,
// //     settings,
// //     openApp,
// //     setQuickLookFile,
// //     isFullscreen,
// //     toggleFullscreen,
// //     importLocalFiles,
// //     connectLocalDirectory,
// //     addNotification,
// //     toggleDockPin,
// //     dockAppIds,
// //   } = useOS();

// //   const fileInputRef = useRef<HTMLInputElement | null>(null);
// //   const desktopContainerRef = useRef<HTMLDivElement | null>(null);

// //   const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false });
// //   const [selectedIconIds, setSelectedIconIds] = useState<string[]>([]);
// //   const [isDragOver, setIsDragOver] = useState(false);
// //   const [featuresModalAppId, setFeaturesModalAppId] = useState<string | null>(null);

// //   // Modals
// //   const [showNewFileModal, setShowNewFileModal] = useState(false);
// //   const [newFileName, setNewFileName] = useState('');
// //   const [newFileType, setNewFileType] = useState<'document' | 'code'>('document');
// //   const [newFileExtension, setNewFileExtension] = useState('txt');

// //   // Desktop files
// //   const [desktopFiles, setDesktopFiles] = useState(() => vfs.getFiles('/Users/abhishek/Desktop'));

// //   // Saved movable icon positions
// //   const [customPositions, setCustomPositions] = useState<Record<string, Position>>(() => {
// //     try {
// //       const stored = localStorage.getItem(DESKTOP_POS_KEY);
// //       return stored ? JSON.parse(stored) : {};
// //     } catch {
// //       return {};
// //     }
// //   });

// //   // Drag state tracker
// //   const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
// //   const dragTrackerRef = useRef<{
// //     itemId: string;
// //     startX: number;
// //     startY: number;
// //     startPos: Position;
// //     hasMoved: boolean;
// //   } | null>(null);

// //   const savePositions = (newPositions: Record<string, Position>) => {
// //     setCustomPositions(newPositions);
// //     try {
// //       localStorage.setItem(DESKTOP_POS_KEY, JSON.stringify(newPositions));
// //     } catch {
// //       // ignore
// //     }
// //   };

// //   const refreshFiles = () => {
// //     setDesktopFiles(vfs.getFiles('/Users/abhishek/Desktop'));
// //   };

// //   // Keep all icons within screen bounds on window resize
// //   useEffect(() => {
// //     const handleResize = () => {
// //       const maxX = Math.max(16, window.innerWidth - 108);
// //       const maxY = Math.max(40, window.innerHeight - 128);

// //       setCustomPositions(prev => {
// //         let changed = false;
// //         const next = { ...prev };
// //         Object.entries(next).forEach(([id, pos]) => {
// //           const clampedX = Math.max(16, Math.min(maxX, pos.x));
// //           const clampedY = Math.max(40, Math.min(maxY, pos.y));
// //           if (clampedX !== pos.x || clampedY !== pos.y) {
// //             next[id] = { x: clampedX, y: clampedY };
// //             changed = true;
// //           }
// //         });
// //         if (changed) {
// //           savePositions(next);
// //         }
// //         return next;
// //       });
// //     };

// //     window.addEventListener('resize', handleResize);
// //     return () => window.removeEventListener('resize', handleResize);
// //   }, []);

// //   // Fixed desktop shortcuts
// //   const systemShortcuts = useMemo(
// //     () => [
// //       {
// //         id: 'icon-finder',
// //         label: 'Documents',
// //         type: 'app',
// //         appId: 'finder',
// //         icon: Folder,
// //         gradient: 'from-sky-500 to-cyan-300',
// //       },
// //       {
// //         id: 'icon-mobile',
// //         label: 'iPhone Mirroring',
// //         type: 'app',
// //         appId: 'mobile',
// //         icon: Smartphone,
// //         gradient: 'from-indigo-600 via-purple-600 to-pink-500',
// //       },
// //       {
// //         id: 'icon-local-pc',
// //         label: 'My PC Drive',
// //         type: 'app',
// //         appId: 'finder',
// //         icon: HardDrive,
// //         gradient: 'from-emerald-600 to-teal-400',
// //       },
// //       {
// //         id: 'icon-tv',
// //         label: 'Abhishek TV',
// //         type: 'app',
// //         appId: 'tv',
// //         icon: Tv,
// //         gradient: 'from-purple-600 to-pink-400',
// //       },
// //       {
// //         id: 'icon-code',
// //         label: 'Code Studio',
// //         type: 'app',
// //         appId: 'codestudio',
// //         icon: Code2,
// //         gradient: 'from-indigo-700 to-sky-400',
// //       },
// //       {
// //         id: 'icon-terminal',
// //         label: 'Terminal',
// //         type: 'app',
// //         appId: 'terminal',
// //         icon: Terminal,
// //         gradient: 'from-slate-900 to-slate-800',
// //       },
// //     ],
// //     []
// //   );

// //   // Combined list of all desktop icons
// //   const allDesktopItems: DesktopItem[] = useMemo(() => {
// //     return [
// //       ...systemShortcuts.map(s => ({
// //         id: s.id,
// //         name: s.label,
// //         isSystem: true as const,
// //         type: s.type,
// //         appId: s.appId,
// //         icon: s.icon,
// //         gradient: s.gradient,
// //       })),
// //       ...desktopFiles.map(f => ({
// //         id: f.id,
// //         name: f.name,
// //         isSystem: false as const,
// //         type: f.type,
// //         file: f,
// //       })),
// //     ];
// //   }, [systemShortcuts, desktopFiles]);

// //   // Compute coordinate for an item (saved or default non-overlapping grid)
// //   const getItemPosition = (itemId: string, index: number): Position => {
// //     if (customPositions[itemId]) {
// //       const maxX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 108) : 1200;
// //       const maxY = typeof window !== 'undefined' ? Math.max(40, window.innerHeight - 128) : 800;
// //       return {
// //         x: Math.max(16, Math.min(maxX, customPositions[itemId].x)),
// //         y: Math.max(40, Math.min(maxY, customPositions[itemId].y)),
// //       };
// //     }
// //     const containerH = typeof window !== 'undefined' ? window.innerHeight : 900;
// //     const startX = 24;
// //     const startY = 48;
// //     const slotH = 104;
// //     const slotW = 104;
// //     const availableHeight = Math.max(slotH, containerH - startY - 110);
// //     const rowsPerCol = Math.max(1, Math.floor(availableHeight / slotH));
// //     const col = Math.floor(index / rowsPerCol);
// //     const row = index % rowsPerCol;
// //     return {
// //       x: startX + col * slotW,
// //       y: startY + row * slotH,
// //     };
// //   };

// //   // Pointer-based rock-solid drag handlers with strict screen bounds
// //   const handlePointerDown = (e: React.PointerEvent, item: DesktopItem, idx: number) => {
// //     if (e.button !== 0) return; // only left click initiates dragging
// //     const current = getItemPosition(item.id, idx);
// //     dragTrackerRef.current = {
// //       itemId: item.id,
// //       startX: e.clientX,
// //       startY: e.clientY,
// //       startPos: { ...current },
// //       hasMoved: false,
// //     };
// //     (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
// //   };

// //   const handlePointerMove = (e: React.PointerEvent) => {
// //     if (!dragTrackerRef.current) return;
// //     const tracker = dragTrackerRef.current;
// //     const dx = e.clientX - tracker.startX;
// //     const dy = e.clientY - tracker.startY;

// //     if (!tracker.hasMoved && Math.hypot(dx, dy) > 4) {
// //       tracker.hasMoved = true;
// //       setDraggingItemId(tracker.itemId);
// //     }

// //     if (tracker.hasMoved) {
// //       const maxX = Math.max(16, window.innerWidth - 108);
// //       const maxY = Math.max(40, window.innerHeight - 128);
// //       const clampedX = Math.max(16, Math.min(maxX, tracker.startPos.x + dx));
// //       const clampedY = Math.max(40, Math.min(maxY, tracker.startPos.y + dy));

// //       setCustomPositions(prev => ({
// //         ...prev,
// //         [tracker.itemId]: { x: Math.round(clampedX), y: Math.round(clampedY) },
// //       }));
// //     }
// //   };

// //   const handlePointerUp = (e: React.PointerEvent) => {
// //     if (!dragTrackerRef.current) return;
// //     const tracker = dragTrackerRef.current;
// //     try {
// //       (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
// //     } catch {}

// //     if (tracker.hasMoved) {
// //       setCustomPositions(prev => {
// //         savePositions(prev);
// //         return prev;
// //       });
// //     }
// //     setDraggingItemId(null);
// //     dragTrackerRef.current = null;
// //   };

// //   // Robust Auto-Arrange: snaps all icons to a strict non-overlapping grid within screen boundaries
// //   const handleAutoArrange = () => {
// //     const containerW = typeof window !== 'undefined' ? window.innerWidth : 1440;
// //     const containerH = typeof window !== 'undefined' ? window.innerHeight : 900;

// //     const startX = 24;
// //     const startY = 48;
// //     const slotW = 104;
// //     const slotH = 104;

// //     const availableHeight = Math.max(slotH, containerH - startY - 110);
// //     const rowsPerCol = Math.max(1, Math.floor(availableHeight / slotH));

// //     const newPositions: Record<string, Position> = {};
// //     allDesktopItems.forEach((item, index) => {
// //       const col = Math.floor(index / rowsPerCol);
// //       const row = index % rowsPerCol;
// //       const x = startX + col * slotW;
// //       const y = startY + row * slotH;

// //       const maxX = Math.max(startX, containerW - 108);
// //       const maxY = Math.max(startY, containerH - 128);

// //       newPositions[item.id] = {
// //         x: Math.min(maxX, x),
// //         y: Math.min(maxY, y),
// //       };
// //     });

// //     savePositions(newPositions);
// //     sound.playClick();
// //     addNotification({
// //       appId: 'finder',
// //       title: 'Desktop Auto Arrange',
// //       message: `All ${allDesktopItems.length} desktop icons arranged in a clean, collision-free grid.`,
// //       type: 'system',
// //     });
// //   };

// //   const handleContextMenu = (e: React.MouseEvent, targetId: string | null = null) => {
// //     e.preventDefault();
// //     sound.playClick();
// //     const x = Math.min(e.clientX, window.innerWidth - 240);
// //     const y = Math.min(e.clientY, window.innerHeight - 340);
// //     if (targetId && !selectedIconIds.includes(targetId)) {
// //       setSelectedIconIds([targetId]);
// //     }
// //     setContextMenu({ x, y, visible: true, targetId });
// //   };

// //   const handleDesktopClick = () => {
// //     if (contextMenu.visible) {
// //       setContextMenu(prev => ({ ...prev, visible: false }));
// //     }
// //     setSelectedIconIds([]);
// //   };

// //   const handleCreateFolder = () => {
// //     const created = vfs.createFolder('New Folder', '/Users/abhishek/Desktop');
// //     refreshFiles();
// //     setSelectedIconIds([created.id]);
// //     setContextMenu(prev => ({ ...prev, visible: false }));
// //     sound.playClick();
// //   };

// //   const handleCreateNewFile = () => {
// //     const rawName = newFileName.trim() || 'Untitled';
// //     const finalName = rawName.includes('.') ? rawName : `${rawName}.${newFileExtension}`;
// //     const ext = finalName.split('.').pop() || newFileExtension;
// //     const created = vfs.createFile(finalName, '/Users/abhishek/Desktop', newFileType, '', ext);
// //     refreshFiles();
// //     setSelectedIconIds([created.id]);
// //     setShowNewFileModal(false);
// //     setNewFileName('');
// //     sound.playClick();
// //     addNotification({
// //       appId: 'finder',
// //       title: 'Desktop',
// //       message: `Created "${finalName}" on Desktop`,
// //       type: 'system',
// //     });
// //   };

// //   // Desktop Drag & Drop from PC files
// //   const handleDragOver = (e: React.DragEvent) => {
// //     e.preventDefault();
// //     e.stopPropagation();
// //     setIsDragOver(true);
// //   };

// //   const handleDragLeave = (e: React.DragEvent) => {
// //     e.preventDefault();
// //     e.stopPropagation();
// //     setIsDragOver(false);
// //   };

// //   const handleDrop = async (e: React.DragEvent) => {
// //     e.preventDefault();
// //     e.stopPropagation();
// //     setIsDragOver(false);
// //     if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
// //       await importLocalFiles(e.dataTransfer.files, '/Users/abhishek/Desktop');
// //       refreshFiles();
// //     }
// //   };

// //   const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
// //     if (e.target.files && e.target.files.length > 0) {
// //       await importLocalFiles(e.target.files, '/Users/abhishek/Desktop');
// //       refreshFiles();
// //     }
// //   };

// //   const handleOpenItem = (itemId: string, type: string, file?: VirtualFile) => {
// //     sound.playClick();
// //     if (itemId === 'icon-finder' || type === 'folder') {
// //       openApp('finder');
// //     } else if (itemId === 'icon-mobile') {
// //       openApp('mobile');
// //     } else if (itemId === 'icon-local-pc') {
// //       openApp('finder');
// //     } else if (itemId === 'icon-tv') {
// //       openApp('tv');
// //     } else if (itemId === 'icon-code') {
// //       openApp('codestudio');
// //     } else if (itemId === 'icon-terminal') {
// //       openApp('terminal');
// //     } else if (file) {
// //       if (file.extension === 'txt' || file.type === 'code' || file.type === 'document') {
// //         openApp('codestudio');
// //       } else if (file.type === 'audio') {
// //         openApp('music');
// //       } else if (file.type === 'video') {
// //         openApp('tv');
// //       } else {
// //         setQuickLookFile(file);
// //       }
// //     }
// //   };

// //   // Global & Desktop Keyboard Shortcuts
// //   useEffect(() => {
// //     const handleKeyDown = (e: KeyboardEvent) => {
// //       if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
// //         return;
// //       }

// //       const isMod = e.ctrlKey || e.metaKey;

// //       // Select All: Cmd/Ctrl + A
// //       if (isMod && e.code === 'KeyA') {
// //         e.preventDefault();
// //         setSelectedIconIds(allDesktopItems.map(item => item.id));
// //         sound.playClick();
// //         return;
// //       }

// //       // Copy: Cmd/Ctrl + C
// //       if (isMod && e.code === 'KeyC') {
// //         const fileIdsToCopy = selectedIconIds.filter(id => !id.startsWith('icon-'));
// //         if (fileIdsToCopy.length > 0) {
// //           e.preventDefault();
// //           vfs.copyFiles(fileIdsToCopy);
// //           sound.playClick();
// //           addNotification({
// //             appId: 'finder',
// //             title: 'Desktop',
// //             message: `Copied ${fileIdsToCopy.length} item(s) to clipboard`,
// //             type: 'system',
// //           });
// //         }
// //         return;
// //       }

// //       // Paste: Cmd/Ctrl + V
// //       if (isMod && e.code === 'KeyV') {
// //         e.preventDefault();
// //         const pasted = vfs.paste('/Users/abhishek/Desktop');
// //         if (pasted.length > 0) {
// //           sound.playClick();
// //           refreshFiles();
// //           setSelectedIconIds(pasted.map(f => f.id));
// //           addNotification({
// //             appId: 'finder',
// //             title: 'Desktop',
// //             message: `Pasted ${pasted.length} item(s) onto Desktop`,
// //             type: 'system',
// //           });
// //         }
// //         return;
// //       }

// //       // Delete: Delete / Backspace / Cmd+Backspace
// //       if (e.code === 'Delete' || (isMod && e.code === 'Backspace')) {
// //         const fileIdsToDelete = selectedIconIds.filter(id => !id.startsWith('icon-'));
// //         if (fileIdsToDelete.length > 0) {
// //           e.preventDefault();
// //           fileIdsToDelete.forEach(id => vfs.moveToTrash(id));
// //           sound.playTrash();
// //           refreshFiles();
// //           setSelectedIconIds([]);
// //         }
// //         return;
// //       }

// //       // Quick Look: Space
// //       if (e.code === 'Space') {
// //         const firstFileId = selectedIconIds.find(id => !id.startsWith('icon-'));
// //         if (firstFileId) {
// //           const file = vfs.getFileById(firstFileId);
// //           if (file) {
// //             e.preventDefault();
// //             setQuickLookFile(file);
// //           }
// //         }
// //         return;
// //       }

// //       // New Folder: Cmd/Ctrl + Shift + N
// //       if (isMod && e.shiftKey && e.code === 'KeyN') {
// //         e.preventDefault();
// //         handleCreateFolder();
// //         return;
// //       }

// //       // New File: Cmd/Ctrl + N
// //       if (isMod && !e.shiftKey && e.code === 'KeyN') {
// //         e.preventDefault();
// //         setNewFileName('');
// //         setShowNewFileModal(true);
// //         return;
// //       }
// //     };

// //     window.addEventListener('keydown', handleKeyDown);
// //     return () => window.removeEventListener('keydown', handleKeyDown);
// //   }, [allDesktopItems, selectedIconIds, addNotification, setQuickLookFile]);

// //   const hasClipboard = !!vfs.getClipboard() && vfs.getClipboard()!.ids.length > 0;

// //   return (
// //     <div
// //       ref={desktopContainerRef}
// //       className="relative w-full h-full overflow-hidden select-none"
// //       onContextMenu={e => handleContextMenu(e, null)}
// //       onClick={handleDesktopClick}
// //       onDragOver={handleDragOver}
// //       onDragLeave={handleDragLeave}
// //       onDrop={handleDrop}
// //     >
// //       {/* Hidden local file picker */}
// //       <input
// //         ref={fileInputRef}
// //         type="file"
// //         multiple
// //         className="hidden"
// //         onChange={handleFileInputChange}
// //       />

// //       {/* Real Computer Files Dropzone Overlay */}
// //       <AnimatePresence>
// //         {isDragOver && (
// //           <motion.div
// //             initial={{ opacity: 0, scale: 0.98 }}
// //             animate={{ opacity: 1, scale: 1 }}
// //             exit={{ opacity: 0, scale: 0.98 }}
// //             className="absolute inset-4 rounded-3xl border-2 border-dashed border-sky-400/90 bg-sky-950/70 backdrop-blur-xl z-50 flex flex-col items-center justify-center pointer-events-none shadow-2xl"
// //           >
// //             <UploadCloud className="w-16 h-16 text-sky-400 animate-bounce mb-3 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
// //             <h3 className="text-2xl font-bold text-white drop-shadow">
// //               Drop your computer files or folders here
// //             </h3>
// //             <p className="text-sm text-sky-200 mt-1 max-w-md text-center">
// //               All files, images, videos, audio, and code will be mounted directly into Abhishek OS Desktop.
// //             </p>
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //       {/* Wallpaper Layer */}
// //       {currentWallpaper.isLive && currentWallpaper.liveType ? (
// //         <LiveWallpaper type={currentWallpaper.liveType} performanceMode={settings.performanceMode} />
// //       ) : (
// //         <div
// //           className="absolute inset-0 bg-cover bg-center transition-all duration-700"
// //           style={{ backgroundImage: `url(${currentWallpaper.url})` }}
// //         />
// //       )}

// //       {/* Screen Brightness Filter */}
// //       <div
// //         className="absolute inset-0 pointer-events-none transition-colors duration-300 z-0"
// //         style={{
// //           backgroundColor: `rgba(0, 0, 0, ${Math.max(0, (100 - settings.brightness) * 0.0075)})`,
// //         }}
// //       />

// //       {/* Night Shift Warmth Filter */}
// //       {settings.nightShift && (
// //         <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-color-burn z-0" />
// //       )}

// //       {/* Desktop Quick Action Bar: Fullscreen & PC Sync (Top-Right) */}
// //       <div className="absolute top-12 right-6 flex items-center gap-2.5 z-20 pointer-events-auto">
// //         {/* Fullscreen Button */}
// //         <motion.button
// //           id="desktop-fullscreen-btn"
// //           whileHover={{ scale: 1.05 }}
// //           whileTap={{ scale: 0.95 }}
// //           onClick={toggleFullscreen}
// //           className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-white hover:bg-white/20 border border-white/20 text-xs font-semibold shadow-lg backdrop-blur-2xl transition-all cursor-pointer group"
// //           title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
// //         >
// //           {isFullscreen ? (
// //             <>
// //               <Minimize2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
// //               <span>Exit Fullscreen</span>
// //             </>
// //           ) : (
// //             <>
// //               <Maximize2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
// //               <span>Fullscreen</span>
// //             </>
// //           )}
// //         </motion.button>

// //         {/* Local PC Mount Button */}
// //         <motion.button
// //           id="desktop-connect-pc-btn"
// //           whileHover={{ scale: 1.05 }}
// //           whileTap={{ scale: 0.95 }}
// //           onClick={async () => {
// //             if ('showDirectoryPicker' in window) {
// //               await connectLocalDirectory();
// //               refreshFiles();
// //             } else {
// //               fileInputRef.current?.click();
// //             }
// //           }}
// //           className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-white hover:bg-white/20 border border-white/20 text-xs font-semibold shadow-lg backdrop-blur-2xl transition-all cursor-pointer group"
// //           title="Connect local computer drive or import folder"
// //         >
// //           <HardDrive className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
// //           <span>Connect PC Drive</span>
// //         </motion.button>
// //       </div>

// //       {/* Movable Desktop Widgets (weather, now-playing, system stats on right side) */}
// //       <DesktopWidgets />

// //       {/* Draggable Desktop Icons Canvas */}
// //       <div className="absolute inset-0 pointer-events-none z-10">
// //         {allDesktopItems.map((item, idx) => {
// //           const pos = getItemPosition(item.id, idx);
// //           const isSelected = selectedIconIds.includes(item.id);
// //           const isDraggingThis = draggingItemId === item.id;

// //           return (
// //             <div
// //               key={item.id}
// //               onPointerDown={e => handlePointerDown(e, item, idx)}
// //               onPointerMove={handlePointerMove}
// //               onPointerUp={handlePointerUp}
// //               onPointerCancel={handlePointerUp}
// //               style={{
// //                 position: 'absolute',
// //                 left: `${pos.x}px`,
// //                 top: `${pos.y}px`,
// //                 touchAction: 'none',
// //               }}
// //               onClick={e => {
// //                 e.stopPropagation();
// //                 if (dragTrackerRef.current?.hasMoved) return;
// //                 if (e.metaKey || e.ctrlKey) {
// //                   setSelectedIconIds(prev =>
// //                     prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
// //                   );
// //                 } else {
// //                   setSelectedIconIds([item.id]);
// //                 }
// //                 sound.playClick();
// //               }}
// //               onDoubleClick={e => {
// //                 e.stopPropagation();
// //                 if (dragTrackerRef.current?.hasMoved) return;
// //                 handleOpenItem(item.id, item.type, 'file' in item ? item.file : undefined);
// //               }}
// //               onContextMenu={e => handleContextMenu(e, item.id)}
// //               className={`pointer-events-auto select-none group flex flex-col items-center justify-center w-24 p-2 rounded-2xl cursor-grab active:cursor-grabbing transition-shadow duration-150 ${
// //                 isDraggingThis ? 'z-50 scale-105 shadow-2xl opacity-90' : 'z-10'
// //               } ${
// //                 isSelected
// //                   ? 'bg-sky-500/35 ring-2 ring-sky-400 shadow-xl'
// //                   : 'hover:bg-white/15'
// //               }`}
// //               title="Drag smoothly anywhere on Desktop (strictly bounded to screen)"
// //             >
// //               {/* Icon Graphic */}
// //               {item.isSystem ? (
// //                 <div
// //                   className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center shadow-lg text-white group-hover:scale-105 transition-transform pointer-events-none`}
// //                 >
// //                   {React.createElement(item.icon, { className: 'w-7 h-7' })}
// //                 </div>
// //               ) : (
// //                 <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg text-white group-hover:scale-105 transition-transform pointer-events-none">
// //                   {item.type === 'folder' ? (
// //                     <Folder className="w-7 h-7 text-sky-400 fill-sky-400/30" />
// //                   ) : item.type === 'image' ? (
// //                     <Image className="w-7 h-7 text-amber-400" />
// //                   ) : item.type === 'code' ? (
// //                     <Code2 className="w-7 h-7 text-indigo-300" />
// //                   ) : (
// //                     <FileText className="w-7 h-7 text-slate-200" />
// //                   )}
// //                 </div>
// //               )}

// //               {/* Label */}
// //               <span className="mt-1.5 text-xs font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center line-clamp-2 px-1 max-w-full break-all pointer-events-none">
// //                 {item.name}
// //               </span>
// //             </div>
// //           );
// //         })}
// //       </div>

// //       {/* Desktop Right-Click Context Menu */}
// //       <AnimatePresence>
// //         {contextMenu.visible && (
// //           <motion.div
// //             initial={{ opacity: 0, scale: 0.95 }}
// //             animate={{ opacity: 1, scale: 1 }}
// //             exit={{ opacity: 0, scale: 0.95 }}
// //             transition={{ duration: 0.12 }}
// //             style={{ left: contextMenu.x, top: contextMenu.y }}
// //             className="fixed z-50 w-64 rounded-2xl glass-panel text-white py-1.5 shadow-2xl border border-white/20 backdrop-blur-3xl text-xs font-medium"
// //             onClick={e => e.stopPropagation()}
// //           >
// //             {(() => {
// //               const targetItem = allDesktopItems.find(i => i.id === contextMenu.targetId);
// //               const isApp = targetItem && (targetItem.isSystem || targetItem.type === 'app');
// //               const appId = targetItem && targetItem.isSystem ? targetItem.appId : (targetItem?.type === 'app' ? targetItem.id : null);

// //               if (isApp) {
// //                 /* Application Right-Click Context Menu */
// //                 return (
// //                   <div className="space-y-0.5">
// //                     <div className="px-3.5 py-1.5 border-b border-white/10 flex items-center justify-between">
// //                       <span className="font-bold text-white truncate max-w-[150px]">{targetItem.name}</span>
// //                       <span className="text-[10px] text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded font-mono">App</span>
// //                     </div>

// //                     <button
// //                       onClick={() => {
// //                         handleOpenItem(targetItem.id, targetItem.type);
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                     >
// //                       <ExternalLink className="w-4 h-4 text-sky-400" />
// //                       <span>Open {targetItem.name}</span>
// //                     </button>

// //                     <button
// //                       onClick={() => {
// //                         setFeaturesModalAppId(appId || 'finder');
// //                         sound.playClick();
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-indigo-300 font-semibold transition-colors cursor-pointer"
// //                     >
// //                       <Sparkles className="w-4 h-4 text-indigo-400" />
// //                       <span>App Features & Details...</span>
// //                     </button>

// //                     <button
// //                       onClick={async () => {
// //                         try {
// //                           await navigator.clipboard.writeText(targetItem.name);
// //                           addNotification({
// //                             appId: appId || 'system',
// //                             title: 'Copied App Info',
// //                             message: `Copied "${targetItem.name}" to clipboard.`,
// //                             type: 'system',
// //                           });
// //                         } catch {}
// //                         sound.playClick();
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                     >
// //                       <Copy className="w-4 h-4 text-slate-400" />
// //                       <span>Copy App Name</span>
// //                     </button>

// //                     {appId && (
// //                       <button
// //                         onClick={() => {
// //                           toggleDockPin(appId);
// //                           sound.playClick();
// //                           setContextMenu(prev => ({ ...prev, visible: false }));
// //                         }}
// //                         className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-amber-300 transition-colors cursor-pointer"
// //                       >
// //                         {dockAppIds.includes(appId) ? (
// //                           <>
// //                             <PinOff className="w-4 h-4 text-amber-400" />
// //                             <span>Remove from Dock</span>
// //                           </>
// //                         ) : (
// //                           <>
// //                             <Pin className="w-4 h-4 text-amber-400" />
// //                             <span>Keep in Dock</span>
// //                           </>
// //                         )}
// //                       </button>
// //                     )}

// //                     <div className="h-px bg-white/10 my-1 mx-2" />

// //                     <button
// //                       onClick={() => {
// //                         setFeaturesModalAppId(appId || 'finder');
// //                         sound.playClick();
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-slate-300 transition-colors cursor-pointer"
// //                     >
// //                       <Info className="w-4 h-4 text-slate-400" />
// //                       <span>Get Info & Specs</span>
// //                     </button>
// //                   </div>
// //                 );
// //               }

// //               if (targetItem && !targetItem.isSystem) {
// //                 /* Specific File Context Menu */
// //                 return (
// //                   <div className="space-y-0.5">
// //                     <button
// //                       onClick={() => {
// //                         const f = vfs.getFileById(contextMenu.targetId!);
// //                         if (f) handleOpenItem(f.id, f.type, f);
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                     >
// //                       <FileText className="w-4 h-4 text-sky-400" />
// //                       <span>Open</span>
// //                     </button>
// //                     <button
// //                       onClick={() => {
// //                         const f = vfs.getFileById(contextMenu.targetId!);
// //                         if (f) setQuickLookFile(f);
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                     >
// //                       <Maximize2 className="w-4 h-4 text-purple-400" />
// //                       <span>Quick Look (Space)</span>
// //                     </button>
// //                     <div className="h-px bg-white/10 my-1 mx-2" />
// //                     <button
// //                       onClick={() => {
// //                         vfs.copyFiles([contextMenu.targetId!]);
// //                         sound.playClick();
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                         addNotification({ appId: 'finder', title: 'Desktop', message: 'Item copied to clipboard', type: 'system' });
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                     >
// //                       <Copy className="w-4 h-4 text-slate-400" />
// //                       <span>Copy (Cmd+C / Ctrl+C)</span>
// //                     </button>
// //                     <button
// //                       onClick={() => {
// //                         vfs.duplicate(contextMenu.targetId!);
// //                         sound.playClick();
// //                         refreshFiles();
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                     >
// //                       <Files className="w-4 h-4 text-slate-400" />
// //                       <span>Duplicate (Cmd+D)</span>
// //                     </button>
// //                     <div className="h-px bg-white/10 my-1 mx-2" />
// //                     <button
// //                       onClick={() => {
// //                         vfs.moveToTrash(contextMenu.targetId!);
// //                         sound.playTrash();
// //                         refreshFiles();
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
// //                     >
// //                       <Trash2 className="w-4 h-4 text-rose-400" />
// //                       <span>Move to Trash (Delete)</span>
// //                     </button>
// //                   </div>
// //                 );
// //               }

// //               /* General Desktop Context Menu */
// //               return (
// //                 <div className="space-y-0.5">
// //                   <button
// //                     onClick={() => {
// //                       setNewFileName('');
// //                       setShowNewFileModal(true);
// //                       setContextMenu(prev => ({ ...prev, visible: false }));
// //                     }}
// //                     className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                   >
// //                     <Plus className="w-4 h-4 text-sky-400" />
// //                     <span>New File...</span>
// //                   </button>
// //                   <button
// //                     onClick={handleCreateFolder}
// //                     className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                   >
// //                     <Folder className="w-4 h-4 text-amber-400" />
// //                     <span>New Folder</span>
// //                   </button>

// //                   {hasClipboard && (
// //                     <button
// //                       onClick={() => {
// //                         const pasted = vfs.paste('/Users/abhishek/Desktop');
// //                         if (pasted.length > 0) {
// //                           sound.playClick();
// //                           refreshFiles();
// //                           setSelectedIconIds(pasted.map(f => f.id));
// //                         }
// //                         setContextMenu(prev => ({ ...prev, visible: false }));
// //                       }}
// //                       className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-indigo-300 transition-colors cursor-pointer"
// //                     >
// //                       <ClipboardPaste className="w-4 h-4 text-indigo-400" />
// //                       <span>Paste Items</span>
// //                     </button>
// //                   )}

// //                   <div className="h-px bg-white/10 my-1 mx-2" />

// //                   <button
// //                     onClick={() => {
// //                       handleAutoArrange();
// //                       setContextMenu(prev => ({ ...prev, visible: false }));
// //                     }}
// //                     className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer font-semibold text-sky-300"
// //                   >
// //                     <Grid className="w-4 h-4 text-sky-400" />
// //                     <span>Auto Arrange Icons</span>
// //                   </button>

// //                   <div className="h-px bg-white/10 my-1 mx-2" />

// //                   <button
// //                     onClick={async () => {
// //                       setContextMenu(prev => ({ ...prev, visible: false }));
// //                       if ('showDirectoryPicker' in window) {
// //                         await connectLocalDirectory();
// //                         refreshFiles();
// //                       } else {
// //                         fileInputRef.current?.click();
// //                       }
// //                     }}
// //                     className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-emerald-300 transition-colors cursor-pointer"
// //                   >
// //                     <HardDrive className="w-4 h-4 text-emerald-400" />
// //                     <span>Connect PC Drive / Folder...</span>
// //                   </button>
// //                   <button
// //                     onClick={() => {
// //                       setContextMenu(prev => ({ ...prev, visible: false }));
// //                       fileInputRef.current?.click();
// //                     }}
// //                     className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                   >
// //                     <UploadCloud className="w-4 h-4 text-sky-400" />
// //                     <span>Import Files from PC...</span>
// //                   </button>

// //                   <div className="h-px bg-white/10 my-1 mx-2" />

// //                   <button
// //                     onClick={() => {
// //                       openApp('settings');
// //                       setContextMenu(prev => ({ ...prev, visible: false }));
// //                     }}
// //                     className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                   >
// //                     <Image className="w-4 h-4 text-pink-400" />
// //                     <span>Change Wallpaper...</span>
// //                   </button>
// //                   <button
// //                     onClick={() => {
// //                       refreshFiles();
// //                       setContextMenu(prev => ({ ...prev, visible: false }));
// //                       sound.playClick();
// //                     }}
// //                     className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"
// //                   >
// //                     <RefreshCw className="w-4 h-4 text-slate-300" />
// //                     <span>Refresh Desktop</span>
// //                   </button>
// //                 </div>
// //               );
// //             })()}
// //           </motion.div>
// //         )}
// //       </AnimatePresence>

// //       {/* New File Modal on Desktop */}
// //       {showNewFileModal && (
// //         <div
// //           className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
// //           onClick={() => setShowNewFileModal(false)}
// //         >
// //           <div
// //             className="w-full max-w-md rounded-3xl glass-panel bg-slate-900/95 border border-white/20 p-6 shadow-2xl text-white space-y-4"
// //             onClick={e => e.stopPropagation()}
// //           >
// //             <div className="flex items-center justify-between">
// //               <h3 className="text-base font-bold flex items-center gap-2">
// //                 <FileText className="w-5 h-5 text-sky-400" />
// //                 <span>Create New File on Desktop</span>
// //               </h3>
// //               <button
// //                 onClick={() => setShowNewFileModal(false)}
// //                 className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
// //               >
// //                 <X className="w-4 h-4" />
// //               </button>
// //             </div>

// //             <div>
// //               <label className="text-xs font-semibold text-slate-300 block mb-1.5">File Name</label>
// //               <input
// //                 type="text"
// //                 autoFocus
// //                 placeholder="e.g. notes, script, document"
// //                 value={newFileName}
// //                 onChange={e => setNewFileName(e.target.value)}
// //                 onKeyDown={e => {
// //                   if (e.key === 'Enter') handleCreateNewFile();
// //                 }}
// //                 className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs outline-none focus:border-sky-400"
// //               />
// //             </div>

// //             <div>
// //               <label className="text-xs font-semibold text-slate-300 block mb-2">File Template / Type</label>
// //               <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
// //                 {[
// //                   { label: 'Plain Text', ext: 'txt', type: 'document', icon: FileText },
// //                   { label: 'Markdown', ext: 'md', type: 'document', icon: FileSpreadsheet },
// //                   { label: 'TypeScript', ext: 'ts', type: 'code', icon: FileCode },
// //                   { label: 'JavaScript', ext: 'js', type: 'code', icon: Code2 },
// //                   { label: 'Python', ext: 'py', type: 'code', icon: Code2 },
// //                   { label: 'JSON Data', ext: 'json', type: 'code', icon: FileCode },
// //                 ].map(tmpl => {
// //                   const isSelected = newFileExtension === tmpl.ext;
// //                   const Icon = tmpl.icon;
// //                   return (
// //                     <button
// //                       key={tmpl.ext}
// //                       type="button"
// //                       onClick={() => {
// //                         setNewFileExtension(tmpl.ext);
// //                         setNewFileType(tmpl.type as 'document' | 'code');
// //                       }}
// //                       className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
// //                         isSelected
// //                           ? 'bg-sky-500/25 border-sky-400 text-white font-semibold shadow-md'
// //                           : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
// //                       }`}
// //                     >
// //                       <Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />
// //                       <div className="truncate">
// //                         <div className="text-xs truncate">{tmpl.label}</div>
// //                         <div className="text-[10px] text-slate-400 font-mono">.{tmpl.ext}</div>
// //                       </div>
// //                     </button>
// //                   );
// //                 })}
// //               </div>
// //             </div>

// //             <div className="flex justify-end gap-2 pt-2">
// //               <button
// //                 type="button"
// //                 onClick={() => setShowNewFileModal(false)}
// //                 className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs cursor-pointer"
// //               >
// //                 Cancel
// //               </button>
// //               <button
// //                 type="button"
// //                 onClick={handleCreateNewFile}
// //                 className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20 cursor-pointer"
// //               >
// //                 Create File
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* App Features & Details Modal */}
// //       <AppFeaturesModal
// //         appId={featuresModalAppId}
// //         isOpen={!!featuresModalAppId}
// //         onClose={() => setFeaturesModalAppId(null)}
// //       />
// //     </div>
// //   );
// // };


import React, { useState, useEffect, useRef, useMemo } from 'react';

import { motion, AnimatePresence } from 'motion/react';

import {

  Folder,

  FileText,

  Terminal,

  Code2,

  Trash2,

  Image,

  RefreshCw,

  Monitor,

  Tv,

  Maximize2,

  Minimize2,

  HardDrive,

  UploadCloud,

  Laptop,

  Plus,

  Grid,

  Copy,

  ClipboardPaste,

  Scissors,

  Files,

  X,

  FileSpreadsheet,

  FileCode,

  Sparkles,

  Smartphone,

  Info,

  Pin,

  PinOff,

  ExternalLink,

  Camera as CameraIcon,

} from 'lucide-react';

import { useOS } from '../../context/OSContext';

import { LiveWallpaper } from './LiveWallpaper';

import { DesktopWidgets } from './DesktopWidgets';

import { vfs } from '../../services/virtualFileSystem';

import { sound } from '../../services/soundService';

import { VirtualFile } from '../../types/desktop';

import { AppFeaturesModal } from '../system/AppFeaturesModal';



interface ContextMenuState {

  x: number;

  y: number;

  visible: boolean;

  targetId?: string | null;

}



interface Position {

  x: number;

  y: number;

}



type DesktopItem =

  | {

      id: string;

      name: string;

      isSystem: true;

      type: string;

      appId: string;

      icon: React.ComponentType<{ className?: string }>;

      gradient: string;

    }

  | {

      id: string;

      name: string;

      isSystem: false;

      type: string;

      file: VirtualFile;

    };



const DESKTOP_POS_KEY = 'abhishek_os_desktop_icon_positions_v2';



export const Desktop: React.FC = () => {

  const {

    currentWallpaper,

    settings,

    openApp,

    setQuickLookFile,

    isFullscreen,

    toggleFullscreen,

    importLocalFiles,

    connectLocalDirectory,

    addNotification,

    toggleDockPin,

    dockAppIds,

  } = useOS();



  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const desktopContainerRef = useRef<HTMLDivElement | null>(null);



  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, visible: false });

  const [selectedIconIds, setSelectedIconIds] = useState<string[]>([]);

  const [isDragOver, setIsDragOver] = useState(false);

  const [featuresModalAppId, setFeaturesModalAppId] = useState<string | null>(null);



  // Modals

  const [showNewFileModal, setShowNewFileModal] = useState(false);

  const [newFileName, setNewFileName] = useState('');

  const [newFileType, setNewFileType] = useState<'document' | 'code'>('document');

  const [newFileExtension, setNewFileExtension] = useState('txt');



  // Desktop files

  const [desktopFiles, setDesktopFiles] = useState(() => vfs.getFiles('/Users/abhishek/Desktop'));



  // Saved movable icon positions

  const [customPositions, setCustomPositions] = useState<Record<string, Position>>(() => {

    try {

      const stored = localStorage.getItem(DESKTOP_POS_KEY);

      return stored ? JSON.parse(stored) : {};

    } catch {

      return {};

    }

  });



  // Drag state tracker

  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);

  const dragTrackerRef = useRef<{

    itemId: string;

    startX: number;

    startY: number;

    startPos: Position;

    hasMoved: boolean;

  } | null>(null);



  const savePositions = (newPositions: Record<string, Position>) => {

    setCustomPositions(newPositions);

    try {

      localStorage.setItem(DESKTOP_POS_KEY, JSON.stringify(newPositions));

    } catch {

      // ignore

    }

  };



  const refreshFiles = () => {

    setDesktopFiles(vfs.getFiles('/Users/abhishek/Desktop'));

  };



  // Keep all icons within screen bounds on window resize

  useEffect(() => {

    const handleResize = () => {

      const maxX = Math.max(16, window.innerWidth - 108);

      const maxY = Math.max(40, window.innerHeight - 128);



      setCustomPositions(prev => {

        let changed = false;

        const next = { ...prev };

        Object.entries(next).forEach(([id, pos]) => {

          const clampedX = Math.max(16, Math.min(maxX, pos.x));

          const clampedY = Math.max(40, Math.min(maxY, pos.y));

          if (clampedX !== pos.x || clampedY !== pos.y) {

            next[id] = { x: clampedX, y: clampedY };

            changed = true;

          }

        });

        if (changed) {

          savePositions(next);

        }

        return next;

      });

    };



    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);



  // Fixed desktop shortcuts

  const systemShortcuts = useMemo(

    () => [

      {

        id: 'icon-finder',

        label: 'Documents',

        type: 'app',

        appId: 'finder',

        icon: Folder,

        gradient: 'from-sky-500 to-cyan-300',

      },

      {

        id: 'icon-mobile',

        label: 'iPhone Mirroring',

        type: 'app',

        appId: 'mobile',

        icon: Smartphone,

        gradient: 'from-indigo-600 via-purple-600 to-pink-500',

      },

      {

        id: 'icon-local-pc',

        label: 'My PC Drive',

        type: 'app',

        appId: 'finder',

        icon: HardDrive,

        gradient: 'from-emerald-600 to-teal-400',

      },

      {

        id: 'icon-tv',

        label: 'Abhishek TV',

        type: 'app',

        appId: 'tv',

        icon: Tv,

        gradient: 'from-purple-600 to-pink-400',

      },

      // {

      //   id: 'icon-camera',

      //   label: 'Camera',

      //   type: 'app',

      //   appId: 'camera',

      //   icon: CameraIcon,

      //   gradient: 'from-zinc-900 via-slate-800 to-black',

      // },

      {

        id: 'icon-code',

        label: 'Code Studio',

        type: 'app',

        appId: 'codestudio',

        icon: Code2,

        gradient: 'from-indigo-700 to-sky-400',

      },
      

      {

        id: 'icon-terminal',

        label: 'Terminal',

        type: 'app',

        appId: 'terminal',

        icon: Terminal,

        gradient: 'from-slate-900 to-slate-800',

      },

    ],

    []

  );



  // Combined list of all desktop icons

  const allDesktopItems: DesktopItem[] = useMemo(() => {

    return [

      ...systemShortcuts.map(s => ({

        id: s.id,

        name: s.label,

        isSystem: true as const,

        type: s.type,

        appId: s.appId,

        icon: s.icon,

        gradient: s.gradient,

      })),

      ...desktopFiles.map(f => ({

        id: f.id,

        name: f.name,

        isSystem: false as const,

        type: f.type,

        file: f,

      })),

    ];

  }, [systemShortcuts, desktopFiles]);



  // Compute coordinate for an item (saved or default non-overlapping grid)

  const getItemPosition = (itemId: string, index: number): Position => {

    if (customPositions[itemId]) {

      const maxX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 108) : 1200;

      const maxY = typeof window !== 'undefined' ? Math.max(40, window.innerHeight - 128) : 800;

      return {

        x: Math.max(16, Math.min(maxX, customPositions[itemId].x)),

        y: Math.max(40, Math.min(maxY, customPositions[itemId].y)),

      };

    }

    const containerH = typeof window !== 'undefined' ? window.innerHeight : 900;

    const startX = 24;

    const startY = 48;

    const slotH = 104;

    const slotW = 104;

    const availableHeight = Math.max(slotH, containerH - startY - 110);

    const rowsPerCol = Math.max(1, Math.floor(availableHeight / slotH));

    const col = Math.floor(index / rowsPerCol);

    const row = index % rowsPerCol;

    return {

      x: startX + col * slotW,

      y: startY + row * slotH,

    };

  };



  // Pointer-based rock-solid drag handlers with strict screen bounds

  const handlePointerDown = (e: React.PointerEvent, item: DesktopItem, idx: number) => {

    if (e.button !== 0) return; // only left click initiates dragging

    const current = getItemPosition(item.id, idx);

    dragTrackerRef.current = {

      itemId: item.id,

      startX: e.clientX,

      startY: e.clientY,

      startPos: { ...current },

      hasMoved: false,

    };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

  };



  const handlePointerMove = (e: React.PointerEvent) => {

    if (!dragTrackerRef.current) return;

    const tracker = dragTrackerRef.current;

    const dx = e.clientX - tracker.startX;

    const dy = e.clientY - tracker.startY;



    if (!tracker.hasMoved && Math.hypot(dx, dy) > 4) {

      tracker.hasMoved = true;

      setDraggingItemId(tracker.itemId);

    }



    if (tracker.hasMoved) {

      const maxX = Math.max(16, window.innerWidth - 108);

      const maxY = Math.max(40, window.innerHeight - 128);

      const clampedX = Math.max(16, Math.min(maxX, tracker.startPos.x + dx));

      const clampedY = Math.max(40, Math.min(maxY, tracker.startPos.y + dy));



      setCustomPositions(prev => ({

        ...prev,

        [tracker.itemId]: { x: Math.round(clampedX), y: Math.round(clampedY) },

      }));

    }

  };



  const handlePointerUp = (e: React.PointerEvent) => {

    if (!dragTrackerRef.current) return;

    const tracker = dragTrackerRef.current;

    try {

      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    } catch {}



    if (tracker.hasMoved) {

      setCustomPositions(prev => {

        savePositions(prev);

        return prev;

      });

    }

    setDraggingItemId(null);

    dragTrackerRef.current = null;

  };



  // Robust Auto-Arrange: snaps all icons to a strict non-overlapping grid within screen boundaries

  const handleAutoArrange = () => {

    const containerW = typeof window !== 'undefined' ? window.innerWidth : 1440;

    const containerH = typeof window !== 'undefined' ? window.innerHeight : 900;



    const startX = 24;

    const startY = 48;

    const slotW = 104;

    const slotH = 104;



    const availableHeight = Math.max(slotH, containerH - startY - 110);

    const rowsPerCol = Math.max(1, Math.floor(availableHeight / slotH));



    const newPositions: Record<string, Position> = {};

    allDesktopItems.forEach((item, index) => {

      const col = Math.floor(index / rowsPerCol);

      const row = index % rowsPerCol;

      const x = startX + col * slotW;

      const y = startY + row * slotH;



      const maxX = Math.max(startX, containerW - 108);

      const maxY = Math.max(startY, containerH - 128);



      newPositions[item.id] = {

        x: Math.min(maxX, x),

        y: Math.min(maxY, y),

      };

    });



    savePositions(newPositions);

    sound.playClick();

    addNotification({

      appId: 'finder',

      title: 'Desktop Auto Arrange',

      message: `All ${allDesktopItems.length} desktop icons arranged in a clean, collision-free grid.`,

      type: 'system',

    });

  };



  const handleContextMenu = (e: React.MouseEvent, targetId: string | null = null) => {

    e.preventDefault();

    sound.playClick();

    const x = Math.min(e.clientX, window.innerWidth - 240);

    const y = Math.min(e.clientY, window.innerHeight - 340);

    if (targetId && !selectedIconIds.includes(targetId)) {

      setSelectedIconIds([targetId]);

    }

    setContextMenu({ x, y, visible: true, targetId });

  };



  const handleDesktopClick = () => {

    if (contextMenu.visible) {

      setContextMenu(prev => ({ ...prev, visible: false }));

    }

    setSelectedIconIds([]);

  };



  const handleCreateFolder = () => {

    const created = vfs.createFolder('New Folder', '/Users/abhishek/Desktop');

    refreshFiles();

    setSelectedIconIds([created.id]);

    setContextMenu(prev => ({ ...prev, visible: false }));

    sound.playClick();

  };



  const handleCreateNewFile = () => {

    const rawName = newFileName.trim() || 'Untitled';

    const finalName = rawName.includes('.') ? rawName : `${rawName}.${newFileExtension}`;

    const ext = finalName.split('.').pop() || newFileExtension;

    const created = vfs.createFile(finalName, '/Users/abhishek/Desktop', newFileType, '', ext);

    refreshFiles();

    setSelectedIconIds([created.id]);

    setShowNewFileModal(false);

    setNewFileName('');

    sound.playClick();

    addNotification({

      appId: 'finder',

      title: 'Desktop',

      message: `Created "${finalName}" on Desktop`,

      type: 'system',

    });

  };



  // Desktop Drag & Drop from PC files

  const handleDragOver = (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    setIsDragOver(true);

  };



  const handleDragLeave = (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    setIsDragOver(false);

  };



  const handleDrop = async (e: React.DragEvent) => {

    e.preventDefault();

    e.stopPropagation();

    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {

      await importLocalFiles(e.dataTransfer.files, '/Users/abhishek/Desktop');

      refreshFiles();

    }

  };



  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {

    if (e.target.files && e.target.files.length > 0) {

      await importLocalFiles(e.target.files, '/Users/abhishek/Desktop');

      refreshFiles();

    }

  };



  const handleOpenItem = (itemId: string, type: string, file?: VirtualFile) => {

    sound.playClick();

    if (itemId === 'icon-finder' || type === 'folder') {

      openApp('finder');

    } else if (itemId === 'icon-mobile') {

      openApp('mobile');

    } else if (itemId === 'icon-local-pc') {

      openApp('finder');

    } else if (itemId === 'icon-tv') {

      openApp('tv');

    // } else if (itemId === 'icon-camera') {

    //   openApp('camera');

    } else if (itemId === 'icon-code') {

      openApp('codestudio');

    } else if (itemId === 'icon-terminal') {

      openApp('terminal');

    } else if (file) {

      if (file.extension === 'txt' || file.type === 'code' || file.type === 'document') {

        openApp('codestudio');

      } else if (file.type === 'audio') {

        openApp('music');

      } else if (file.type === 'video') {

        openApp('tv');

      } else {

        setQuickLookFile(file);

      }

    }

  };



  // Global & Desktop Keyboard Shortcuts

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {

        return;

      }



      const isMod = e.ctrlKey || e.metaKey;



      // Select All: Cmd/Ctrl + A

      if (isMod && e.code === 'KeyA') {

        e.preventDefault();

        setSelectedIconIds(allDesktopItems.map(item => item.id));

        sound.playClick();

        return;

      }



      // Copy: Cmd/Ctrl + C

      if (isMod && e.code === 'KeyC') {

        const fileIdsToCopy = selectedIconIds.filter(id => !id.startsWith('icon-'));

        if (fileIdsToCopy.length > 0) {

          e.preventDefault();

          vfs.copyFiles(fileIdsToCopy);

          sound.playClick();

          addNotification({

            appId: 'finder',

            title: 'Desktop',

            message: `Copied ${fileIdsToCopy.length} item(s) to clipboard`,

            type: 'system',

          });

        }

        return;

      }



      // Paste: Cmd/Ctrl + V

      if (isMod && e.code === 'KeyV') {

        e.preventDefault();

        const pasted = vfs.paste('/Users/abhishek/Desktop');

        if (pasted.length > 0) {

          sound.playClick();

          refreshFiles();

          setSelectedIconIds(pasted.map(f => f.id));

          addNotification({

            appId: 'finder',

            title: 'Desktop',

            message: `Pasted ${pasted.length} item(s) onto Desktop`,

            type: 'system',

          });

        }

        return;

      }



      // Delete: Delete / Backspace / Cmd+Backspace

      if (e.code === 'Delete' || (isMod && e.code === 'Backspace')) {

        const fileIdsToDelete = selectedIconIds.filter(id => !id.startsWith('icon-'));

        if (fileIdsToDelete.length > 0) {

          e.preventDefault();

          fileIdsToDelete.forEach(id => vfs.moveToTrash(id));

          sound.playTrash();

          refreshFiles();

          setSelectedIconIds([]);

        }

        return;

      }



      // Quick Look: Space

      if (e.code === 'Space') {

        const firstFileId = selectedIconIds.find(id => !id.startsWith('icon-'));

        if (firstFileId) {

          const file = vfs.getFileById(firstFileId);

          if (file) {

            e.preventDefault();

            setQuickLookFile(file);

          }

        }

        return;

      }



      // New Folder: Cmd/Ctrl + Shift + N

      if (isMod && e.shiftKey && e.code === 'KeyN') {

        e.preventDefault();

        handleCreateFolder();

        return;

      }



      // New File: Cmd/Ctrl + N

      if (isMod && !e.shiftKey && e.code === 'KeyN') {

        e.preventDefault();

        setNewFileName('');

        setShowNewFileModal(true);

        return;

      }

    };



    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);

  }, [allDesktopItems, selectedIconIds, addNotification, setQuickLookFile]);



  const hasClipboard = !!vfs.getClipboard() && vfs.getClipboard()!.ids.length > 0;



  return (

    <div

      ref={desktopContainerRef}

      className="relative w-full h-full overflow-hidden select-none"

      onContextMenu={e => handleContextMenu(e, null)}

      onClick={handleDesktopClick}

      onDragOver={handleDragOver}

      onDragLeave={handleDragLeave}

      onDrop={handleDrop}

    >

      {/* Hidden local file picker */}

      <input

        ref={fileInputRef}

        type="file"

        multiple

        className="hidden"

        onChange={handleFileInputChange}

      />



      {/* Real Computer Files Dropzone Overlay */}

      <AnimatePresence>

        {isDragOver && (

          <motion.div

            initial={{ opacity: 0, scale: 0.98 }}

            animate={{ opacity: 1, scale: 1 }}

            exit={{ opacity: 0, scale: 0.98 }}

            className="absolute inset-4 rounded-3xl border-2 border-dashed border-sky-400/90 bg-sky-950/70 backdrop-blur-xl z-50 flex flex-col items-center justify-center pointer-events-none shadow-2xl"

          >

            <UploadCloud className="w-16 h-16 text-sky-400 animate-bounce mb-3 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]" />

            <h3 className="text-2xl font-bold text-white drop-shadow">

              Drop your computer files or folders here

            </h3>

            <p className="text-sm text-sky-200 mt-1 max-w-md text-center">

              All files, images, videos, audio, and code will be mounted directly into Abhishek OS Desktop.

            </p>

          </motion.div>

        )}

      </AnimatePresence>



      {/* Wallpaper Layer */}

      {currentWallpaper.isLive && currentWallpaper.liveType ? (

        <LiveWallpaper type={currentWallpaper.liveType} performanceMode={settings.performanceMode} />

      ) : (

        <div

          className="absolute inset-0 bg-cover bg-center transition-all duration-700"

          style={{ backgroundImage: `url(${currentWallpaper.url})` }}

        />

      )}



      {/* Screen Brightness Filter */}

      <div

        className="absolute inset-0 pointer-events-none transition-colors duration-300 z-0"

        style={{

          backgroundColor: `rgba(0, 0, 0, ${Math.max(0, (100 - settings.brightness) * 0.0075)})`,

        }}

      />



      {/* Night Shift Warmth Filter */}

      {settings.nightShift && (

        <div className="absolute inset-0 pointer-events-none bg-amber-500/10 mix-blend-color-burn z-0" />

      )}



      {/* Desktop Quick Action Bar: Fullscreen & PC Sync (Top-Right) */}

      <div className="absolute top-12 right-6 flex items-center gap-2.5 z-20 pointer-events-auto">

        {/* Fullscreen Button */}

        <motion.button

          id="desktop-fullscreen-btn"

          whileHover={{ scale: 1.05 }}

          whileTap={{ scale: 0.95 }}

          onClick={toggleFullscreen}

          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-white hover:bg-white/20 border border-white/20 text-xs font-semibold shadow-lg backdrop-blur-2xl transition-all cursor-pointer group"

          title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}

        >

          {isFullscreen ? (

            <>

              <Minimize2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />

              <span>Exit Fullscreen</span>

            </>

          ) : (

            <>

              <Maximize2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />

              <span>Fullscreen</span>

            </>

          )}

        </motion.button>



        {/* Local PC Mount Button */}

        <motion.button

          id="desktop-connect-pc-btn"

          whileHover={{ scale: 1.05 }}

          whileTap={{ scale: 0.95 }}

          onClick={async () => {

            if ('showDirectoryPicker' in window) {

              await connectLocalDirectory();

              refreshFiles();

            } else {

              fileInputRef.current?.click();

            }

          }}

          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-panel text-white hover:bg-white/20 border border-white/20 text-xs font-semibold shadow-lg backdrop-blur-2xl transition-all cursor-pointer group"

          title="Connect local computer drive or import folder"

        >

          <HardDrive className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />

          <span>Connect PC Drive</span>

        </motion.button>

      </div>



      {/* Movable Desktop Widgets (weather, now-playing, system stats on right side) */}

      <DesktopWidgets />



      {/* Draggable Desktop Icons Canvas */}

      <div className="absolute inset-0 pointer-events-none z-10">

        {allDesktopItems.map((item, idx) => {

          const pos = getItemPosition(item.id, idx);

          const isSelected = selectedIconIds.includes(item.id);

          const isDraggingThis = draggingItemId === item.id;



          return (

            <div

              key={item.id}

              onPointerDown={e => handlePointerDown(e, item, idx)}

              onPointerMove={handlePointerMove}

              onPointerUp={handlePointerUp}

              onPointerCancel={handlePointerUp}

              style={{

                position: 'absolute',

                left: `${pos.x}px`,

                top: `${pos.y}px`,

                touchAction: 'none',

              }}

              onClick={e => {

                e.stopPropagation();

                if (dragTrackerRef.current?.hasMoved) return;

                if (e.metaKey || e.ctrlKey) {

                  setSelectedIconIds(prev =>

                    prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]

                  );

                } else {

                  setSelectedIconIds([item.id]);

                }

                sound.playClick();

              }}

              onDoubleClick={e => {

                e.stopPropagation();

                if (dragTrackerRef.current?.hasMoved) return;

                handleOpenItem(item.id, item.type, 'file' in item ? item.file : undefined);

              }}

              onContextMenu={e => handleContextMenu(e, item.id)}

              className={`pointer-events-auto select-none group flex flex-col items-center justify-center w-24 p-2 rounded-2xl cursor-grab active:cursor-grabbing transition-shadow duration-150 ${

                isDraggingThis ? 'z-50 scale-105 shadow-2xl opacity-90' : 'z-10'

              } ${

                isSelected

                  ? 'bg-sky-500/35 ring-2 ring-sky-400 shadow-xl'

                  : 'hover:bg-white/15'

              }`}

              title="Drag smoothly anywhere on Desktop (strictly bounded to screen)"

            >

              {/* Icon Graphic */}

              {item.isSystem ? (

                <div

                  className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center shadow-lg text-white group-hover:scale-105 transition-transform pointer-events-none`}

                >

                  {React.createElement(item.icon, { className: 'w-7 h-7' })}

                </div>

              ) : (

                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg text-white group-hover:scale-105 transition-transform pointer-events-none">

                  {item.type === 'folder' ? (

                    <Folder className="w-7 h-7 text-sky-400 fill-sky-400/30" />

                  ) : item.type === 'image' ? (

                    <Image className="w-7 h-7 text-amber-400" />

                  ) : item.type === 'code' ? (

                    <Code2 className="w-7 h-7 text-indigo-300" />

                  ) : (

                    <FileText className="w-7 h-7 text-slate-200" />

                  )}

                </div>

              )}



              {/* Label */}

              <span className="mt-1.5 text-xs font-medium text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-center line-clamp-2 px-1 max-w-full break-all pointer-events-none">

                {item.name}

              </span>

            </div>

          );

        })}

      </div>



      {/* Desktop Right-Click Context Menu */}

      <AnimatePresence>

        {contextMenu.visible && (

          <motion.div

            initial={{ opacity: 0, scale: 0.95 }}

            animate={{ opacity: 1, scale: 1 }}

            exit={{ opacity: 0, scale: 0.95 }}

            transition={{ duration: 0.12 }}

            style={{ left: contextMenu.x, top: contextMenu.y }}

            className="fixed z-50 w-64 rounded-2xl glass-panel text-white py-1.5 shadow-2xl border border-white/20 backdrop-blur-3xl text-xs font-medium"

            onClick={e => e.stopPropagation()}

          >

            {(() => {

              const targetItem = allDesktopItems.find(i => i.id === contextMenu.targetId);

              const isApp = targetItem && (targetItem.isSystem || targetItem.type === 'app');

              const appId = targetItem && targetItem.isSystem ? targetItem.appId : (targetItem?.type === 'app' ? targetItem.id : null);



              if (isApp) {

                /* Application Right-Click Context Menu */

                return (

                  <div className="space-y-0.5">

                    <div className="px-3.5 py-1.5 border-b border-white/10 flex items-center justify-between">

                      <span className="font-bold text-white truncate max-w-[150px]">{targetItem.name}</span>

                      <span className="text-[10px] text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded font-mono">App</span>

                    </div>



                    <button

                      onClick={() => {

                        handleOpenItem(targetItem.id, targetItem.type);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                    >

                      <ExternalLink className="w-4 h-4 text-sky-400" />

                      <span>Open {targetItem.name}</span>

                    </button>



                    <button

                      onClick={() => {

                        setFeaturesModalAppId(appId || 'finder');

                        sound.playClick();

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-indigo-300 font-semibold transition-colors cursor-pointer"

                    >

                      <Sparkles className="w-4 h-4 text-indigo-400" />

                      <span>App Features & Details...</span>

                    </button>



                    <button

                      onClick={async () => {

                        try {

                          await navigator.clipboard.writeText(targetItem.name);

                          addNotification({

                            appId: appId || 'system',

                            title: 'Copied App Info',

                            message: `Copied "${targetItem.name}" to clipboard.`,

                            type: 'system',

                          });

                        } catch {}

                        sound.playClick();

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                    >

                      <Copy className="w-4 h-4 text-slate-400" />

                      <span>Copy App Name</span>

                    </button>



                    {appId && (

                      <button

                        onClick={() => {

                          toggleDockPin(appId);

                          sound.playClick();

                          setContextMenu(prev => ({ ...prev, visible: false }));

                        }}

                        className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-amber-300 transition-colors cursor-pointer"

                      >

                        {dockAppIds.includes(appId) ? (

                          <>

                            <PinOff className="w-4 h-4 text-amber-400" />

                            <span>Remove from Dock</span>

                          </>

                        ) : (

                          <>

                            <Pin className="w-4 h-4 text-amber-400" />

                            <span>Keep in Dock</span>

                          </>

                        )}

                      </button>

                    )}



                    <div className="h-px bg-white/10 my-1 mx-2" />



                    <button

                      onClick={() => {

                        setFeaturesModalAppId(appId || 'finder');

                        sound.playClick();

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-slate-300 transition-colors cursor-pointer"

                    >

                      <Info className="w-4 h-4 text-slate-400" />

                      <span>Get Info & Specs</span>

                    </button>

                  </div>

                );

              }



              if (targetItem && !targetItem.isSystem) {

                /* Specific File Context Menu */

                return (

                  <div className="space-y-0.5">

                    <button

                      onClick={() => {

                        const f = vfs.getFileById(contextMenu.targetId!);

                        if (f) handleOpenItem(f.id, f.type, f);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                    >

                      <FileText className="w-4 h-4 text-sky-400" />

                      <span>Open</span>

                    </button>

                    <button

                      onClick={() => {

                        const f = vfs.getFileById(contextMenu.targetId!);

                        if (f) setQuickLookFile(f);

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                    >

                      <Maximize2 className="w-4 h-4 text-purple-400" />

                      <span>Quick Look (Space)</span>

                    </button>

                    <div className="h-px bg-white/10 my-1 mx-2" />

                    <button

                      onClick={() => {

                        vfs.copyFiles([contextMenu.targetId!]);

                        sound.playClick();

                        setContextMenu(prev => ({ ...prev, visible: false }));

                        addNotification({ appId: 'finder', title: 'Desktop', message: 'Item copied to clipboard', type: 'system' });

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                    >

                      <Copy className="w-4 h-4 text-slate-400" />

                      <span>Copy (Cmd+C / Ctrl+C)</span>

                    </button>

                    <button

                      onClick={() => {

                        vfs.duplicate(contextMenu.targetId!);

                        sound.playClick();

                        refreshFiles();

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                    >

                      <Files className="w-4 h-4 text-slate-400" />

                      <span>Duplicate (Cmd+D)</span>

                    </button>

                    <div className="h-px bg-white/10 my-1 mx-2" />

                    <button

                      onClick={() => {

                        vfs.moveToTrash(contextMenu.targetId!);

                        sound.playTrash();

                        refreshFiles();

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"

                    >

                      <Trash2 className="w-4 h-4 text-rose-400" />

                      <span>Move to Trash (Delete)</span>

                    </button>

                  </div>

                );

              }



              /* General Desktop Context Menu */

              return (

                <div className="space-y-0.5">

                  <button

                    onClick={() => {

                      setNewFileName('');

                      setShowNewFileModal(true);

                      setContextMenu(prev => ({ ...prev, visible: false }));

                    }}

                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                  >

                    <Plus className="w-4 h-4 text-sky-400" />

                    <span>New File...</span>

                  </button>

                  <button

                    onClick={handleCreateFolder}

                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                  >

                    <Folder className="w-4 h-4 text-amber-400" />

                    <span>New Folder</span>

                  </button>



                  {hasClipboard && (

                    <button

                      onClick={() => {

                        const pasted = vfs.paste('/Users/abhishek/Desktop');

                        if (pasted.length > 0) {

                          sound.playClick();

                          refreshFiles();

                          setSelectedIconIds(pasted.map(f => f.id));

                        }

                        setContextMenu(prev => ({ ...prev, visible: false }));

                      }}

                      className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-indigo-300 transition-colors cursor-pointer"

                    >

                      <ClipboardPaste className="w-4 h-4 text-indigo-400" />

                      <span>Paste Items</span>

                    </button>

                  )}



                  <div className="h-px bg-white/10 my-1 mx-2" />



                  <button

                    onClick={() => {

                      handleAutoArrange();

                      setContextMenu(prev => ({ ...prev, visible: false }));

                    }}

                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer font-semibold text-sky-300"

                  >

                    <Grid className="w-4 h-4 text-sky-400" />

                    <span>Auto Arrange Icons</span>

                  </button>



                  <div className="h-px bg-white/10 my-1 mx-2" />



                  <button

                    onClick={async () => {

                      setContextMenu(prev => ({ ...prev, visible: false }));

                      if ('showDirectoryPicker' in window) {

                        await connectLocalDirectory();

                        refreshFiles();

                      } else {

                        fileInputRef.current?.click();

                      }

                    }}

                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 text-emerald-300 transition-colors cursor-pointer"

                  >

                    <HardDrive className="w-4 h-4 text-emerald-400" />

                    <span>Connect PC Drive / Folder...</span>

                  </button>

                  <button

                    onClick={() => {

                      setContextMenu(prev => ({ ...prev, visible: false }));

                      fileInputRef.current?.click();

                    }}

                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                  >

                    <UploadCloud className="w-4 h-4 text-sky-400" />

                    <span>Import Files from PC...</span>

                  </button>



                  <div className="h-px bg-white/10 my-1 mx-2" />



                  <button

                    onClick={() => {

                      openApp('settings');

                      setContextMenu(prev => ({ ...prev, visible: false }));

                    }}

                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                  >

                    <Image className="w-4 h-4 text-pink-400" />

                    <span>Change Wallpaper...</span>

                  </button>

                  <button

                    onClick={() => {

                      refreshFiles();

                      setContextMenu(prev => ({ ...prev, visible: false }));

                      sound.playClick();

                    }}

                    className="w-full px-3.5 py-1.5 flex items-center gap-2.5 text-left hover:bg-white/15 transition-colors cursor-pointer"

                  >

                    <RefreshCw className="w-4 h-4 text-slate-300" />

                    <span>Refresh Desktop</span>

                  </button>

                </div>

              );

            })()}

          </motion.div>

        )}

      </AnimatePresence>



      {/* New File Modal on Desktop */}

      {showNewFileModal && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"

          onClick={() => setShowNewFileModal(false)}

        >

          <div

            className="w-full max-w-md rounded-3xl glass-panel bg-slate-900/95 border border-white/20 p-6 shadow-2xl text-white space-y-4"

            onClick={e => e.stopPropagation()}

          >

            <div className="flex items-center justify-between">

              <h3 className="text-base font-bold flex items-center gap-2">

                <FileText className="w-5 h-5 text-sky-400" />

                <span>Create New File on Desktop</span>

              </h3>

              <button

                onClick={() => setShowNewFileModal(false)}

                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"

              >

                <X className="w-4 h-4" />

              </button>

            </div>



            <div>

              <label className="text-xs font-semibold text-slate-300 block mb-1.5">File Name</label>

              <input

                type="text"

                autoFocus

                placeholder="e.g. notes, script, document"

                value={newFileName}

                onChange={e => setNewFileName(e.target.value)}

                onKeyDown={e => {

                  if (e.key === 'Enter') handleCreateNewFile();

                }}

                className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-xs outline-none focus:border-sky-400"

              />

            </div>



            <div>

              <label className="text-xs font-semibold text-slate-300 block mb-2">File Template / Type</label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                {[

                  { label: 'Plain Text', ext: 'txt', type: 'document', icon: FileText },

                  { label: 'Markdown', ext: 'md', type: 'document', icon: FileSpreadsheet },

                  { label: 'TypeScript', ext: 'ts', type: 'code', icon: FileCode },

                  { label: 'JavaScript', ext: 'js', type: 'code', icon: Code2 },

                  { label: 'Python', ext: 'py', type: 'code', icon: Code2 },

                  { label: 'JSON Data', ext: 'json', type: 'code', icon: FileCode },

                ].map(tmpl => {

                  const isSelected = newFileExtension === tmpl.ext;

                  const Icon = tmpl.icon;

                  return (

                    <button

                      key={tmpl.ext}

                      type="button"

                      onClick={() => {

                        setNewFileExtension(tmpl.ext);

                        setNewFileType(tmpl.type as 'document' | 'code');

                      }}

                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${

                        isSelected

                          ? 'bg-sky-500/25 border-sky-400 text-white font-semibold shadow-md'

                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'

                      }`}

                    >

                      <Icon className="w-4 h-4 text-sky-400 flex-shrink-0" />

                      <div className="truncate">

                        <div className="text-xs truncate">{tmpl.label}</div>

                        <div className="text-[10px] text-slate-400 font-mono">.{tmpl.ext}</div>

                      </div>

                    </button>

                  );

                })}

              </div>

            </div>



            <div className="flex justify-end gap-2 pt-2">

              <button

                type="button"

                onClick={() => setShowNewFileModal(false)}

                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs cursor-pointer"

              >

                Cancel

              </button>

              <button

                type="button"

                onClick={handleCreateNewFile}

                className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-500/20 cursor-pointer"

              >

                Create File

              </button>

            </div>

          </div>

        </div>

      )}



      {/* App Features & Details Modal */}

      <AppFeaturesModal

        appId={featuresModalAppId}

        isOpen={!!featuresModalAppId}

        onClose={() => setFeaturesModalAppId(null)}

      />

    </div>

  );

};
