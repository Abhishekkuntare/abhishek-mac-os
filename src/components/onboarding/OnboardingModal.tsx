// import React, { useState, useRef } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import confetti from 'canvas-confetti';
// import {
//   ArrowRight,
//   Check,
//   Camera,
//   Upload,
//   User,
//   Sparkles,
//   Layers,
//   Palette,
//   Volume2,
//   VolumeX,
//   Eye,
//   Sliders,
//   Compass,
//   Monitor,
// } from 'lucide-react';
// import { useOS } from '../../context/OSContext';
// import { UserProfile, SystemSettings, AccentColor, ThemeMode } from '../../types/desktop';
// import { sound } from '../../services/soundService';

// // Cute cartoon / 3D character avatars.
// // These are self-contained SVG characters, so they work offline and don't
// // depend on external image hosts.
// type AvatarPreset = {
//   name: string;
//   url: string;
// };

// const createCartoonAvatar = ({
//   skin,
//   hair,
//   shirt,
//   pants,
//   shoes,
//   bg1,
//   bg2,
//   eye = '#172033',
//   accessory = 'none',
//   hairStyle = 'soft',
//   expression = 'smile',
// }: {
//   skin: string;
//   hair: string;
//   shirt: string;
//   pants: string;
//   shoes: string;
//   bg1: string;
//   bg2: string;
//   eye?: string;
//   accessory?: 'none' | 'cap' | 'bow' | 'headphones' | 'glasses' | 'crown' | 'flower';
//   hairStyle?: 'soft' | 'curly' | 'spiky' | 'bob' | 'bun' | 'fringe';
//   expression?: 'smile' | 'happy' | 'cool' | 'wink';
// }) => {
//   const hairSvg = {
//     soft: `
//       <path d="M77 116C67 72 96 37 148 37c50 0 82 31 77 80-2 17-8 28-17 39l-19-18-10 19-18-20-19 19-18-20-18 18-15-22-17 18c-8-10-12-20-14-35z" fill="${hair}"/>
//       <path d="M83 94c12-31 38-47 70-47 28 0 51 12 66 32-35-15-91-14-136 15z" fill="#fff" opacity=".10"/>
//     `,
//     curly: `
//       <g fill="${hair}">
//         <circle cx="91" cy="75" r="29"/><circle cx="121" cy="51" r="31"/>
//         <circle cx="154" cy="48" r="32"/><circle cx="187" cy="59" r="30"/>
//         <circle cx="211" cy="84" r="27"/><circle cx="82" cy="105" r="24"/>
//         <circle cx="218" cy="111" r="24"/>
//       </g>
//       <path d="M82 105c3-38 30-63 68-63 40 0 69 27 70 65l-16 38-21-18-15 19-20-20-19 19-18-21-21 20-15-23z" fill="${hair}"/>
//     `,
//     spiky: `
//       <path d="M73 111l10-53 18 23 9-38 25 27 19-39 12 40 33-28-3 37 35-11-19 35-4 36-29-20-13 24-21-22-21 22-15-25-25 20z" fill="${hair}"/>
//     `,
//     bob: `
//       <path d="M71 121c-2-51 29-82 78-82 48 0 80 31 79 82-1 29-12 48-31 60l-8-52H111l-9 52c-19-12-30-31-31-60z" fill="${hair}"/>
//       <path d="M78 96c17-31 43-44 76-44 28 0 52 10 68 30-42-11-95-7-144 14z" fill="#fff" opacity=".08"/>
//     `,
//     bun: `
//       <circle cx="211" cy="54" r="28" fill="${hair}"/>
//       <path d="M76 116c-4-49 27-78 73-78 48 0 80 30 78 78-1 20-8 34-20 47l-17-24-19 21-20-23-20 22-18-23-19 22-15-26c-7-6-11-11-13-16z" fill="${hair}"/>
//     `,
//     fringe: `
//       <path d="M72 113c0-47 31-76 78-76 48 0 79 29 79 76l-16 34-20-24-12 25-19-28-17 25-18-29-21 27-15-25-17 22z" fill="${hair}"/>
//       <path d="M78 101c18-30 45-45 75-45 31 0 54 13 70 35-40-11-91-8-145 10z" fill="#fff" opacity=".08"/>
//     `,
//   }[hairStyle];

//   const accessorySvg = {
//     none: '',
//     cap: `
//       <path d="M77 75c29-22 82-28 126-10l34 15-9 21c-47-17-99-17-148 2z" fill="${bg1}"/>
//       <path d="M104 68c34-14 76-13 108 2" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="6" stroke-linecap="round"/>
//     `,
//     bow: `
//       <path d="M105 75c-23-19-40-9-40 9 0 17 20 24 43 8z" fill="${bg1}"/>
//       <path d="M195 75c23-19 40-9 40 9 0 17-20 24-43 8z" fill="${bg1}"/>
//       <circle cx="150" cy="82" r="13" fill="${bg2}"/>
//     `,
//     headphones: `
//       <path d="M75 123c0-52 29-82 75-82s75 30 75 82" fill="none" stroke="${bg1}" stroke-width="12" stroke-linecap="round"/>
//       <rect x="61" y="119" width="25" height="48" rx="12" fill="${bg1}"/>
//       <rect x="214" y="119" width="25" height="48" rx="12" fill="${bg1}"/>
//       <circle cx="73" cy="143" r="6" fill="#fff" opacity=".25"/>
//       <circle cx="227" cy="143" r="6" fill="#fff" opacity=".25"/>
//     `,
//     glasses: `
//       <g fill="#182033" stroke="#fff" stroke-opacity=".25" stroke-width="3">
//         <rect x="89" y="112" width="49" height="31" rx="14"/>
//         <rect x="162" y="112" width="49" height="31" rx="14"/>
//         <path d="M138 123h24" fill="none"/>
//       </g>
//       <circle cx="116" cy="126" r="5" fill="#fff" opacity=".55"/>
//       <circle cx="189" cy="126" r="5" fill="#fff" opacity=".55"/>
//     `,
//     crown: `
//       <path d="M112 67l12-28 26 23 26-23 12 28z" fill="#facc15" stroke="#fff" stroke-opacity=".4" stroke-width="3"/>
//       <circle cx="124" cy="39" r="5" fill="#fff"/><circle cx="150" cy="62" r="5" fill="#fff"/>
//       <circle cx="176" cy="39" r="5" fill="#fff"/>
//     `,
//     flower: `
//       <g fill="${bg1}">
//         <circle cx="204" cy="72" r="13"/><circle cx="224" cy="72" r="13"/>
//         <circle cx="214" cy="57" r="13"/><circle cx="214" cy="87" r="13"/>
//       </g>
//       <circle cx="214" cy="72" r="9" fill="#facc15"/>
//     `,
//   }[accessory];

//   const eyes = expression === 'wink'
//     ? `
//       <ellipse cx="119" cy="139" rx="7" ry="4" fill="${eye}"/>
//       <ellipse cx="181" cy="139" rx="7" ry="10" fill="${eye}"/>
//       <circle cx="181" cy="136" r="3" fill="#fff"/>
//     `
//     : `
//       <ellipse cx="119" cy="139" rx="8" ry="11" fill="${eye}"/>
//       <ellipse cx="181" cy="139" rx="8" ry="11" fill="${eye}"/>
//       <circle cx="116" cy="135" r="3.5" fill="#fff"/>
//       <circle cx="178" cy="135" r="3.5" fill="#fff"/>
//     `;

//   const mouth = expression === 'happy'
//     ? `<path d="M130 165c11 16 29 16 40 0" fill="#fff" stroke="#8b4a45" stroke-width="4" stroke-linecap="round"/>`
//     : expression === 'cool'
//       ? `<path d="M137 166c8 5 18 5 26 0" fill="none" stroke="#8b4a45" stroke-width="5" stroke-linecap="round"/>`
//       : `<path d="M137 164c8 8 18 8 26 0" fill="none" stroke="#8b4a45" stroke-width="5" stroke-linecap="round"/>`;

//   const svg = `
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340">
//     <defs>
//       <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
//         <stop offset="0" stop-color="${bg1}"/>
//         <stop offset=".55" stop-color="${bg2}"/>
//         <stop offset="1" stop-color="#0b1020"/>
//       </linearGradient>
//       <radialGradient id="face" cx=".35" cy=".22" r=".8">
//         <stop offset="0" stop-color="#fff" stop-opacity=".26"/>
//         <stop offset=".25" stop-color="${skin}"/>
//         <stop offset="1" stop-color="${skin}"/>
//       </radialGradient>
//       <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
//         <stop offset="0" stop-color="${shirt}"/>
//         <stop offset="1" stop-color="${pants}"/>
//       </linearGradient>
//       <filter id="shadow">
//         <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".48"/>
//       </filter>
//     </defs>

//     <rect width="300" height="340" rx="78" fill="#080b14"/>
//     <rect x="9" y="9" width="282" height="322" rx="70" fill="url(#bg)"/>
//     <circle cx="66" cy="76" r="42" fill="#fff" opacity=".10"/>
//     <circle cx="238" cy="264" r="55" fill="#000" opacity=".10"/>

//     <g filter="url(#shadow)">
//       <!-- body -->
//       <path d="M55 330c4-61 36-91 95-91s91 30 95 91z" fill="url(#shirt)"/>
//       <path d="M117 243c8 18 20 28 33 28s25-10 33-28v-35h-66z" fill="url(#face)"/>

//       <!-- little collar -->
//       <path d="M117 244l33 27 33-27 16 18-49 37-49-37z" fill="#fff" opacity=".10"/>

//       <!-- head -->
//       <ellipse cx="150" cy="139" rx="78" ry="87" fill="url(#face)"/>

//       <!-- ears -->
//       <circle cx="76" cy="145" r="18" fill="${skin}"/>
//       <circle cx="224" cy="145" r="18" fill="${skin}"/>

//       <!-- hair -->
//       ${hairSvg}

//       <!-- eyebrows -->
//       <path d="M103 119c9-7 20-8 30-3M167 116c10-5 21-4 30 3"
//         fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/>

//       <!-- eyes -->
//       ${eyes}

//       <!-- cheeks -->
//       <ellipse cx="100" cy="164" rx="17" ry="9" fill="#ff8f9a" opacity=".28"/>
//       <ellipse cx="200" cy="164" rx="17" ry="9" fill="#ff8f9a" opacity=".28"/>

//       <!-- nose -->
//       <path d="M147 145c-3 9-3 14 4 16" fill="none" stroke="#a96758" stroke-width="4" stroke-linecap="round"/>

//       <!-- mouth -->
//       ${mouth}

//       <!-- tiny shirt emblem -->
//       <circle cx="150" cy="294" r="23" fill="#fff" opacity=".10"/>
//       <path d="M139 294l11-13 11 13-11 13z" fill="#fff" opacity=".75"/>

//       <!-- accessories -->
//       ${accessorySvg}
//     </g>

//     <circle cx="38" cy="275" r="5" fill="#fff" opacity=".45"/>
//     <circle cx="261" cy="94" r="4" fill="#fff" opacity=".5"/>
//     <circle cx="244" cy="113" r="2.5" fill="#fff" opacity=".35"/>
//   </svg>`;

//   return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
// };

// const PRESET_AVATARS: AvatarPreset[] = [
//   {
//     name: 'Sunny',
//     url: createCartoonAvatar({
//       skin: '#f2b28d',
//       hair: '#3a241c',
//       shirt: '#38bdf8',
//       pants: '#2563eb',
//       shoes: '#e0f2fe',
//       bg1: '#38bdf8',
//       bg2: '#6366f1',
//       hairStyle: 'soft',
//       accessory: 'cap',
//       expression: 'happy',
//     }),
//   },
//   {
//     name: 'Mimi',
//     url: createCartoonAvatar({
//       skin: '#f5c7a8',
//       hair: '#5b2d45',
//       shirt: '#f472b6',
//       pants: '#7c3aed',
//       shoes: '#fce7f3',
//       bg1: '#fb7185',
//       bg2: '#a855f7',
//       hairStyle: 'bob',
//       accessory: 'bow',
//       expression: 'smile',
//     }),
//   },
//   {
//     name: 'Bobo',
//     url: createCartoonAvatar({
//       skin: '#c98765',
//       hair: '#202938',
//       shirt: '#22d3ee',
//       pants: '#0f766e',
//       shoes: '#cffafe',
//       bg1: '#06b6d4',
//       bg2: '#2563eb',
//       hairStyle: 'spiky',
//       accessory: 'glasses',
//       expression: 'cool',
//     }),
//   },
//   {
//     name: 'Coco',
//     url: createCartoonAvatar({
//       skin: '#8d5b49',
//       hair: '#171717',
//       shirt: '#fb923c',
//       pants: '#ea580c',
//       shoes: '#ffedd5',
//       bg1: '#f97316',
//       bg2: '#db2777',
//       hairStyle: 'curly',
//       accessory: 'flower',
//       expression: 'happy',
//     }),
//   },
//   {
//     name: 'Lumi',
//     url: createCartoonAvatar({
//       skin: '#f0b18b',
//       hair: '#6b3e26',
//       shirt: '#a78bfa',
//       pants: '#4f46e5',
//       shoes: '#ede9fe',
//       bg1: '#8b5cf6',
//       bg2: '#ec4899',
//       hairStyle: 'bun',
//       accessory: 'crown',
//       expression: 'wink',
//     }),
//   },
//   {
//     name: 'Max',
//     url: createCartoonAvatar({
//       skin: '#d99a72',
//       hair: '#101827',
//       shirt: '#34d399',
//       pants: '#047857',
//       shoes: '#d1fae5',
//       bg1: '#10b981',
//       bg2: '#0ea5e9',
//       hairStyle: 'fringe',
//       accessory: 'headphones',
//       expression: 'happy',
//     }),
//   },
//   {
//     name: 'Piku',
//     url: createCartoonAvatar({
//       skin: '#efbd99',
//       hair: '#33211d',
//       shirt: '#facc15',
//       pants: '#ca8a04',
//       shoes: '#fef9c3',
//       bg1: '#f59e0b',
//       bg2: '#f43f5e',
//       hairStyle: 'soft',
//       accessory: 'flower',
//       expression: 'wink',
//     }),
//   },
//   {
//     name: 'Zoya',
//     url: createCartoonAvatar({
//       skin: '#a96d52',
//       hair: '#25182f',
//       shirt: '#c084fc',
//       pants: '#7e22ce',
//       shoes: '#f3e8ff',
//       bg1: '#a855f7',
//       bg2: '#4f46e5',
//       hairStyle: 'curly',
//       accessory: 'headphones',
//       expression: 'smile',
//     }),
//   },
// ];

// const ROLES_LIST = [
//   'Developer',
//   'Designer',
//   'Engineer',
//   'Artist',
//   'Creator',
//   'Student',
//   'Entrepreneur',
//   'Photographer',
//   'Video Editor',
//   'Musician',
//   'Writer',
//   'Researcher',
//   'Gamer',
//   'Freelancer',
//   'Business Owner',
// ];

// const getRoleEmoji = (role: string) => {
//   const value = role.toLowerCase();

//   if (value.includes('engineer') || value.includes('developer') || value.includes('coding')) {
//     return '👨‍💻';
//   }

//   if (value.includes('designer') || value.includes('ui') || value.includes('ux')) {
//     return '🎨';
//   }

//   if (value.includes('artist') || value.includes('drawing') || value.includes('illustr')) {
//     return '🖌️';
//   }

//   if (value.includes('writer') || value.includes('content')) {
//     return '✍️';
//   }

//   if (value.includes('student')) {
//     return '🎓';
//   }

//   if (value.includes('business') || value.includes('entrepreneur')) {
//     return '🚀';
//   }

//   if (value.includes('manager') || value.includes('leader')) {
//     return '🧠';
//   }

//   if (value.includes('photograph') || value.includes('photo')) {
//     return '📸';
//   }

//   if (value.includes('music') || value.includes('artist')) {
//     return '🎵';
//   }

//   if (value.includes('video') || value.includes('creator')) {
//     return '🎬';
//   }

//   if (value.includes('developer') || value.includes('software')) {
//     return '💻';
//   }

//   if (value.includes('security') || value.includes('cyber')) {
//     return '🛡️';
//   }

//   if (value.includes('network')) {
//     return '🌐';
//   }

//   if (value.includes('ai') || value.includes('machine')) {
//     return '🤖';
//   }

//   if (value.includes('data')) {
//     return '📊';
//   }

//   if (value.includes('cloud')) {
//     return '☁️';
//   }

//   if (value.includes('marketing')) {
//     return '📣';
//   }

//   if (value.includes('teacher') || value.includes('education')) {
//     return '📚';
//   }

//   if (value.includes('chef') || value.includes('food')) {
//     return '👨‍🍳';
//   }

//   if (value.includes('gaming') || value.includes('gamer')) {
//     return '🎮';
//   }

//   return '✨';
// };


// const getRoleDescription = (role: string) => {
//   const value = role.toLowerCase();

//   if (value.includes('engineer') || value.includes('developer')) {
//     return 'Build & create';
//   }

//   if (value.includes('designer') || value.includes('ui') || value.includes('ux')) {
//     return 'Design & imagine';
//   }

//   if (value.includes('artist')) {
//     return 'Create & express';
//   }

//   if (value.includes('student')) {
//     return 'Learn & explore';
//   }

//   if (value.includes('business') || value.includes('entrepreneur')) {
//     return 'Build & lead';
//   }

//   if (value.includes('security') || value.includes('cyber')) {
//     return 'Protect & secure';
//   }

//   if (value.includes('network')) {
//     return 'Connect & manage';
//   }

//   if (value.includes('ai') || value.includes('machine')) {
//     return 'Innovate & automate';
//   }

//   if (value.includes('music')) {
//     return 'Create & perform';
//   }

//   if (value.includes('photograph')) {
//     return 'Capture moments';
//   }

//   if (value.includes('video') || value.includes('creator')) {
//     return 'Create & share';
//   }

//   return 'Make something great';
// };

// const ACCENT_COLORS: { id: AccentColor; label: string; color: string }[] = [
//   { id: 'blue', label: 'Blue', color: '#3b82f6' },
//   { id: 'purple', label: 'Purple', color: '#a855f7' },
//   { id: 'pink', label: 'Pink', color: '#ec4899' },
//   { id: 'orange', label: 'Orange', color: '#f97316' },
//   { id: 'green', label: 'Green', color: '#22c55e' },
//   { id: 'cyan', label: 'Cyan', color: '#06b6d4' },
// ];

// export const OnboardingModal: React.FC = () => {
//   const { finishOnboarding } = useOS();
//   const [step, setStep] = useState(1);

//   // Draft profile
//   const [profile, setProfile] = useState<UserProfile>({
//     fullName: '',
//     displayName: '',
//     username: '',
//     email: '',
//     avatarUrl: '',
//     avatarType: 'initials',
//     roles: ['Developer'],
//     bio: 'Architecting Abhishek OS — a desktop experience built for you.',
//     pin: '',
//   });

//   // Draft settings
//   const [langSettings, setLangSettings] = useState({
//     language: 'English',
//     region: 'India',
//   });

//   const [personalization, setPersonalization] = useState<{
//     theme: ThemeMode;
//     accent: AccentColor;
//     uiStyle: 'balanced' | 'compact' | 'spacious';
//     animationLevel: 'full' | 'reduced' | 'minimal';
//     soundEffects: boolean;
//     glassEffects: boolean;
//     liveWallpapers: boolean;
//   }>({
//     theme: 'dark',
//     accent: 'blue',
//     uiStyle: 'balanced',
//     animationLevel: 'full',
//     soundEffects: true,
//     glassEffects: true,
//     liveWallpapers: true,
//   });

//   // Webcam stream
//   const [isCapturingWebcam, setIsCapturingWebcam] = useState(false);
//   const videoRef = useRef<HTMLVideoElement | null>(null);

//   const startWebcam = async () => {
//     try {
//       setIsCapturingWebcam(true);
//       const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         videoRef.current.play();
//       }
//     } catch {
//       alert('Camera access not granted or camera not available.');
//       setIsCapturingWebcam(false);
//     }
//   };

//   const capturePhoto = () => {
//     if (!videoRef.current) return;
//     const canvas = document.createElement('canvas');
//     canvas.width = videoRef.current.videoWidth || 320;
//     canvas.height = videoRef.current.videoHeight || 320;
//     const ctx = canvas.getContext('2d');
//     if (ctx) {
//       ctx.drawImage(videoRef.current, 0, 0);
//       const dataUrl = canvas.toDataURL('image/jpeg');
//       setProfile(p => ({ ...p, avatarUrl: dataUrl, avatarType: 'upload' }));
//       sound.playShutter();
//     }
//     // stop stream
//     const stream = videoRef.current.srcObject as MediaStream;
//     stream?.getTracks().forEach(track => track.stop());
//     setIsCapturingWebcam(false);
//   };

//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = () => {
//       if (typeof reader.result === 'string') {
//         setProfile(p => ({ ...p, avatarUrl: reader.result as string, avatarType: 'upload' }));
//         sound.playClick();
//       }
//     };
//     reader.readAsDataURL(file);
//   };

//   const toggleRole = (role: string) => {
//     sound.playClick();
//     setProfile(p => {
//       const exists = p.roles.includes(role);
//       const updated = exists ? p.roles.filter(r => r !== role) : [...p.roles, role];
//       return { ...p, roles: updated };
//     });
//   };

// const handleNext = () => {
//   sound.playClick();

//   // Validate Step 3 - Create User Profile
//   if (step === 3) {
//     const email = profile.email.trim();

//     if (!email) {
//       setEmailError('Email is required');
//       return;
//     }

//     const emailRegex =
//       /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

//     if (!emailRegex.test(email) || email.includes('..')) {
//       setEmailError('Please enter a valid email address');
//       return;
//     }

//     // Clear any previous error
//     setEmailError('');
//   }

//   if (step < 6) {
//     setStep(s => s + 1);
//   } else {
//     // Complete!
//     try {
//       confetti({
//         particleCount: 120,
//         spread: 70,
//         origin: { y: 0.6 },
//       });
//     } catch {}

//     finishOnboarding(profile, {
//       ...langSettings,
//       ...personalization,
//     });
//   }
// };

//   const [emailError, setEmailError] = useState('');

// const validateEmail = (email: string) => {
//   const value = email.trim();

//   if (!value) {
//     return 'Email is required';
//   }

//   // Practical email validation:
//   const emailRegex =
//     /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

//   if (!emailRegex.test(value)) {
//     return 'Please enter a valid email address';
//   }

//   // Prevent consecutive dots
//   if (value.includes('..')) {
//     return 'Please enter a valid email address';
//   }

//   return '';
// };

//   return (
//     <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 select-none font-sans overflow-hidden">
//       {/* Background ambient light */}
//       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//         <motion.div
//           animate={{
//             scale: [1, 1.25, 1],
//             opacity: [0.35, 0.55, 0.35],
//           }}
//           transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
//           className="w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-600/30 via-indigo-600/25 to-pink-600/20 blur-[130px]"
//         />
//       </div>

//       {/* Modal Container */}
//       <div className="relative z-10 w-full max-w-2xl min-h-[520px] rounded-3xl glass-panel text-white p-8 shadow-2xl border border-white/20 flex flex-col justify-between">
//         {/* Step Indicator */}
//         <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
//           <div className="flex items-center gap-2">
//             <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
//               <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm0 6l2.3 5.5h-4.6L12 8z" />
//             </svg>
//             <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
//               Abhishek OS
//             </span>
//           </div>
//           <div className="flex items-center gap-1.5">
//             {[1, 2, 3, 4, 5, 6].map(i => (
//               <div
//                 key={i}
//                 className={`w-2.5 h-1.5 rounded-full transition-all duration-300 ${
//                   i === step ? 'w-6 bg-sky-400' : i < step ? 'bg-white/60' : 'bg-white/20'
//                 }`}
//               />
//             ))}
//           </div>
//         </div>

//         {/* Content Screens */}
//         <div className="flex-1 flex flex-col justify-center">
//           <AnimatePresence mode="wait">
//             {/* Screen 1: Welcome / Brand Hook */}
//             {step === 1 && (
//               <motion.div
//                 key="step-1"
//                 initial={{ opacity: 0, y: 15 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -15 }}
//                 className="text-center py-6"
//               >
//                 <motion.div
//                   initial={{ scale: 0.9, opacity: 0 }}
//                   animate={{ scale: 1, opacity: 1 }}
//                   transition={{ duration: 0.6 }}
//                   className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-pink-500 flex items-center justify-center shadow-2xl shadow-sky-500/40 p-0.5"
//                 >
//                   <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
//                     <svg className="w-12 h-12 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
//                       <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm0 6l2.3 5.5h-4.6L12 8z" />
//                     </svg>
//                   </div>
//                 </motion.div>

//                 <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
//                   ABHISHEK OS
//                 </h1>
//                 <p className="text-base text-slate-300 font-medium">
//                   Welcome to a different desktop.
//                 </p>
//                 <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
//                   A desktop experience built for you by Abhishek Kuntare. Inspired by modern desktop
//                   operating systems with fluid glass, windowing, and native applications.
//                 </p>
//               </motion.div>
//             )}

//             {/* Screen 2: Language / Region */}
//             {step === 2 && (
//               <motion.div
//                 key="step-2"
//                 initial={{ opacity: 0, y: 15 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -15 }}
//                 className="py-4"
//               >
//                 <h2 className="text-2xl font-bold mb-1">Let&apos;s get Abhishek OS ready for you.</h2>
//                 <p className="text-xs text-slate-400 mb-6">Select your primary language and regional formatting.</p>

//                 <div className="grid grid-cols-2 gap-6">
//                   <div>
//                     <label className="block text-xs font-semibold text-slate-300 mb-2">Language</label>
//                     <div className="space-y-2">
//                       {['English', 'Hindi', 'Marathi'].map(lang => (
//                         <div
//                           key={lang}
//                           onClick={() => setLangSettings(s => ({ ...s, language: lang }))}
//                           className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
//                             langSettings.language === lang
//                               ? 'bg-sky-500/20 border-sky-400 text-white'
//                               : 'bg-white/5 border-white/10 hover:bg-white/10'
//                           }`}
//                         >
//                           <span className="text-sm font-medium">{lang}</span>
//                           {langSettings.language === lang && <Check className="w-4 h-4 text-sky-400" />}
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   <div>
//                     <label className="block text-xs font-semibold text-slate-300 mb-2">Region</label>
//                     <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
//                       {['India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Other'].map(
//                         reg => (
//                           <div
//                             key={reg}
//                             onClick={() => setLangSettings(s => ({ ...s, region: reg }))}
//                             className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
//                               langSettings.region === reg
//                                 ? 'bg-sky-500/20 border-sky-400 text-white'
//                                 : 'bg-white/5 border-white/10 hover:bg-white/10'
//                             }`}
//                           >
//                             <span className="text-sm font-medium">{reg}</span>
//                             {langSettings.region === reg && <Check className="w-4 h-4 text-sky-400" />}
//                           </div>
//                         )
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* Screen 3: Create User Profile */}
//             {step === 3 && (
//               <motion.div
//                 key="step-3"
//                 initial={{ opacity: 0, y: 15 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -15 }}
//                 className="py-2"
//               >
//                 <h2 className="text-2xl font-bold mb-1">Who are you?</h2>
//                 <p className="text-xs text-slate-400 mb-4">Set up your personal local user account.</p>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
//                   {/* Avatar Picker / Live Preview */}
//                   <div className="flex flex-col items-center">
//                     <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-sky-400/80 shadow-xl relative bg-slate-800 flex items-center justify-center">
//                       {isCapturingWebcam ? (
//                         <video ref={videoRef} className="w-full h-full object-cover" />
//                       ) : profile.avatarUrl ? (
//                         <img
//                           src={profile.avatarUrl}
//                           alt="Avatar"
//                           className="w-full h-full object-cover"
//                         />
//                       ) : (
//                         <span className="text-3xl font-extrabold text-sky-400">
//                           {profile.fullName ? profile.fullName.charAt(0) : 'A'}
//                         </span>
//                       )}
//                     </div>

//                     {isCapturingWebcam ? (
//                       <button
//                         onClick={capturePhoto}
//                         className="mt-2.5 px-3 py-1 bg-sky-500 hover:bg-sky-600 text-xs font-bold rounded-lg transition-colors"
//                       >
//                         Snap Photo
//                       </button>
//                     ) : (
//                       <div className="flex items-center gap-2 mt-3">
//                         <button
//                           onClick={startWebcam}
//                           className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
//                           title="Take Photo with Camera"
//                         >
//                           <Camera className="w-4 h-4 text-sky-400" />
//                         </button>
//                         <label className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
//                           <Upload className="w-4 h-4 text-purple-400" />
//                           <input
//                             type="file"
//                             accept="image/*"
//                             onChange={handleFileUpload}
//                             className="hidden"
//                           />
//                         </label>
//                       </div>
//                     )}

//                     {/* Cute Cartoon Avatar Studio */}
//                     <div className="mt-4 w-full">
//                       <div className="flex items-center justify-between mb-2.5">
//                         <div>
//                           <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
//                             Choose your character
//                           </div>
//                           <div className="text-[9px] text-slate-500 mt-0.5">
//                             Cute cartoon avatars
//                           </div>
//                         </div>
//                         <span className="px-2 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 text-[9px] font-bold text-sky-300">
//                           3D
//                         </span>
//                       </div>

//                       <div className="grid grid-cols-4 gap-2">
//                         {PRESET_AVATARS.map((avatar, i) => {
//                           const isSelected =
//                             profile.avatarType === 'preset' &&
//                             profile.avatarUrl === avatar.url;

//                           return (
//                             <motion.button
//                               key={avatar.name}
//                               type="button"
//                               title={`Choose ${avatar.name}`}
//                               onClick={() => {
//                                 setProfile(p => ({
//                                   ...p,
//                                   avatarUrl: avatar.url,
//                                   avatarType: 'preset',
//                                 }));
//                                 sound.playClick();
//                               }}
//                               whileHover={{
//                                 y: -6,
//                                 scale: 1.05,
//                                 rotate: i % 2 === 0 ? -1.5 : 1.5,
//                               }}
//                               whileTap={{ scale: 0.92 }}
//                               className={`group relative rounded-2xl p-1 transition-all ${
//                                 isSelected
//                                   ? 'bg-gradient-to-br from-sky-300 via-indigo-400 to-fuchsia-400 shadow-[0_10px_30px_rgba(56,189,248,0.28)]'
//                                   : 'bg-white/[0.07] hover:bg-white/[0.13]'
//                               }`}
//                             >
//                               <div className="relative aspect-square overflow-hidden rounded-[14px] bg-slate-950">
//                                 <img
//                                   src={avatar.url}
//                                   alt={`${avatar.name} cartoon avatar`}
//                                   className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
//                                 />

//                                 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-5 pb-1">
//                                   <span className="text-[8px] font-extrabold text-white">
//                                     {avatar.name}
//                                   </span>
//                                 </div>

//                                 {isSelected && (
//                                   <motion.div
//                                     initial={{ scale: 0, rotate: -30 }}
//                                     animate={{ scale: 1, rotate: 0 }}
//                                     className="absolute right-1 top-1 w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-950"
//                                   >
//                                     <Check className="w-3 h-3" strokeWidth={4} />
//                                   </motion.div>
//                                 )}
//                               </div>
//                             </motion.button>
//                           );
//                         })}
//                       </div>

//                       <div className="flex items-center justify-center gap-2 mt-2.5">
//                         <span className="w-1 h-1 rounded-full bg-sky-400" />
//                         <span className="text-[9px] text-slate-500">
//                           Or take a photo / upload your own avatar
//                         </span>
//                         <span className="w-1 h-1 rounded-full bg-purple-400" />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Form fields */}
//                   <div className="md:col-span-2 space-y-3 text-xs">
//                     <div>
//                       <label className="font-semibold text-slate-300 block mb-1">Full Name</label>
//                       <input
//                       placeholder='your name'
//                         type="text"
//                         value={profile.fullName}
//                         onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
//                         className="w-full p-2.5 rounded-xl bg-white/10 border border-white/15 outline-none focus:border-sky-400 text-white font-medium"
//                       />
//                     </div>

//                     <div className="grid grid-cols-2 gap-3">
//                       <div>
//                         <label className="font-semibold text-slate-300 block mb-1">Display Name</label>
//                         <input
//                               placeholder='you display name'
//                           type="text"
//                           value={profile.displayName}
//                           onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
//                           className="w-full p-2.5 rounded-xl bg-white/10 border border-white/15 outline-none focus:border-sky-400 text-white font-medium"
//                         />
//                       </div>
//                       <div>
//                         <label className="font-semibold text-slate-300 block mb-1">Username</label>
//                         <input
//                               placeholder='your username'
//                           type="text"
//                           value={profile.username}
//                           onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
//                           className="w-full p-2.5 rounded-xl bg-white/10 border border-white/15 outline-none focus:border-sky-400 text-white font-medium"
//                         />
//                       </div>
//                     </div>

//                   <div>
//   <label className="font-semibold text-slate-300 block mb-1">
//     Email
//   </label>

//   <input
//     placeholder="your@email.com"
//     type="email"
//     value={profile.email}
//     required
//     autoComplete="email"
//     onChange={(e) => {
//       const value = e.target.value.replace(/\s/g, '');

//       setProfile((p) => ({
//         ...p,
//         email: value,
//       }));

//       // Clear error while user is correcting the email
//       if (emailError) {
//         setEmailError(validateEmail(value));
//       }
//     }}
//     onBlur={() => {
//       setEmailError(validateEmail(profile.email));
//     }}
//     className={`w-full p-2.5 rounded-xl bg-white/10 border outline-none text-white font-medium transition-colors ${
//       emailError
//         ? 'border-red-500/80 focus:border-red-500'
//         : 'border-white/15 focus:border-sky-400'
//     }`}
//   />

//   {emailError && (
//     <p className="mt-1.5 text-[11px] font-medium text-red-400">
//       {emailError}
//     </p>
//   )}
// </div>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//          {/* Screen 4: Passion / Role Setup */}
// {step === 4 && (
//   <motion.div
//     key="step-4"
//     initial={{ opacity: 0, scale: 0.96, y: 20 }}
//     animate={{ opacity: 1, scale: 1, y: 0 }}
//     exit={{ opacity: 0, scale: 0.96, y: -20 }}
//     transition={{ duration: 0.35, ease: 'easeOut' }}
//     className="py-2 relative"
//   >
//     {/* Ambient 3D background glow */}
//     <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-40 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
//     <div className="absolute top-32 -right-20 w-40 h-40 bg-purple-500/10 blur-[70px] rounded-full pointer-events-none" />

//     {/* Header */}
//     <div className="relative flex items-start justify-between gap-4 mb-5">
//       <div>
//         <motion.div
//           initial={{ opacity: 0, x: -15 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ delay: 0.08 }}
//         >
//           <div className="flex items-center gap-2 mb-2">
//             <motion.div
//               animate={{
//                 rotate: [0, -8, 8, 0],
//                 y: [0, -2, 0],
//               }}
//               transition={{
//                 duration: 3,
//                 repeat: Infinity,
//                 ease: 'easeInOut',
//               }}
//               className="
//                 w-9 h-9
//                 rounded-2xl
//                 flex items-center justify-center
//                 bg-gradient-to-br
//                 from-sky-400
//                 via-blue-500
//                 to-indigo-600
//                 shadow-[0_8px_25px_rgba(56,189,248,0.35)]
//                 border border-white/20
//               "
//             >
//               <Sparkles className="w-4 h-4 text-white" />
//             </motion.div>

//             <span className="text-[9px] uppercase tracking-[0.2em] font-black text-sky-400">
//               Identity
//             </span>
//           </div>

//           <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
//             What do you do?
//           </h2>

//           <p className="text-xs text-slate-400 mt-1 max-w-md">
//             Tell Abhishek OS what inspires you.
//             <span className="text-slate-500"> Select everything that feels like you.</span>
//           </p>
//         </motion.div>
//       </div>

//       {/* Selected counter */}
//       <motion.div
//         layout
//         className="
//           shrink-0
//           min-w-[72px]
//           px-3 py-2
//           rounded-2xl
//           bg-white/[0.06]
//           border border-white/10
//           backdrop-blur-xl
//           text-center
//           shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
//         "
//       >
//         <motion.div
//           key={profile.roles.length}
//           initial={{ scale: 1.5, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           className="text-lg font-black text-white"
//         >
//           {profile.roles.length}
//         </motion.div>

//         <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
//           Selected
//         </div>
//       </motion.div>
//     </div>

//     {/* Selected role chips */}
//     <AnimatePresence mode="popLayout">
//       {profile.roles.length > 0 && (
//         <motion.div
//           initial={{ opacity: 0, height: 0, y: -5 }}
//           animate={{ opacity: 1, height: 'auto', y: 0 }}
//           exit={{ opacity: 0, height: 0, y: -5 }}
//           className="mb-4 overflow-hidden"
//         >
//           <div className="flex items-center gap-2 mb-2">
//             <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
//               Your passions
//             </div>

//             <div className="h-px flex-1 bg-white/[0.06]" />
//           </div>

//           <div className="flex flex-wrap gap-1.5">
//             {profile.roles.map((role) => (
//               <motion.button
//                 key={role}
//                 layout
//                 initial={{ opacity: 0, scale: 0.7, y: 8 }}
//                 animate={{ opacity: 1, scale: 1, y: 0 }}
//                 exit={{ opacity: 0, scale: 0.7 }}
//                 whileHover={{ scale: 1.04 }}
//                 whileTap={{ scale: 0.94 }}
//                 onClick={() => toggleRole(role)}
//                 className="
//                   group
//                   inline-flex items-center gap-1.5
//                   px-2.5 py-1.5
//                   rounded-xl
//                   bg-sky-400/10
//                   border border-sky-400/25
//                   text-[9px]
//                   font-bold
//                   text-sky-200
//                   shadow-[0_4px_15px_rgba(56,189,248,0.08)]
//                   hover:bg-sky-400/15
//                   transition-colors
//                 "
//               >
//                 <span>{getRoleEmoji(role)}</span>
//                 <span>{role}</span>

//                 <span className="ml-0.5 text-sky-400/60 group-hover:text-red-400 transition-colors">
//                   ×
//                 </span>
//               </motion.button>
//             ))}
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>

//     {/* Role cards */}
//     <div
//       className="
//         relative
//         grid
//         grid-cols-2
//         sm:grid-cols-3
//         lg:grid-cols-5
//         gap-2.5
//         max-h-[330px]
//         overflow-y-auto
//         p-2
//         -mx-2
//         scrollbar-thin
//         scrollbar-thumb-white/10
//         scrollbar-track-transparent
//       "
//     >
//       {ROLES_LIST.map((role, index) => {
//         const isSelected = profile.roles.includes(role);

//         return (
//           <motion.button
//             key={role}
//             type="button"
//             onClick={() => toggleRole(role)}
//             initial={{
//               opacity: 0,
//               y: 18,
//               scale: 0.92,
//             }}
//             animate={{
//               opacity: 1,
//               y: 0,
//               scale: isSelected ? 1.02 : 1,
//             }}
//             transition={{
//               delay: Math.min(index * 0.025, 0.35),
//               duration: 0.28,
//               ease: 'easeOut',
//             }}
//             whileHover={{
//               y: -6,
//               scale: 1.035,
//             }}
//             whileTap={{
//               scale: 0.94,
//             }}
//             className={`
//               group
//               relative
//               min-h-[92px]
//               rounded-[22px]
//               p-[1px]
//               text-left
//               overflow-hidden
//               transition-all
//               duration-300
//               focus:outline-none
//               ${
//                 isSelected
//                   ? `
//                     bg-gradient-to-br
//                     from-sky-300
//                     via-sky-500
//                     to-indigo-600
//                     shadow-[0_14px_35px_rgba(56,189,248,0.25)]
//                   `
//                   : `
//                     bg-white/[0.08]
//                     hover:bg-white/[0.14]
//                     shadow-[0_10px_25px_rgba(0,0,0,0.15)]
//                   `
//               }
//             `}
//           >
//             {/* Inner 3D card */}
//             <div
//               className={`
//                 relative
//                 h-full
//                 min-h-[90px]
//                 rounded-[21px]
//                 overflow-hidden
//                 ${
//                   isSelected
//                     ? 'bg-[#0b1424]'
//                     : 'bg-gradient-to-br from-white/[0.08] to-white/[0.025]'
//                 }
//               `}
//             >
//               {/* Top glass reflection */}
//               <div
//                 className="
//                   absolute
//                   inset-x-0
//                   top-0
//                   h-1/2
//                   bg-gradient-to-b
//                   from-white/[0.07]
//                   to-transparent
//                   pointer-events-none
//                 "
//               />

//               {/* Decorative 3D orb */}
//               <motion.div
//                 animate={
//                   isSelected
//                     ? {
//                         scale: [1, 1.12, 1],
//                         opacity: [0.15, 0.28, 0.15],
//                       }
//                     : {
//                         scale: [1, 1.04, 1],
//                         opacity: [0.07, 0.12, 0.07],
//                       }
//                 }
//                 transition={{
//                   duration: isSelected ? 2.4 : 4,
//                   repeat: Infinity,
//                   ease: 'easeInOut',
//                 }}
//                 className={`
//                   absolute
//                   -right-7
//                   -top-7
//                   w-20
//                   h-20
//                   rounded-full
//                   blur-2xl
//                   pointer-events-none
//                   ${
//                     isSelected
//                       ? 'bg-sky-400'
//                       : 'bg-indigo-400'
//                   }
//                 `}
//               />

//               {/* Card content */}
//               <div className="relative h-full flex flex-col justify-between p-3">
//                 <div className="flex items-start justify-between gap-2">
//                   {/* Emoji / 3D icon */}
//                   <motion.div
//                     animate={
//                       isSelected
//                         ? {
//                             y: [0, -3, 0],
//                             rotate: [0, -3, 3, 0],
//                           }
//                         : {
//                             y: [0, -1, 0],
//                           }
//                     }
//                     transition={{
//                       duration: isSelected ? 2 : 3,
//                       repeat: Infinity,
//                       ease: 'easeInOut',
//                     }}
//                     className={`
//                       w-10
//                       h-10
//                       rounded-2xl
//                       flex
//                       items-center
//                       justify-center
//                       text-xl
//                       select-none
//                       ${
//                         isSelected
//                           ? `
//                             bg-gradient-to-br
//                             from-sky-300/25
//                             to-indigo-500/20
//                             border border-sky-300/25
//                             shadow-[0_8px_20px_rgba(56,189,248,0.15)]
//                           `
//                           : `
//                             bg-white/[0.07]
//                             border border-white/10
//                           `
//                       }
//                     `}
//                   >
//                     {getRoleEmoji(role)}
//                   </motion.div>

//                   {/* Selection indicator */}
//                   <motion.div
//                     initial={false}
//                     animate={{
//                       scale: isSelected ? 1 : 0.8,
//                       opacity: isSelected ? 1 : 0.45,
//                     }}
//                     className={`
//                       w-5
//                       h-5
//                       rounded-full
//                       flex
//                       items-center
//                       justify-center
//                       border
//                       ${
//                         isSelected
//                           ? 'bg-sky-400 border-sky-300 text-slate-950'
//                           : 'bg-white/[0.04] border-white/10 text-transparent'
//                       }
//                     `}
//                   >
//                     <Check
//                       className="w-3 h-3"
//                       strokeWidth={4}
//                     />
//                   </motion.div>
//                 </div>

//                 {/* Role name */}
//                 <div className="mt-3">
//                   <div
//                     className={`
//                       text-[11px]
//                       font-extrabold
//                       leading-tight
//                       truncate
//                       ${
//                         isSelected
//                           ? 'text-white'
//                           : 'text-slate-200'
//                       }
//                     `}
//                   >
//                     {role}
//                   </div>

//                   <div
//                     className={`
//                       mt-1
//                       text-[8px]
//                       font-medium
//                       ${
//                         isSelected
//                           ? 'text-sky-300/80'
//                           : 'text-slate-500'
//                       }
//                     `}
//                   >
//                     {getRoleDescription(role)}
//                   </div>
//                 </div>
//               </div>

//               {/* Selected bottom glow */}
//               <AnimatePresence>
//                 {isSelected && (
//                   <motion.div
//                     initial={{ scaleX: 0, opacity: 0 }}
//                     animate={{ scaleX: 1, opacity: 1 }}
//                     exit={{ scaleX: 0, opacity: 0 }}
//                     className="
//                       absolute
//                       bottom-0
//                       left-3
//                       right-3
//                       h-[2px]
//                       rounded-full
//                       bg-gradient-to-r
//                       from-transparent
//                       via-sky-300
//                       to-transparent
//                     "
//                   />
//                 )}
//               </AnimatePresence>
//             </div>
//           </motion.button>
//         );
//       })}
//     </div>

//     {/* Bottom helper */}
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ delay: 0.45 }}
//       className="
//         mt-4
//         flex
//         items-center
//         justify-between
//         px-3
//         py-2.5
//         rounded-2xl
//         bg-white/[0.035]
//         border border-white/[0.07]
//         backdrop-blur-xl
//       "
//     >
//       <div className="flex items-center gap-2">
//         <div className="
//           w-7
//           h-7
//           rounded-xl
//           bg-purple-500/10
//           border border-purple-400/15
//           flex
//           items-center
//           justify-center
//         ">
//           <Sparkles className="w-3.5 h-3.5 text-purple-300" />
//         </div>

//         <div>
//           <div className="text-[9px] font-bold text-slate-300">
//             Build your OS identity
//           </div>
//           <div className="text-[8px] text-slate-500">
//             You can choose more than one
//           </div>
//         </div>
//       </div>

//       {profile.roles.length === 0 ? (
//         <span className="text-[8px] text-slate-600 font-semibold">
//           Choose a passion
//         </span>
//       ) : (
//         <motion.span
//           initial={{ scale: 0.8 }}
//           animate={{ scale: 1 }}
//           className="
//             px-2.5
//             py-1
//             rounded-full
//             bg-emerald-400/10
//             border border-emerald-400/20
//             text-[8px]
//             font-bold
//             text-emerald-300
//           "
//         >
//           Ready ✓
//         </motion.span>
//       )}
//     </motion.div>
//   </motion.div>
// )}

//             {/* Screen 5: Personalization */}
//             {step === 5 && (
//               <motion.div
//                 key="step-5"
//                 initial={{ opacity: 0, y: 15 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -15 }}
//                 className="py-2 space-y-4"
//               >
//                 <div>
//                   <h2 className="text-2xl font-bold mb-1">Make it yours.</h2>
//                   <p className="text-xs text-slate-400">Tailor the visual system and feel.</p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 text-xs">
//                   {/* Appearance */}
//                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
//                     <label className="font-semibold block mb-2 text-slate-300">Appearance</label>
//                     <div className="grid grid-cols-3 gap-2">
//                       {(['dark', 'light', 'auto'] as ThemeMode[]).map(mode => (
//                         <button
//                           key={mode}
//                           onClick={() => setPersonalization(p => ({ ...p, theme: mode }))}
//                           className={`p-2 rounded-xl capitalize font-medium transition-colors ${
//                             personalization.theme === mode
//                               ? 'bg-sky-500 text-white font-bold'
//                               : 'bg-white/10 text-slate-300 hover:bg-white/15'
//                           }`}
//                         >
//                           {mode}
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Accent Color */}
//                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
//                     <label className="font-semibold block mb-2 text-slate-300">Accent Color</label>
//                     <div className="flex items-center gap-2">
//                       {ACCENT_COLORS.map(acc => (
//                         <div
//                           key={acc.id}
//                           onClick={() => setPersonalization(p => ({ ...p, accent: acc.id }))}
//                           className={`w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-transform ${
//                             personalization.accent === acc.id ? 'scale-125 ring-2 ring-white' : ''
//                           }`}
//                           style={{ background: acc.color }}
//                         >
//                           {personalization.accent === acc.id && <Check className="w-3.5 h-3.5 text-white" />}
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* UI Style */}
//                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
//                     <label className="font-semibold block mb-2 text-slate-300">UI Density</label>
//                     <div className="grid grid-cols-3 gap-2">
//                       {(['balanced', 'compact', 'spacious'] as const).map(style => (
//                         <button
//                           key={style}
//                           onClick={() => setPersonalization(p => ({ ...p, uiStyle: style }))}
//                           className={`p-2 rounded-xl capitalize font-medium transition-colors ${
//                             personalization.uiStyle === style
//                               ? 'bg-sky-500 text-white font-bold'
//                               : 'bg-white/10 text-slate-300 hover:bg-white/15'
//                           }`}
//                         >
//                           {style}
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Features Toggles */}
//                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
//                     <div
//                       onClick={() =>
//                         setPersonalization(p => ({ ...p, soundEffects: !p.soundEffects }))
//                       }
//                       className="flex items-center justify-between cursor-pointer"
//                     >
//                       <span className="font-medium text-slate-300">Sound Effects</span>
//                       <span
//                         className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
//                           personalization.soundEffects
//                             ? 'bg-emerald-500/20 text-emerald-300'
//                             : 'bg-white/10 text-slate-400'
//                         }`}
//                       >
//                         {personalization.soundEffects ? 'ON' : 'OFF'}
//                       </span>
//                     </div>

//                     <div
//                       onClick={() =>
//                         setPersonalization(p => ({ ...p, liveWallpapers: !p.liveWallpapers }))
//                       }
//                       className="flex items-center justify-between cursor-pointer"
//                     >
//                       <span className="font-medium text-slate-300">Live Wallpapers</span>
//                       <span
//                         className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
//                           personalization.liveWallpapers
//                             ? 'bg-sky-500/20 text-sky-300'
//                             : 'bg-white/10 text-slate-400'
//                         }`}
//                       >
//                         {personalization.liveWallpapers ? 'ON' : 'OFF'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* Screen 6: Desktop Introduction & Finish */}
//             {step === 6 && (
//               <motion.div
//                 key="step-6"
//                 initial={{ opacity: 0, y: 15 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -15 }}
//                 className="py-4 text-center"
//               >
//                 <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
//                   <Sparkles className="w-8 h-8" />
//                 </div>
//                 <h2 className="text-3xl font-extrabold mb-2">Welcome to Abhishek OS.</h2>
//                 <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
//                   Your personalized workstation is initialized. Here are quick pro-tips:
//                 </p>

//                 <div className="grid grid-cols-3 gap-3 text-left text-xs mb-4">
//                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
//                     <div className="font-bold text-sky-400 mb-1">Top Menu Bar</div>
//                     <p className="text-[11px] text-slate-400">
//                       Access Control Center, Spotlight, Wi-Fi, Sound, and system menus.
//                     </p>
//                   </div>
//                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
//                     <div className="font-bold text-purple-400 mb-1">Bottom Dock</div>
//                     <p className="text-[11px] text-slate-400">
//                       Hover to magnify, launch apps, drag files to Trash, and switch active apps.
//                     </p>
//                   </div>
//                   <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
//                     <div className="font-bold text-pink-400 mb-1">Quick Shortcuts</div>
//                     <p className="text-[11px] text-slate-400">
//                       <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">⌃ Space</kbd> Spotlight,{' '}
//                       <kbd className="px-1 py-0.5 rounded bg-white/10 font-mono">⌃↑</kbd> Mission Control.
//                     </p>
//                   </div>
//                 </div>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </div>

//         {/* Bottom Buttons */}
//         <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
//           {step > 1 ? (
//             <button
//               onClick={() => setStep(s => s - 1)}
//               className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
//             >
//               &larr; Back
//             </button>
//           ) : (
//             <div />
//           )}

//           <button
//             onClick={handleNext}
//             className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
//           >
//             <span>{step === 6 ? 'Enter Abhishek OS →' : 'Continue →'}</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };


import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowRight,
  Check,
  Camera,
  Upload,
  User,
  Sparkles,
  Layers,
  Palette,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Compass,
  Monitor,
  Zap,
  Wand2,
  ShieldCheck,
  Globe2,
  Languages,
  MapPin, UserRound, AtSign, Mail, CircleUserRound,
} from 'lucide-react';
import { useOS } from '../../context/OSContext';
import { UserProfile, SystemSettings, AccentColor, ThemeMode } from '../../types/desktop';
import { sound } from '../../services/soundService';

// Cute cartoon / 3D character avatars.
// These are self-contained SVG characters, so they work offline and don't
// depend on external image hosts.
type AvatarPreset = {
  name: string;
  url: string;
};

const createCartoonAvatar = ({
  skin,
  hair,
  shirt,
  pants,
  shoes,
  bg1,
  bg2,
  eye = '#172033',
  accessory = 'none',
  hairStyle = 'soft',
  expression = 'smile',
}: {
  skin: string;
  hair: string;
  shirt: string;
  pants: string;
  shoes: string;
  bg1: string;
  bg2: string;
  eye?: string;
  accessory?: 'none' | 'cap' | 'bow' | 'headphones' | 'glasses' | 'crown' | 'flower';
  hairStyle?: 'soft' | 'curly' | 'spiky' | 'bob' | 'bun' | 'fringe';
  expression?: 'smile' | 'happy' | 'cool' | 'wink';
}) => {
  const hairSvg = {
    soft: `
      <path d="M77 116C67 72 96 37 148 37c50 0 82 31 77 80-2 17-8 28-17 39l-19-18-10 19-18-20-19 19-18-20-18 18-15-22-17 18c-8-10-12-20-14-35z" fill="${hair}"/>
      <path d="M83 94c12-31 38-47 70-47 28 0 51 12 66 32-35-15-91-14-136 15z" fill="#fff" opacity=".10"/>
    `,
    curly: `
      <g fill="${hair}">
        <circle cx="91" cy="75" r="29"/><circle cx="121" cy="51" r="31"/>
        <circle cx="154" cy="48" r="32"/><circle cx="187" cy="59" r="30"/>
        <circle cx="211" cy="84" r="27"/><circle cx="82" cy="105" r="24"/>
        <circle cx="218" cy="111" r="24"/>
      </g>
      <path d="M82 105c3-38 30-63 68-63 40 0 69 27 70 65l-16 38-21-18-15 19-20-20-19 19-18-21-21 20-15-23z" fill="${hair}"/>
    `,
    spiky: `
      <path d="M73 111l10-53 18 23 9-38 25 27 19-39 12 40 33-28-3 37 35-11-19 35-4 36-29-20-13 24-21-22-21 22-15-25-25 20z" fill="${hair}"/>
    `,
    bob: `
      <path d="M71 121c-2-51 29-82 78-82 48 0 80 31 79 82-1 29-12 48-31 60l-8-52H111l-9 52c-19-12-30-31-31-60z" fill="${hair}"/>
      <path d="M78 96c17-31 43-44 76-44 28 0 52 10 68 30-42-11-95-7-144 14z" fill="#fff" opacity=".08"/>
    `,
    bun: `
      <circle cx="211" cy="54" r="28" fill="${hair}"/>
      <path d="M76 116c-4-49 27-78 73-78 48 0 80 30 78 78-1 20-8 34-20 47l-17-24-19 21-20-23-20 22-18-23-19 22-15-26c-7-6-11-11-13-16z" fill="${hair}"/>
    `,
    fringe: `
      <path d="M72 113c0-47 31-76 78-76 48 0 79 29 79 76l-16 34-20-24-12 25-19-28-17 25-18-29-21 27-15-25-17 22z" fill="${hair}"/>
      <path d="M78 101c18-30 45-45 75-45 31 0 54 13 70 35-40-11-91-8-145 10z" fill="#fff" opacity=".08"/>
    `,
  }[hairStyle];

  const accessorySvg = {
    none: '',
    cap: `
      <path d="M77 75c29-22 82-28 126-10l34 15-9 21c-47-17-99-17-148 2z" fill="${bg1}"/>
      <path d="M104 68c34-14 76-13 108 2" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="6" stroke-linecap="round"/>
    `,
    bow: `
      <path d="M105 75c-23-19-40-9-40 9 0 17 20 24 43 8z" fill="${bg1}"/>
      <path d="M195 75c23-19 40-9 40 9 0 17-20 24-43 8z" fill="${bg1}"/>
      <circle cx="150" cy="82" r="13" fill="${bg2}"/>
    `,
    headphones: `
      <path d="M75 123c0-52 29-82 75-82s75 30 75 82" fill="none" stroke="${bg1}" stroke-width="12" stroke-linecap="round"/>
      <rect x="61" y="119" width="25" height="48" rx="12" fill="${bg1}"/>
      <rect x="214" y="119" width="25" height="48" rx="12" fill="${bg1}"/>
      <circle cx="73" cy="143" r="6" fill="#fff" opacity=".25"/>
      <circle cx="227" cy="143" r="6" fill="#fff" opacity=".25"/>
    `,
    glasses: `
      <g fill="#182033" stroke="#fff" stroke-opacity=".25" stroke-width="3">
        <rect x="89" y="112" width="49" height="31" rx="14"/>
        <rect x="162" y="112" width="49" height="31" rx="14"/>
        <path d="M138 123h24" fill="none"/>
      </g>
      <circle cx="116" cy="126" r="5" fill="#fff" opacity=".55"/>
      <circle cx="189" cy="126" r="5" fill="#fff" opacity=".55"/>
    `,
    crown: `
      <path d="M112 67l12-28 26 23 26-23 12 28z" fill="#facc15" stroke="#fff" stroke-opacity=".4" stroke-width="3"/>
      <circle cx="124" cy="39" r="5" fill="#fff"/><circle cx="150" cy="62" r="5" fill="#fff"/>
      <circle cx="176" cy="39" r="5" fill="#fff"/>
    `,
    flower: `
      <g fill="${bg1}">
        <circle cx="204" cy="72" r="13"/><circle cx="224" cy="72" r="13"/>
        <circle cx="214" cy="57" r="13"/><circle cx="214" cy="87" r="13"/>
      </g>
      <circle cx="214" cy="72" r="9" fill="#facc15"/>
    `,
  }[accessory];

  const eyes = expression === 'wink'
    ? `
      <ellipse cx="119" cy="139" rx="7" ry="4" fill="${eye}"/>
      <ellipse cx="181" cy="139" rx="7" ry="10" fill="${eye}"/>
      <circle cx="181" cy="136" r="3" fill="#fff"/>
    `
    : `
      <ellipse cx="119" cy="139" rx="8" ry="11" fill="${eye}"/>
      <ellipse cx="181" cy="139" rx="8" ry="11" fill="${eye}"/>
      <circle cx="116" cy="135" r="3.5" fill="#fff"/>
      <circle cx="178" cy="135" r="3.5" fill="#fff"/>
    `;

  const mouth = expression === 'happy'
    ? `<path d="M130 165c11 16 29 16 40 0" fill="#fff" stroke="#8b4a45" stroke-width="4" stroke-linecap="round"/>`
    : expression === 'cool'
      ? `<path d="M137 166c8 5 18 5 26 0" fill="none" stroke="#8b4a45" stroke-width="5" stroke-linecap="round"/>`
      : `<path d="M137 164c8 8 18 8 26 0" fill="none" stroke="#8b4a45" stroke-width="5" stroke-linecap="round"/>`;

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 340">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${bg1}"/>
        <stop offset=".55" stop-color="${bg2}"/>
        <stop offset="1" stop-color="#0b1020"/>
      </linearGradient>
      <radialGradient id="face" cx=".35" cy=".22" r=".8">
        <stop offset="0" stop-color="#fff" stop-opacity=".26"/>
        <stop offset=".25" stop-color="${skin}"/>
        <stop offset="1" stop-color="${skin}"/>
      </radialGradient>
      <linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${shirt}"/>
        <stop offset="1" stop-color="${pants}"/>
      </linearGradient>
      <filter id="shadow">
        <feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".48"/>
      </filter>
    </defs>

    <rect width="300" height="340" rx="78" fill="#080b14"/>
    <rect x="9" y="9" width="282" height="322" rx="70" fill="url(#bg)"/>
    <circle cx="66" cy="76" r="42" fill="#fff" opacity=".10"/>
    <circle cx="238" cy="264" r="55" fill="#000" opacity=".10"/>

    <g filter="url(#shadow)">
      <!-- body -->
      <path d="M55 330c4-61 36-91 95-91s91 30 95 91z" fill="url(#shirt)"/>
      <path d="M117 243c8 18 20 28 33 28s25-10 33-28v-35h-66z" fill="url(#face)"/>

      <!-- little collar -->
      <path d="M117 244l33 27 33-27 16 18-49 37-49-37z" fill="#fff" opacity=".10"/>

      <!-- head -->
      <ellipse cx="150" cy="139" rx="78" ry="87" fill="url(#face)"/>

      <!-- ears -->
      <circle cx="76" cy="145" r="18" fill="${skin}"/>
      <circle cx="224" cy="145" r="18" fill="${skin}"/>

      <!-- hair -->
      ${hairSvg}

      <!-- eyebrows -->
      <path d="M103 119c9-7 20-8 30-3M167 116c10-5 21-4 30 3"
        fill="none" stroke="${hair}" stroke-width="7" stroke-linecap="round"/>

      <!-- eyes -->
      ${eyes}

      <!-- cheeks -->
      <ellipse cx="100" cy="164" rx="17" ry="9" fill="#ff8f9a" opacity=".28"/>
      <ellipse cx="200" cy="164" rx="17" ry="9" fill="#ff8f9a" opacity=".28"/>

      <!-- nose -->
      <path d="M147 145c-3 9-3 14 4 16" fill="none" stroke="#a96758" stroke-width="4" stroke-linecap="round"/>

      <!-- mouth -->
      ${mouth}

      <!-- tiny shirt emblem -->
      <circle cx="150" cy="294" r="23" fill="#fff" opacity=".10"/>
      <path d="M139 294l11-13 11 13-11 13z" fill="#fff" opacity=".75"/>

      <!-- accessories -->
      ${accessorySvg}
    </g>

    <circle cx="38" cy="275" r="5" fill="#fff" opacity=".45"/>
    <circle cx="261" cy="94" r="4" fill="#fff" opacity=".5"/>
    <circle cx="244" cy="113" r="2.5" fill="#fff" opacity=".35"/>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const PRESET_AVATARS: AvatarPreset[] = [
  {
    name: 'Sunny',
    url: createCartoonAvatar({
      skin: '#f2b28d',
      hair: '#3a241c',
      shirt: '#38bdf8',
      pants: '#2563eb',
      shoes: '#e0f2fe',
      bg1: '#38bdf8',
      bg2: '#6366f1',
      hairStyle: 'soft',
      accessory: 'cap',
      expression: 'happy',
    }),
  },
  {
    name: 'Mimi',
    url: createCartoonAvatar({
      skin: '#f5c7a8',
      hair: '#5b2d45',
      shirt: '#f472b6',
      pants: '#7c3aed',
      shoes: '#fce7f3',
      bg1: '#fb7185',
      bg2: '#a855f7',
      hairStyle: 'bob',
      accessory: 'bow',
      expression: 'smile',
    }),
  },
  {
    name: 'Bobo',
    url: createCartoonAvatar({
      skin: '#c98765',
      hair: '#202938',
      shirt: '#22d3ee',
      pants: '#0f766e',
      shoes: '#cffafe',
      bg1: '#06b6d4',
      bg2: '#2563eb',
      hairStyle: 'spiky',
      accessory: 'glasses',
      expression: 'cool',
    }),
  },
  {
    name: 'Coco',
    url: createCartoonAvatar({
      skin: '#8d5b49',
      hair: '#171717',
      shirt: '#fb923c',
      pants: '#ea580c',
      shoes: '#ffedd5',
      bg1: '#f97316',
      bg2: '#db2777',
      hairStyle: 'curly',
      accessory: 'flower',
      expression: 'happy',
    }),
  },
  {
    name: 'Lumi',
    url: createCartoonAvatar({
      skin: '#f0b18b',
      hair: '#6b3e26',
      shirt: '#a78bfa',
      pants: '#4f46e5',
      shoes: '#ede9fe',
      bg1: '#8b5cf6',
      bg2: '#ec4899',
      hairStyle: 'bun',
      accessory: 'crown',
      expression: 'wink',
    }),
  },
  {
    name: 'Max',
    url: createCartoonAvatar({
      skin: '#d99a72',
      hair: '#101827',
      shirt: '#34d399',
      pants: '#047857',
      shoes: '#d1fae5',
      bg1: '#10b981',
      bg2: '#0ea5e9',
      hairStyle: 'fringe',
      accessory: 'headphones',
      expression: 'happy',
    }),
  },
  {
    name: 'Piku',
    url: createCartoonAvatar({
      skin: '#efbd99',
      hair: '#33211d',
      shirt: '#facc15',
      pants: '#ca8a04',
      shoes: '#fef9c3',
      bg1: '#f59e0b',
      bg2: '#f43f5e',
      hairStyle: 'soft',
      accessory: 'flower',
      expression: 'wink',
    }),
  },
  {
    name: 'Zoya',
    url: createCartoonAvatar({
      skin: '#a96d52',
      hair: '#25182f',
      shirt: '#c084fc',
      pants: '#7e22ce',
      shoes: '#f3e8ff',
      bg1: '#a855f7',
      bg2: '#4f46e5',
      hairStyle: 'curly',
      accessory: 'headphones',
      expression: 'smile',
    }),
  },
];

const ROLES_LIST = [
  'Developer',
  'Designer',
  'Engineer',
  'Artist',
  'Creator',
  'Student',
  'Entrepreneur',
  'Photographer',
  'Video Editor',
  'Musician',
  'Writer',
  'Researcher',
  'Gamer',
  'Freelancer',
  'Business Owner',
];

const getRoleEmoji = (role: string) => {
  const value = role.toLowerCase();

  if (value.includes('engineer') || value.includes('developer') || value.includes('coding')) {
    return '👨‍💻';
  }

  if (value.includes('designer') || value.includes('ui') || value.includes('ux')) {
    return '🎨';
  }

  if (value.includes('artist') || value.includes('drawing') || value.includes('illustr')) {
    return '🖌️';
  }

  if (value.includes('writer') || value.includes('content')) {
    return '✍️';
  }

  if (value.includes('student')) {
    return '🎓';
  }

  if (value.includes('business') || value.includes('entrepreneur')) {
    return '🚀';
  }

  if (value.includes('manager') || value.includes('leader')) {
    return '🧠';
  }

  if (value.includes('photograph') || value.includes('photo')) {
    return '📸';
  }

  if (value.includes('music') || value.includes('artist')) {
    return '🎵';
  }

  if (value.includes('video') || value.includes('creator')) {
    return '🎬';
  }

  if (value.includes('developer') || value.includes('software')) {
    return '💻';
  }

  if (value.includes('security') || value.includes('cyber')) {
    return '🛡️';
  }

  if (value.includes('network')) {
    return '🌐';
  }

  if (value.includes('ai') || value.includes('machine')) {
    return '🤖';
  }

  if (value.includes('data')) {
    return '📊';
  }

  if (value.includes('cloud')) {
    return '☁️';
  }

  if (value.includes('marketing')) {
    return '📣';
  }

  if (value.includes('teacher') || value.includes('education')) {
    return '📚';
  }

  if (value.includes('chef') || value.includes('food')) {
    return '👨‍🍳';
  }

  if (value.includes('gaming') || value.includes('gamer')) {
    return '🎮';
  }

  return '✨';
};


const getRoleDescription = (role: string) => {
  const value = role.toLowerCase();

  if (value.includes('engineer') || value.includes('developer')) {
    return 'Build & create';
  }

  if (value.includes('designer') || value.includes('ui') || value.includes('ux')) {
    return 'Design & imagine';
  }

  if (value.includes('artist')) {
    return 'Create & express';
  }

  if (value.includes('student')) {
    return 'Learn & explore';
  }

  if (value.includes('business') || value.includes('entrepreneur')) {
    return 'Build & lead';
  }

  if (value.includes('security') || value.includes('cyber')) {
    return 'Protect & secure';
  }

  if (value.includes('network')) {
    return 'Connect & manage';
  }

  if (value.includes('ai') || value.includes('machine')) {
    return 'Innovate & automate';
  }

  if (value.includes('music')) {
    return 'Create & perform';
  }

  if (value.includes('photograph')) {
    return 'Capture moments';
  }

  if (value.includes('video') || value.includes('creator')) {
    return 'Create & share';
  }

  return 'Make something great';
};

const AmbientBackground = () => { return (<div className="pointer-events-none absolute inset-0 overflow-hidden"> {/* Main glow */} <motion.div animate={{ x: [0, 35, -20, 0], y: [0, -25, 20, 0], scale: [1, 1.08, 0.96, 1], }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', }} className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-sky-500/10 blur-[100px]" /> <motion.div animate={{ x: [0, -30, 25, 0], y: [0, 30, -20, 0], scale: [1, 0.94, 1.08, 1], }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', }} className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" /> <motion.div animate={{ x: [0, 20, -20, 0], y: [0, -30, 25, 0], }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', }} className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-fuchsia-500/[0.06] blur-[110px]" /> {/* Tiny floating particles */} {[...Array(18)].map((_, i) => (<motion.span key={i} initial={{ opacity: 0, y: 30, }} animate={{ opacity: [0, 0.35, 0], y: [-10, -80, -150], x: [0, i % 2 === 0 ? 15 : -15, i % 2 === 0 ? -10 : 10], }} transition={{ duration: 5 + (i % 4), repeat: Infinity, delay: i * 0.35, ease: 'easeOut', }} className="absolute bottom-0 left-[var(--left)] h-1 w-1 rounded-full bg-sky-300" style={{ '--left': `${(i * 17) % 100}%`, } as React.CSSProperties} />))} </div>); }; /* ========================================================= GLASS SECTION ========================================================= */ const GlassPanel = ({ children, className = '', }: { children: React.ReactNode; className?: string; }) => { return (<div className={` relative overflow-hidden rounded-[28px] border border-white/[0.10] bg-white/[0.035] shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl ${className} `} > {/* top reflection */} <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" /> {/* inner glow */} <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.035] via-transparent to-transparent" /> {children} </div>); };

const ACCENT_COLORS: { id: AccentColor; label: string; color: string }[] = [
  { id: 'blue', label: 'Blue', color: '#3b82f6' },
  { id: 'purple', label: 'Purple', color: '#a855f7' },
  { id: 'pink', label: 'Pink', color: '#ec4899' },
  { id: 'orange', label: 'Orange', color: '#f97316' },
  { id: 'green', label: 'Green', color: '#22c55e' },
  { id: 'cyan', label: 'Cyan', color: '#06b6d4' },
];

export const OnboardingModal: React.FC = () => {
  const { finishOnboarding } = useOS();
  const [step, setStep] = useState(1);

  // Draft profile
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    displayName: '',
    username: '',
    email: '',
    avatarUrl: '',
    avatarType: 'initials',
    roles: ['Developer'],
    bio: 'Architecting Abhishek OS — a desktop experience built for you.',
    pin: '',
  });

  // Draft settings
  const [langSettings, setLangSettings] = useState({
    language: 'English',
    region: 'India',
  });

  const [personalization, setPersonalization] = useState<{
    theme: ThemeMode;
    accent: AccentColor;
    uiStyle: 'balanced' | 'compact' | 'spacious';
    animationLevel: 'full' | 'reduced' | 'minimal';
    soundEffects: boolean;
    glassEffects: boolean;
    liveWallpapers: boolean;
  }>({
    theme: 'dark',
    accent: 'blue',
    uiStyle: 'balanced',
    animationLevel: 'full',
    soundEffects: true,
    glassEffects: true,
    liveWallpapers: true,
  });

  // Webcam stream
  const [isCapturingWebcam, setIsCapturingWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startWebcam = async () => {
    try {
      setIsCapturingWebcam(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Camera access not granted or camera not available.');
      setIsCapturingWebcam(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setProfile(p => ({ ...p, avatarUrl: dataUrl, avatarType: 'upload' }));
      sound.playShutter();
    }
    // stop stream
    const stream = videoRef.current.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCapturingWebcam(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfile(p => ({ ...p, avatarUrl: reader.result as string, avatarType: 'upload' }));
        sound.playClick();
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleRole = (role: string) => {
    sound.playClick();
    setProfile(p => {
      const exists = p.roles.includes(role);
      const updated = exists ? p.roles.filter(r => r !== role) : [...p.roles, role];
      return { ...p, roles: updated };
    });
  };

  const handleNext = () => {
    sound.playClick();

    // Validate Step 3 - Create User Profile
    if (step === 3) {
      const email = profile.email.trim();

      if (!email) {
        setEmailError('Email is required');
        return;
      }

      const emailRegex =
        /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!emailRegex.test(email) || email.includes('..')) {
        setEmailError('Please enter a valid email address');
        return;
      }

      // Clear any previous error
      setEmailError('');
    }

    if (step < 6) {
      setStep(s => s + 1);
    } else {
      // Complete!
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch { }

      finishOnboarding(profile, {
        ...langSettings,
        ...personalization,
      });
    }
  };

  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const value = email.trim();

    if (!value) {
      return 'Email is required';
    }

    // Practical email validation:
    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }

    // Prevent consecutive dots
    if (value.includes('..')) {
      return 'Please enter a valid email address';
    }

    return '';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 select-none font-sans overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-sky-600/30 via-indigo-600/25 to-pink-600/20 blur-[130px]"
        />
      </div>

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl min-h-[520px] rounded-3xl glass-panel text-white p-8 shadow-2xl border border-white/20 flex flex-col justify-between">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h4.5l2-4.5h7l2 4.5H22L12 2zm0 6l2.3 5.5h-4.6L12 8z" />
            </svg>
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
              Abhishek OS
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className={`w-2.5 h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-sky-400' : i < step ? 'bg-white/60' : 'bg-white/20'
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Content Screens */}
        <div className=" rounded-2xl flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">


            ```tsx
            {/* =========================================================
    SCREEN 1 — CINEMATIC FIRST BOOT
    Premium OS onboarding experience
   ========================================================= */}

            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="
      relative
      min-h-[500px]
      overflow-hidden
      bg-[#04070d]
      rounded-2xl
    "
              >
                <AmbientBackground />

                {/* =====================================================
        BACKGROUND ATMOSPHERE
       ===================================================== */}

                <div className="pointer-events-none absolute inset-0 overflow-hidden">

                  {/* central aura */}
                  <motion.div
                    animate={{
                      scale: [1, 1.18, 1],
                      opacity: [0.22, 0.38, 0.22],
                    }}
                    transition={{
                      duration: 7,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="
          absolute
          left-1/2
          top-1/2
          h-[330px]
          w-[330px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-sky-500/[0.09]
          blur-[100px]
        "
                  />

                  {/* purple atmosphere */}
                  <motion.div
                    animate={{
                      x: [0, 60, 0],
                      y: [0, -30, 0],
                      opacity: [0.08, 0.16, 0.08],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="
          absolute
          -right-24
          top-10
          h-72
          w-72
          rounded-full
          bg-purple-500/10
          blur-[100px]
        "
                  />

                  {/* cyan atmosphere */}
                  <motion.div
                    animate={{
                      x: [0, -50, 0],
                      y: [0, 40, 0],
                    }}
                    transition={{
                      duration: 12,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="
          absolute
          -left-24
          bottom-0
          h-64
          w-64
          rounded-full
          bg-cyan-500/[0.07]
          blur-[100px]
        "
                  />

                  {/* fine grid */}
                  <div
                    className="
          absolute
          inset-0
          opacity-[0.022]
          [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)]
          [background-size:32px_32px]
        "
                  />

                  {/* vignette */}
                  <div
                    className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_center,transparent_20%,rgba(2,5,10,.72)_100%)]
        "
                  />
                </div>

                {/* =====================================================
        TOP SYSTEM BAR
       ===================================================== */}

                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.15,
                    duration: 0.5,
                  }}
                  className="
        absolute
        left-5
        right-5
        top-5
        z-20
        flex
        items-center
        justify-between
      "
                >

                  {/* system mark */}
                  <div className="flex items-center gap-2.5">

                    <div
                      className="
            relative
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-[9px]
            border
            border-white/[0.09]
            bg-white/[0.035]
            backdrop-blur-xl
          "
                    >
                      <div
                        className="
              h-2
              w-2
              rounded-[3px]
              bg-gradient-to-br
              from-sky-300
              to-indigo-400
              shadow-[0_0_12px_rgba(56,189,248,.7)]
            "
                      />
                    </div>

                    <div>
                      <div
                        className="
              text-[8px]
              font-black
              uppercase
              tracking-[0.22em]
              text-white
            "
                      >
                        ABHISHEK OS
                      </div>

                      <div
                        className="
              mt-0.5
              text-[6px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-slate-700
            "
                      >
                        First boot
                      </div>
                    </div>
                  </div>

                  {/* secure status */}
                  <div
                    className="
          flex
          items-center
          gap-2
          rounded-full
          border
          border-emerald-400/10
          bg-emerald-400/[0.035]
          px-2.5
          py-1.5
        "
                  >
                    <motion.span
                      animate={{
                        opacity: [0.45, 1, 0.45],
                        scale: [1, 1.25, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className="
            h-1.5
            w-1.5
            rounded-full
            bg-emerald-400
          "
                    />

                    <span
                      className="
            text-[6px]
            font-black
            uppercase
            tracking-[0.14em]
            text-emerald-400/80
          "
                    >
                      Ready
                    </span>
                  </div>
                </motion.div>

                {/* =====================================================
        MAIN
       ===================================================== */}

                <div
                  className="
        relative
        z-10
        flex
        min-h-[500px]
        flex-col
        items-center
        justify-center
        px-5
        pb-5
        pt-16
        text-center
      "
                >

                  {/* ===================================================
          3D CORE
         =================================================== */}

                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.55,
                      rotateX: 35,
                      rotateY: -25,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotateX: 0,
                      rotateY: 0,
                    }}
                    transition={{
                      duration: 1.1,
                      delay: 0.2,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    whileHover={{
                      scale: 1.025,
                      rotateY: 5,
                      rotateX: -3,
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      perspective: 1200,
                    }}
                    className="
          relative
          mb-9
        "
                  >

                    {/* outer orbital ring */}
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="
            absolute
            -inset-10
            rounded-full
            border
            border-sky-400/[0.08]
            border-t-sky-300/50
            border-r-indigo-400/20
          "
                    />

                    {/* second orbital ring */}
                    <motion.div
                      animate={{
                        rotate: -360,
                      }}
                      transition={{
                        duration: 27,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="
            absolute
            -inset-14
            rounded-full
            border
            border-purple-400/[0.05]
            border-b-purple-400/30
          "
                    />

                    {/* orbital dots */}
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="
            absolute
            -inset-10
          "
                    >
                      <span
                        className="
              absolute
              left-1/2
              top-0
              h-1.5
              w-1.5
              -translate-x-1/2
              rounded-full
              bg-sky-300
              shadow-[0_0_15px_rgba(56,189,248,.9)]
            "
                      />
                    </motion.div>

                    {/* core glow */}
                    <motion.div
                      animate={{
                        scale: [0.9, 1.12, 0.9],
                        opacity: [0.25, 0.5, 0.25],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="
            absolute
            -inset-12
            rounded-full
            bg-gradient-to-br
            from-sky-400/20
            via-indigo-500/10
            to-purple-500/15
            blur-[40px]
          "
                    />

                    {/* =================================================
            GLASS CORE
           ================================================= */}

                    <div
                      className="
            relative
            h-[126px]
            w-[126px]
            rounded-[36px]
            border
            border-white/[0.16]
            bg-gradient-to-br
            from-white/[0.10]
            via-white/[0.035]
            to-white/[0.015]
            p-[1.5px]
            shadow-[0_35px_100px_rgba(0,0,0,.65),0_0_60px_rgba(56,189,248,.10)]
            backdrop-blur-2xl
          "
                    >

                      <div
                        className="
              relative
              flex
              h-full
              w-full
              items-center
              justify-center
              overflow-hidden
              rounded-[34px]
              bg-[#060a12]
            "
                      >

                        {/* glass shine */}
                        <motion.div
                          animate={{
                            x: ["-130%", "130%"],
                          }}
                          transition={{
                            duration: 4.5,
                            repeat: Infinity,
                            repeatDelay: 2,
                            ease: "easeInOut",
                          }}
                          className="
                pointer-events-none
                absolute
                -inset-y-10
                w-12
                rotate-[25deg]
                bg-white/[0.07]
                blur-md
              "
                        />

                        {/* inner gradient */}
                        <div
                          className="
                pointer-events-none
                absolute
                inset-0
                bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,.12),transparent_48%)]
              "
                        />

                        {/* logo */}
                        <motion.svg
                          animate={{
                            y: [0, -3, 0],
                          }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="
                relative
                z-10
                h-[62px]
                w-[62px]
                text-sky-300
                drop-shadow-[0_0_24px_rgba(56,189,248,.75)]
              "
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2L2 22h4.5l2.25-5h6.5l2.25 5H22L12 2zm0 6.3 1.9 5.2h-3.8L12 8.3z" />
                        </motion.svg>

                        {/* bottom glass reflection */}
                        <div
                          className="
                pointer-events-none
                absolute
                bottom-0
                left-0
                right-0
                h-12
                bg-gradient-to-t
                from-sky-400/[0.06]
                to-transparent
              "
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* ===================================================
          TITLE
         =================================================== */}

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 18,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.65,
                      delay: 0.55,
                    }}
                  >
                    <div
                      className="
            mb-2
            text-[7px]
            font-black
            uppercase
            tracking-[0.42em]
            text-slate-600
          "
                    >
                      Welcome
                    </div>

                    <h1
                      className="
            text-[38px]
            font-black
            leading-none
            tracking-[-0.06em]
            text-white
            sm:text-[46px]
          "
                    >
                      ABHISHEK
                      <span
                        className="
              ml-2
              bg-gradient-to-r
              from-sky-300
              via-indigo-300
              to-fuchsia-300
              bg-clip-text
              text-transparent
            "
                      >
                        OS
                      </span>
                    </h1>

                    <p
                      className="
            mx-auto
            mt-3
            max-w-xs
            text-[10px]
            font-medium
            leading-5
            text-slate-500
            sm:text-[11px]
          "
                    >
                      A desktop experience built around you.
                    </p>
                  </motion.div>

                  {/* ===================================================
          SYSTEM INFO STRIP
         =================================================== */}

                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 12,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      delay: 0.7,
                      duration: 0.5,
                    }}
                    className="
          mt-6
          flex
          items-center
          divide-x
          divide-white/[0.06]
          overflow-hidden
          rounded-2xl
          border
          border-white/[0.07]
          bg-white/[0.025]
          backdrop-blur-xl
        "
                  >
                    {[
                      {
                        label: "INTERFACE",
                        value: "Fluid",
                      },
                      {
                        label: "ENGINE",
                        value: "Modern",
                      },
                      {
                        label: "MODE",
                        value: "Personal",
                      },
                    ].map(item => (
                      <div
                        key={item.label}
                        className="
              px-3.5
              py-2.5
              sm:px-5
            "
                      >
                        <div
                          className="
                text-[5px]
                font-black
                uppercase
                tracking-[0.16em]
                text-slate-700
              "
                        >
                          {item.label}
                        </div>

                        <div
                          className="
                mt-1
                text-[8px]
                font-bold
                text-slate-400
              "
                        >
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </motion.div>

                  {/* ===================================================
          CONTINUE CTA
         =================================================== */}

                  <motion.button
                    initial={{
                      opacity: 0,
                      y: 15,
                      scale: 0.96,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    transition={{
                      delay: 0.86,
                      duration: 0.55,
                    }}
                    whileHover={{
                      scale: 1.035,
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.96,
                    }}
                    onClick={() => {
                      sound.playClick();
                      setStep(2);
                    }}
                    className="
          group
          relative
          mt-7
          overflow-hidden
          rounded-2xl
          p-[1px]
          shadow-[0_15px_45px_rgba(56,189,248,.10)]
        "
                  >

                    {/* animated border */}
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="
            absolute
            -inset-20
            bg-[conic-gradient(from_0deg,transparent_0deg,transparent_250deg,rgba(56,189,248,.8)_290deg,rgba(168,85,247,.7)_320deg,transparent_350deg)]
          "
                    />

                    <div
                      className="
            relative
            flex
            min-w-[175px]
            items-center
            justify-center
            gap-3
            rounded-[15px]
            border
            border-white/[0.08]
            bg-[#090e18]
            px-5
            py-3
            backdrop-blur-xl
          "
                    >
                      <span
                        className="
              text-[9px]
              font-black
              uppercase
              tracking-[0.16em]
              text-white
            "
                      >
                        Enter your desktop
                      </span>

                      <motion.span
                        animate={{
                          x: [0, 4, 0],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="
              flex
              h-5
              w-5
              items-center
              justify-center
              rounded-full
              bg-sky-400/[0.10]
              text-sky-300
            "
                      >
                        →
                      </motion.span>

                      {/* hover shine */}
                      <div
                        className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-r
              from-transparent
              via-white/[0.05]
              to-transparent
              opacity-0
              transition-opacity
              duration-500
              group-hover:opacity-100
            "
                      />
                    </div>
                  </motion.button>

                  {/* ===================================================
          BOTTOM HINT
         =================================================== */}

                  <motion.div
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      delay: 1.15,
                      duration: 0.5,
                    }}
                    className="
          mt-4
          flex
          items-center
          gap-2
          text-[6px]
          font-bold
          uppercase
          tracking-[0.18em]
          text-slate-700
        "
                  >
                    <span className="h-px w-5 bg-slate-800" />

                    <span>Setup takes less than a minute</span>

                    <span className="h-px w-5 bg-slate-800" />
                  </motion.div>
                </div>

                {/* =====================================================
        BOTTOM EDGE
       ===================================================== */}

                <div
                  className="
        pointer-events-none
        absolute
        bottom-0
        left-0
        right-0
        h-px
        bg-gradient-to-r
        from-transparent
        via-sky-400/30
        to-transparent
      "
                />

                <motion.div
                  animate={{
                    x: ["-120%", "120%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="
        pointer-events-none
        absolute
        bottom-0
        left-1/2
        h-px
        w-28
        -translate-x-1/2
        bg-gradient-to-r
        from-transparent
        via-sky-300
        to-transparent
      "
                />
              </motion.div>
            )}
            ```

            /* ========================================================= SCREEN 2 — LANGUAGE / REGION ========================================================= */

            {step === 2 && (<motion.div key="step-2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], }} className=" rounded-2xl relative min-h-[500px] overflow-hidden" > <AmbientBackground /> <div className="relative z-10 px-4 py-5 sm:px-7 sm:py-7"> {/* Header */} <div className="mb-6 flex items-start gap-4"> <motion.div initial={{ scale: 0.7, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.5 }} className=" flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-400/15 to-indigo-500/10 shadow-[0_10px_35px_rgba(56,189,248,0.10)] " > <Globe2 className="h-6 w-6 text-sky-300" /> </motion.div> <div> <div className="mb-1 flex items-center gap-2"> <span className="text-[9px] font-black uppercase tracking-[0.2em] text-sky-400"> Step 02 </span> <span className="h-1 w-1 rounded-full bg-slate-600" /> <span className="text-[9px] font-bold text-slate-500"> Localization </span> </div> <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl"> Let&apos;s make it feel <span className="ml-2 bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent"> yours. </span> </h2> <p className="mt-1 text-xs leading-5 text-slate-500"> Choose the language and regional formatting you want Abhishek OS to use. </p> </div> </div> <div className="grid grid-cols-1 gap-4 md:grid-cols-2"> {/* LANGUAGE */} <GlassPanel className="p-4"> <div className="mb-4 flex items-center justify-between"> <div> <div className="flex items-center gap-2"> <Languages className="h-4 w-4 text-sky-400" /> <span className="text-xs font-black text-white"> Language </span> </div> <p className="mt-1 text-[9px] text-slate-500"> Interface language </p> </div> <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[8px] font-bold text-slate-500"> {langSettings.language} </span> </div> <div className="space-y-2"> {[{ name: 'English', native: 'English', symbol: 'EN', }, { name: 'Hindi', native: 'हिन्दी', symbol: 'हि', }, { name: 'Marathi', native: 'मराठी', symbol: 'म', },].map((lang, index) => { const selected = langSettings.language === lang.name; return (<motion.button key={lang.name} type="button" onClick={() => { setLangSettings(s => ({ ...s, language: lang.name, })); sound.playClick(); }} whileHover={{ x: 4, scale: 1.01, }} whileTap={{ scale: 0.98, }} className={` group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ${selected ? 'border-sky-400/40 bg-sky-400/[0.10] shadow-[0_10px_35px_rgba(56,189,248,0.10)]' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.05]'} `} > {selected && (<motion.div layoutId="language-selected" className="absolute inset-y-0 left-0 w-1 rounded-full bg-gradient-to-b from-sky-300 to-indigo-500" />)} <div className={` flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[10px] font-black ${selected ? 'border-sky-400/30 bg-sky-400/10 text-sky-300' : 'border-white/[0.08] bg-white/[0.04] text-slate-500'} `} > {lang.symbol} </div> <div className="min-w-0 flex-1"> <div className="text-xs font-bold text-white"> {lang.name} </div> <div className="mt-0.5 text-[9px] text-slate-500"> {lang.native} </div> </div> {selected && (<motion.div initial={{ scale: 0, }} animate={{ scale: 1, }} className=" flex h-6 w-6 items-center justify-center rounded-full bg-sky-400 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)] " > <Check className="h-3.5 w-3.5" strokeWidth={3} /> </motion.div>)} {!selected && (<ArrowRight className="h-3.5 w-3.5 text-slate-700 transition-transform group-hover:translate-x-1 group-hover:text-slate-400" />)} </motion.button>); })} </div> </GlassPanel> {/* REGION */} <GlassPanel className="p-4"> <div className="mb-4 flex items-center justify-between"> <div> <div className="flex items-center gap-2"> <MapPin className="h-4 w-4 text-indigo-400" /> <span className="text-xs font-black text-white"> Region </span> </div> <p className="mt-1 text-[9px] text-slate-500"> Dates, numbers and regional formats </p> </div> <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[8px] font-bold text-slate-500"> {langSettings.region} </span> </div> <div className="max-h-[270px] space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"> {[{ name: 'India', code: 'IN', flag: '🇮🇳', }, { name: 'United States', code: 'US', flag: '🇺🇸', }, { name: 'United Kingdom', code: 'UK', flag: '🇬🇧', }, { name: 'Canada', code: 'CA', flag: '🇨🇦', }, { name: 'Australia', code: 'AU', flag: '🇦🇺', }, { name: 'Other', code: '••', flag: '🌎', },].map(region => { const selected = langSettings.region === region.name; return (<motion.button key={region.name} type="button" onClick={() => { setLangSettings(s => ({ ...s, region: region.name, })); sound.playClick(); }} whileHover={{ x: 4, }} whileTap={{ scale: 0.98, }} className={` flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${selected ? 'border-indigo-400/40 bg-indigo-400/[0.10]' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.05]'} `} > <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-lg"> {region.flag} </div> <div className="min-w-0 flex-1"> <div className="text-xs font-bold text-white"> {region.name} </div> <div className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-slate-600"> {region.code} </div> </div> {selected && (<div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400 text-slate-950 shadow-[0_0_20px_rgba(129,140,248,0.35)]"> <Check className="h-3.5 w-3.5" strokeWidth={3} /> </div>)} </motion.button>); })} </div> </GlassPanel> </div> {/* Preview strip */}  </div> </motion.div>)} /*


            {/* =========================================================
    SCREEN 3 — CREATE USER PROFILE
    Professional identity setup
   ========================================================= */}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -28 }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className=" rounded-2xl relative min-h-[520px] overflow-hidden"
              >
                <AmbientBackground />

                <div className=" rounded-2xl relative z-10 px-4 py-5 sm:px-6 sm:py-6 lg:px-7">

                  {/* =====================================================
          HEADER
         ===================================================== */}

                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mb-5 flex items-start justify-between gap-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">

                      {/* Step icon */}
                      <div
                        className="
              relative flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl
              border border-purple-400/20
              bg-purple-400/[0.08]
              shadow-[0_10px_30px_rgba(168,85,247,0.08)]
            "
                      >
                        <UserRound className="h-[18px] w-[18px] text-purple-300" />

                        <motion.div
                          animate={{
                            scale: [1, 1.35, 1],
                            opacity: [0.25, 0.55, 0.25],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="
                pointer-events-none absolute inset-0
                rounded-xl bg-purple-400/10 blur-xl
              "
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className="
                  text-[8px] font-black uppercase
                  tracking-[0.2em] text-purple-400
                "
                          >
                            Step 03
                          </span>

                          <span className="h-1 w-1 rounded-full bg-slate-700" />

                          <span className="text-[8px] font-bold text-slate-600">
                            Identity
                          </span>
                        </div>

                        <h2 className="text-[23px] font-black leading-none tracking-[-0.035em] text-white sm:text-[26px]">
                          Create your
                          <span
                            className="
                  ml-1.5
                  bg-gradient-to-r
                  from-purple-300
                  via-fuchsia-300
                  to-sky-300
                  bg-clip-text text-transparent
                "
                          >
                            profile.
                          </span>
                        </h2>

                        <p className="mt-1.5 max-w-xl text-[10px] leading-4 text-slate-500">
                          This identity will personalize your Abhishek OS experience.
                        </p>
                      </div>
                    </div>

                    {/* Local badge */}
                    <div
                      className="
            hidden shrink-0 items-center gap-1.5
            rounded-full
            border border-emerald-400/15
            bg-emerald-400/[0.04]
            px-2.5 py-1.5
            sm:flex
          "
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                      <span
                        className="
              text-[7px] font-black uppercase
              tracking-[0.14em] text-emerald-400
            "
                      >
                        Local profile
                      </span>
                    </div>
                  </motion.div>

                  {/* =====================================================
          MAIN CONTENT
          35% CHARACTER / 65% PROFILE
         ===================================================== */}

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(250px,0.7fr)_minmax(0,1.55fr)]">

                    {/* ===================================================
            LEFT — COMPACT CHARACTER PANEL
           =================================================== */}

                    <GlassPanel className="relative overflow-hidden p-4">

                      {/* subtle panel decoration */}
                      <div
                        className="
              pointer-events-none absolute -right-16 -top-16
              h-40 w-40 rounded-full
              bg-sky-400/[0.06]
              blur-3xl
            "
                      />

                      <div
                        className="
              pointer-events-none absolute -bottom-20 -left-10
              h-32 w-32 rounded-full
              bg-purple-500/[0.06]
              blur-3xl
            "
                      />

                      <div className="relative z-10">

                        {/* Panel heading */}
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-sky-400" />

                              <span
                                className="
                      text-[9px] font-black uppercase
                      tracking-[0.16em] text-white
                    "
                              >
                                Character
                              </span>
                            </div>

                            <p className="mt-1 text-[8px] text-slate-600">
                              Choose your digital look
                            </p>
                          </div>

                          <span
                            className="
                  rounded-full
                  border border-sky-400/20
                  bg-sky-400/[0.07]
                  px-2 py-1
                  text-[7px] font-black
                  uppercase tracking-wider
                  text-sky-300
                "
                          >
                            3D
                          </span>
                        </div>

                        {/* =================================================
                COMPACT AVATAR PREVIEW
               ================================================= */}

                        <div className="flex items-center gap-4">

                          <div className="relative shrink-0">

                            {/* rotating ring */}
                            <motion.div
                              animate={{
                                rotate: 360,
                              }}
                              transition={{
                                duration: 16,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="
                    absolute -inset-2
                    rounded-[24px]
                    border
                    border-sky-400/10
                    border-t-sky-400/50
                    border-r-purple-400/30
                  "
                            />

                            {/* glow */}
                            <div
                              className="
                    absolute -inset-5
                    rounded-[30px]
                    bg-sky-400/[0.08]
                    blur-2xl
                  "
                            />

                            {/* avatar */}
                            <motion.div
                              whileHover={{
                                rotateY: 7,
                                rotateX: -5,
                                scale: 1.04,
                              }}
                              transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 18,
                              }}
                              style={{
                                transformStyle: "preserve-3d",
                                perspective: 800,
                              }}
                              className="
                    relative
                    h-[76px] w-[76px]
                    overflow-hidden
                    rounded-[22px]
                    border border-white/[0.12]
                    bg-gradient-to-br
                    from-slate-800
                    to-slate-950
                    shadow-[0_18px_45px_rgba(0,0,0,0.45)]
                  "
                            >
                              {isCapturingWebcam ? (
                                <video
                                  ref={videoRef}
                                  autoPlay
                                  muted
                                  playsInline
                                  className="h-full w-full object-cover"
                                />
                              ) : profile.avatarUrl ? (
                                <img
                                  src={profile.avatarUrl}
                                  alt="Selected profile avatar"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center">
                                  <CircleUserRound className="h-8 w-8 text-slate-700" />

                                  <span
                                    className="
                          mt-1 text-[6px] font-black
                          uppercase tracking-widest
                          text-slate-600
                        "
                                  >
                                    Avatar
                                  </span>
                                </div>
                              )}

                              {/* glass shine */}
                              <div
                                className="
                      pointer-events-none absolute inset-0
                      bg-gradient-to-br
                      from-white/[0.10]
                      via-transparent
                      to-black/20
                    "
                              />
                            </motion.div>
                          </div>

                          {/* preview text */}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[11px] font-black text-white">
                              {profile.displayName ||
                                profile.fullName ||
                                "Your profile"}
                            </div>

                            <div className="mt-1 truncate text-[8px] text-slate-600">
                              {profile.username
                                ? `@${profile.username}`
                                : "Select a character below"}
                            </div>

                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />

                              <span className="text-[7px] font-bold uppercase tracking-wider text-slate-600">
                                Digital identity
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* =================================================
                CAMERA / UPLOAD
               ================================================= */}

                        <div className="mt-4 flex gap-2">

                          {isCapturingWebcam ? (
                            <motion.button
                              whileHover={{
                                scale: 1.02,
                              }}
                              whileTap={{
                                scale: 0.97,
                              }}
                              onClick={capturePhoto}
                              className="
                    flex flex-1 items-center justify-center gap-2
                    rounded-xl
                    border border-sky-400/25
                    bg-sky-400/[0.08]
                    px-3 py-2
                    text-[8px] font-black uppercase
                    tracking-wider text-sky-300
                    transition-all
                    hover:bg-sky-400/[0.14]
                  "
                            >
                              <Camera className="h-3.5 w-3.5" />
                              Capture photo
                            </motion.button>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{
                                  y: -2,
                                  scale: 1.03,
                                }}
                                whileTap={{
                                  scale: 0.96,
                                }}
                                onClick={startWebcam}
                                title="Take a photo"
                                className="
                      flex flex-1 items-center justify-center gap-2
                      rounded-xl
                      border border-white/[0.08]
                      bg-white/[0.035]
                      px-3 py-2
                      text-[8px] font-black uppercase
                      tracking-wider text-slate-400
                      transition-all
                      hover:border-sky-400/20
                      hover:bg-sky-400/[0.05]
                      hover:text-sky-300
                    "
                              >
                                <Camera className="h-3.5 w-3.5" />
                                Camera
                              </motion.button>

                              <label
                                title="Upload avatar"
                                className="
                      flex flex-1 cursor-pointer
                      items-center justify-center gap-2
                      rounded-xl
                      border border-white/[0.08]
                      bg-white/[0.035]
                      px-3 py-2
                      text-[8px] font-black uppercase
                      tracking-wider text-slate-400
                      transition-all
                      hover:border-purple-400/20
                      hover:bg-purple-400/[0.05]
                      hover:text-purple-300
                    "
                              >
                                <Upload className="h-3.5 w-3.5" />

                                Upload

                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                            </>
                          )}
                        </div>

                        {/* =================================================
                CHARACTER GRID
               ================================================= */}

                        <div className="mt-5">

                          <div className="mb-2.5 flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">
                              Choose character
                            </span>

                            <span className="text-[7px] font-bold text-slate-700">
                              {PRESET_AVATARS.length} styles
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {PRESET_AVATARS.map((avatar, i) => {
                              const isSelected =
                                profile.avatarType === "preset" &&
                                profile.avatarUrl === avatar.url;

                              return (
                                <motion.button
                                  key={avatar.name}
                                  type="button"
                                  title={`Choose ${avatar.name}`}
                                  onClick={() => {
                                    setProfile(p => ({
                                      ...p,
                                      avatarUrl: avatar.url,
                                      avatarType: "preset",
                                    }));

                                    sound.playClick();
                                  }}
                                  initial={{
                                    opacity: 0,
                                    scale: 0.9,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  transition={{
                                    delay: i * 0.025,
                                  }}
                                  whileHover={{
                                    y: -3,
                                    scale: 1.05,
                                  }}
                                  whileTap={{
                                    scale: 0.93,
                                  }}
                                  className={`
                        group relative rounded-xl p-[1.5px]
                        transition-all duration-300
                        ${isSelected
                                      ? "bg-gradient-to-br from-sky-300 via-indigo-400 to-fuchsia-400 shadow-[0_8px_25px_rgba(56,189,248,0.18)]"
                                      : "bg-transparent"
                                    }
                      `}
                                >
                                  <div
                                    className="
                          relative aspect-square
                          overflow-hidden
                          rounded-[10px]
                          border border-white/[0.07]
                          bg-[#080c15]
                        "
                                  >
                                    <img
                                      src={avatar.url}
                                      alt={`${avatar.name} 3D cartoon avatar`}
                                      loading="lazy"
                                      className="
                            h-full w-full object-cover
                            transition-transform
                            duration-500
                            group-hover:scale-110
                          "
                                    />

                                    <div
                                      className="
                            pointer-events-none
                            absolute inset-0
                            bg-gradient-to-br
                            from-white/[0.08]
                            via-transparent
                            to-black/25
                          "
                                    />

                                    {isSelected && (
                                      <motion.div
                                        initial={{
                                          scale: 0,
                                          rotate: -30,
                                        }}
                                        animate={{
                                          scale: 1,
                                          rotate: 0,
                                        }}
                                        className="
                              absolute right-0.5 top-0.5
                              flex h-4 w-4
                              items-center justify-center
                              rounded-full
                              border
                              border-[#080c15]
                              bg-sky-400
                              text-slate-950
                            "
                                      >
                                        <Check
                                          className="h-2 w-2"
                                          strokeWidth={4}
                                        />
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-3 text-center text-[7px] text-slate-700">
                          You can change your avatar later in Settings.
                        </div>
                      </div>
                    </GlassPanel>

                    {/* ===================================================
            RIGHT — LARGE PROFILE FORM
           =================================================== */}

                    <GlassPanel className="relative overflow-hidden p-4 sm:p-5">

                      {/* background lighting */}
                      <div
                        className="
              pointer-events-none absolute
              -right-24 -top-24
              h-64 w-64 rounded-full
              bg-purple-500/[0.04]
              blur-3xl
            "
                      />

                      <div
                        className="
              pointer-events-none absolute
              -bottom-24 left-1/3
              h-56 w-56 rounded-full
              bg-sky-500/[0.035]
              blur-3xl
            "
                      />

                      <div className="relative z-10">

                        {/* FORM HEADER */}
                        <div className="mb-5 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white">
                              Personal details
                            </div>

                            <p className="mt-1 text-[8px] text-slate-600">
                              Tell Abhishek OS how to identify you.
                            </p>
                          </div>

                          <div
                            className="
                  flex h-8 w-8 items-center justify-center
                  rounded-xl
                  border border-white/[0.07]
                  bg-white/[0.035]
                "
                          >
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          </div>
                        </div>

                        <div className="space-y-4">

                          {/* =================================================
                  FULL NAME
                 ================================================= */}

                          <div>
                            <label
                              className="
                    mb-2 flex items-center gap-2
                    text-[8px] font-black uppercase
                    tracking-[0.14em] text-slate-500
                  "
                            >
                              <UserRound className="h-3 w-3 text-sky-400" />
                              Full name
                            </label>

                            <div className="relative">
                              <input
                                placeholder="Enter your full name"
                                type="text"
                                value={profile.fullName}
                                onChange={e =>
                                  setProfile(p => ({
                                    ...p,
                                    fullName: e.target.value,
                                  }))
                                }
                                className="
                      w-full
                      rounded-2xl
                      border border-white/[0.08]
                      bg-white/[0.035]
                      px-4 py-3.5
                      text-xs font-semibold
                      text-white
                      outline-none
                      placeholder:text-slate-700
                      transition-all duration-300
                      hover:border-white/[0.13]
                      focus:border-sky-400/40
                      focus:bg-sky-400/[0.035]
                      focus:shadow-[0_0_30px_rgba(56,189,248,0.05)]
                    "
                              />

                              {profile.fullName && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    scale: 0.7,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  className="
                        absolute right-3 top-1/2
                        flex h-6 w-6
                        -translate-y-1/2
                        items-center justify-center
                        rounded-full
                        bg-emerald-400/10
                      "
                                >
                                  <Check className="h-3 w-3 text-emerald-400" />
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* =================================================
                  DISPLAY NAME + USERNAME
                 ================================================= */}

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            {/* Display */}
                            <div>
                              <label
                                className="
                      mb-2 flex items-center gap-2
                      text-[8px] font-black uppercase
                      tracking-[0.14em] text-slate-500
                    "
                              >
                                <CircleUserRound className="h-3 w-3 text-purple-400" />
                                Display name
                              </label>

                              <input
                                placeholder="display name"
                                type="text"
                                value={profile.displayName}
                                onChange={e =>
                                  setProfile(p => ({
                                    ...p,
                                    displayName: e.target.value,
                                  }))
                                }
                                className="
                      w-full
                      rounded-2xl
                      border border-white/[0.08]
                      bg-white/[0.035]
                      px-4 py-3.5
                      text-xs font-semibold
                      text-white
                      outline-none
                      placeholder:text-slate-700
                      transition-all duration-300
                      hover:border-white/[0.13]
                      focus:border-purple-400/40
                      focus:bg-purple-400/[0.035]
                    "
                              />
                            </div>

                            {/* Username */}
                            <div>
                              <label
                                className="
                      mb-2 flex items-center gap-2
                      text-[8px] font-black uppercase
                      tracking-[0.14em] text-slate-500
                    "
                              >
                                <AtSign className="h-3 w-3 text-fuchsia-400" />
                                Username
                              </label>

                              <div className="relative">
                                <span
                                  className="
                        pointer-events-none
                        absolute left-4 top-1/2
                        -translate-y-1/2
                        text-xs font-bold
                        text-slate-600
                      "
                                >
                                  @
                                </span>

                                <input
                                  placeholder="yourusername"
                                  type="text"
                                  value={profile.username}
                                  onChange={e =>
                                    setProfile(p => ({
                                      ...p,
                                      username: e.target.value.replace(
                                        /\s/g,
                                        ""
                                      ),
                                    }))
                                  }
                                  className="
                        w-full
                        rounded-2xl
                        border border-white/[0.08]
                        bg-white/[0.035]
                        py-3.5 pl-8 pr-4
                        text-xs font-semibold
                        text-white
                        outline-none
                        placeholder:text-slate-700
                        transition-all duration-300
                        hover:border-white/[0.13]
                        focus:border-fuchsia-400/40
                        focus:bg-fuchsia-400/[0.035]
                      "
                                />
                              </div>
                            </div>
                          </div>

                          {/* =================================================
                  EMAIL
                 ================================================= */}

                          <div>
                            <label
                              className="
                    mb-2 flex items-center gap-2
                    text-[8px] font-black uppercase
                    tracking-[0.14em] text-slate-500
                  "
                            >
                              <Mail className="h-3 w-3 text-sky-400" />
                              Email address
                            </label>

                            <div className="relative">
                              <input
                                placeholder="your@email.com"
                                type="email"
                                value={profile.email}
                                required
                                autoComplete="email"
                                onChange={e => {
                                  const value = e.target.value.replace(
                                    /\s/g,
                                    ""
                                  );

                                  setProfile(p => ({
                                    ...p,
                                    email: value,
                                  }));

                                  if (emailError) {
                                    setEmailError(validateEmail(value));
                                  }
                                }}
                                onBlur={() => {
                                  setEmailError(
                                    validateEmail(profile.email)
                                  );
                                }}
                                className={`
                      w-full
                      rounded-2xl
                      border
                      bg-white/[0.035]
                      px-4 py-3.5
                      text-xs font-semibold
                      text-white
                      outline-none
                      placeholder:text-slate-700
                      transition-all duration-300
                      ${emailError
                                    ? `
                            border-red-500/60
                            focus:border-red-500
                            focus:bg-red-500/[0.03]
                          `
                                    : `
                            border-white/[0.08]
                            hover:border-white/[0.13]
                            focus:border-sky-400/40
                            focus:bg-sky-400/[0.035]
                          `
                                  }
                    `}
                              />

                              {!emailError && profile.email && (
                                <motion.div
                                  initial={{
                                    opacity: 0,
                                    scale: 0.7,
                                  }}
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  className="
                        absolute right-3 top-1/2
                        flex h-6 w-6
                        -translate-y-1/2
                        items-center justify-center
                        rounded-full
                        bg-emerald-400/10
                      "
                                >
                                  <Check
                                    className="h-3 w-3 text-emerald-400"
                                    strokeWidth={3}
                                  />
                                </motion.div>
                              )}
                            </div>

                            {emailError && (
                              <motion.p
                                initial={{
                                  opacity: 0,
                                  y: -3,
                                }}
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                                className="
                      mt-2 flex items-center gap-1.5
                      text-[9px] font-semibold
                      text-red-400
                    "
                              >
                                <span className="h-1 w-1 rounded-full bg-red-400" />
                                {emailError}
                              </motion.p>
                            )}
                          </div>




                        </div>
                      </div>
                    </GlassPanel>
                  </div>

                  {/* =====================================================
          MOBILE LOCAL BADGE
         ===================================================== */}

                  <div
                    className="
          mt-3 flex items-center justify-center gap-1.5
          sm:hidden
        "
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                    <span
                      className="
            text-[7px] font-black uppercase
            tracking-widest text-emerald-400
          "
                    >
                      Local profile
                    </span>
                  </div>
                </div>
              </motion.div>
            )}



            {/* Screen 4: Passion / Role Setup */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -20 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="py-2 relative"
              >
                {/* Ambient 3D background glow */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-40 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute top-32 -right-20 w-40 h-40 bg-purple-500/10 blur-[70px] rounded-full pointer-events-none" />

                {/* Header */}
                <div className="relative flex items-start justify-between gap-4 mb-5">
                  <div>
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <motion.div
                          animate={{
                            rotate: [0, -8, 8, 0],
                            y: [0, -2, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                          }}
                          className="
                w-9 h-9
                rounded-2xl
                flex items-center justify-center
                bg-gradient-to-br
                from-sky-400
                via-blue-500
                to-indigo-600
                shadow-[0_8px_25px_rgba(56,189,248,0.35)]
                border border-white/20
              "
                        >
                          <Sparkles className="w-4 h-4 text-white" />
                        </motion.div>

                        <span className="text-[9px] uppercase tracking-[0.2em] font-black text-sky-400">
                          Identity
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                        What do you do?
                      </h2>

                      <p className="text-xs text-slate-400 mt-1 max-w-md">
                        Tell Abhishek OS what inspires you.
                        <span className="text-slate-500"> Select everything that feels like you.</span>
                      </p>
                    </motion.div>
                  </div>

                  {/* Selected counter */}
                  <motion.div
                    layout
                    className="
          shrink-0
          min-w-[72px]
          px-3 py-2
          rounded-2xl
          bg-white/[0.06]
          border border-white/10
          backdrop-blur-xl
          text-center
          shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]
        "
                  >
                    <motion.div
                      key={profile.roles.length}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-lg font-black text-white"
                    >
                      {profile.roles.length}
                    </motion.div>

                    <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">
                      Selected
                    </div>
                  </motion.div>
                </div>

                {/* Selected role chips */}
                <AnimatePresence mode="popLayout">
                  {profile.roles.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -5 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -5 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                          Your passions
                        </div>

                        <div className="h-px flex-1 bg-white/[0.06]" />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {profile.roles.map((role) => (
                          <motion.button
                            key={role}
                            layout
                            initial={{ opacity: 0, scale: 0.7, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.94 }}
                            onClick={() => toggleRole(role)}
                            className="
                  group
                  inline-flex items-center gap-1.5
                  px-2.5 py-1.5
                  rounded-xl
                  bg-sky-400/10
                  border border-sky-400/25
                  text-[9px]
                  font-bold
                  text-sky-200
                  shadow-[0_4px_15px_rgba(56,189,248,0.08)]
                  hover:bg-sky-400/15
                  transition-colors
                "
                          >
                            <span>{getRoleEmoji(role)}</span>
                            <span>{role}</span>

                            <span className="ml-0.5 text-sky-400/60 group-hover:text-red-400 transition-colors">
                              ×
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Role cards */}
                <div
                  className="
        relative
        grid
        grid-cols-2
        sm:grid-cols-3
        lg:grid-cols-5
        gap-2.5
        max-h-[330px]
        overflow-y-auto
        p-2
        -mx-2
        scrollbar-thin
        scrollbar-thumb-white/10
        scrollbar-track-transparent
      "
                >
                  {ROLES_LIST.map((role, index) => {
                    const isSelected = profile.roles.includes(role);

                    return (
                      <motion.button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        initial={{
                          opacity: 0,
                          y: 18,
                          scale: 0.92,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: isSelected ? 1.02 : 1,
                        }}
                        transition={{
                          delay: Math.min(index * 0.025, 0.35),
                          duration: 0.28,
                          ease: 'easeOut',
                        }}
                        whileHover={{
                          y: -6,
                          scale: 1.035,
                        }}
                        whileTap={{
                          scale: 0.94,
                        }}
                        className={`
              group
              relative
              min-h-[92px]
              rounded-[22px]
              p-[1px]
              text-left
              overflow-hidden
              transition-all
              duration-300
              focus:outline-none
              ${isSelected
                            ? `
                    bg-gradient-to-br
                    from-sky-300
                    via-sky-500
                    to-indigo-600
                    shadow-[0_14px_35px_rgba(56,189,248,0.25)]
                  `
                            : `
                    bg-white/[0.08]
                    hover:bg-white/[0.14]
                    shadow-[0_10px_25px_rgba(0,0,0,0.15)]
                  `
                          }
            `}
                      >
                        {/* Inner 3D card */}
                        <div
                          className={`
                relative
                h-full
                min-h-[90px]
                rounded-[21px]
                overflow-hidden
                ${isSelected
                              ? 'bg-[#0b1424]'
                              : 'bg-gradient-to-br from-white/[0.08] to-white/[0.025]'
                            }
              `}
                        >
                          {/* Top glass reflection */}
                          <div
                            className="
                  absolute
                  inset-x-0
                  top-0
                  h-1/2
                  bg-gradient-to-b
                  from-white/[0.07]
                  to-transparent
                  pointer-events-none
                "
                          />

                          {/* Decorative 3D orb */}
                          <motion.div
                            animate={
                              isSelected
                                ? {
                                  scale: [1, 1.12, 1],
                                  opacity: [0.15, 0.28, 0.15],
                                }
                                : {
                                  scale: [1, 1.04, 1],
                                  opacity: [0.07, 0.12, 0.07],
                                }
                            }
                            transition={{
                              duration: isSelected ? 2.4 : 4,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                            className={`
                  absolute
                  -right-7
                  -top-7
                  w-20
                  h-20
                  rounded-full
                  blur-2xl
                  pointer-events-none
                  ${isSelected
                                ? 'bg-sky-400'
                                : 'bg-indigo-400'
                              }
                `}
                          />

                          {/* Card content */}
                          <div className="relative h-full flex flex-col justify-between p-3">
                            <div className="flex items-start justify-between gap-2">
                              {/* Emoji / 3D icon */}
                              <motion.div
                                animate={
                                  isSelected
                                    ? {
                                      y: [0, -3, 0],
                                      rotate: [0, -3, 3, 0],
                                    }
                                    : {
                                      y: [0, -1, 0],
                                    }
                                }
                                transition={{
                                  duration: isSelected ? 2 : 3,
                                  repeat: Infinity,
                                  ease: 'easeInOut',
                                }}
                                className={`
                      w-10
                      h-10
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      text-xl
                      select-none
                      ${isSelected
                                    ? `
                            bg-gradient-to-br
                            from-sky-300/25
                            to-indigo-500/20
                            border border-sky-300/25
                            shadow-[0_8px_20px_rgba(56,189,248,0.15)]
                          `
                                    : `
                            bg-white/[0.07]
                            border border-white/10
                          `
                                  }
                    `}
                              >
                                {getRoleEmoji(role)}
                              </motion.div>

                              {/* Selection indicator */}
                              <motion.div
                                initial={false}
                                animate={{
                                  scale: isSelected ? 1 : 0.8,
                                  opacity: isSelected ? 1 : 0.45,
                                }}
                                className={`
                      w-5
                      h-5
                      rounded-full
                      flex
                      items-center
                      justify-center
                      border
                      ${isSelected
                                    ? 'bg-sky-400 border-sky-300 text-slate-950'
                                    : 'bg-white/[0.04] border-white/10 text-transparent'
                                  }
                    `}
                              >
                                <Check
                                  className="w-3 h-3"
                                  strokeWidth={4}
                                />
                              </motion.div>
                            </div>

                            {/* Role name */}
                            <div className="mt-3">
                              <div
                                className={`
                      text-[11px]
                      font-extrabold
                      leading-tight
                      truncate
                      ${isSelected
                                    ? 'text-white'
                                    : 'text-slate-200'
                                  }
                    `}
                              >
                                {role}
                              </div>

                              <div
                                className={`
                      mt-1
                      text-[8px]
                      font-medium
                      ${isSelected
                                    ? 'text-sky-300/80'
                                    : 'text-slate-500'
                                  }
                    `}
                              >
                                {getRoleDescription(role)}
                              </div>
                            </div>
                          </div>

                          {/* Selected bottom glow */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                exit={{ scaleX: 0, opacity: 0 }}
                                className="
                      absolute
                      bottom-0
                      left-3
                      right-3
                      h-[2px]
                      rounded-full
                      bg-gradient-to-r
                      from-transparent
                      via-sky-300
                      to-transparent
                    "
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

             
              </motion.div>
            )}

            {/* Screen 5: Personalization */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.985 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative py-1 sm:py-2"
              >
                {/* Ambient 3D lighting */}
                <motion.div
                  aria-hidden
                  animate={{ x: [0, 18, -10, 0], y: [0, -12, 10, 0], scale: [1, 1.08, 0.96, 1] }}
                  transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute -top-20 -right-24 h-48 w-48 rounded-full bg-sky-500/20 blur-[70px]"
                />
                <motion.div
                  aria-hidden
                  animate={{ x: [0, -18, 8, 0], y: [0, 12, -8, 0], scale: [1, 0.94, 1.08, 1] }}
                  transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-indigo-600/15 blur-[75px]"
                />

                <div className="relative mb-4 flex items-end justify-between gap-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 8, -8, 0], y: [0, -2, 0] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl border border-sky-300/20 bg-gradient-to-br from-sky-400/20 to-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_30px_rgba(14,165,233,0.16)]"
                      >
                        <Sliders className="h-4 w-4 text-sky-300" />
                      </motion.div>
                      <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-sky-300">
                        Personal Studio
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Make it yours.</h2>
                    <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                      Tune the visual system, motion and atmosphere of your desktop.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right sm:block">
                    <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">Step</div>
                    <div className="text-sm font-black text-white">05 <span className="text-slate-500">/ 06</span></div>
                  </div>
                </div>

                <div className="relative grid max-h-[355px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 sm:gap-4">
                  {/* Appearance */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-sky-400/[0.05] opacity-80" />
                    <div className="relative flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-400/10 border border-sky-300/15">
                        <Monitor className="h-4 w-4 text-sky-300" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white">Appearance</div>
                        <div className="text-[9px] text-slate-500">Choose your base atmosphere</div>
                      </div>
                    </div>
                    <div className="relative grid grid-cols-3 gap-2">
                      {(['dark', 'light', 'auto'] as ThemeMode[]).map(mode => {
                        const selected = personalization.theme === mode;
                        return (
                          <motion.button
                            key={mode}
                            type="button"
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setPersonalization(p => ({ ...p, theme: mode }));
                              sound.playClick();
                            }}
                            className={`relative overflow-hidden rounded-2xl border px-2 py-3 text-[10px] font-bold capitalize transition-all ${selected
                              ? 'border-sky-300/60 bg-sky-400/15 text-white shadow-[0_8px_25px_rgba(56,189,248,0.16)]'
                              : 'border-white/10 bg-white/[0.05] text-slate-400 hover:border-white/20 hover:bg-white/[0.09] hover:text-slate-200'
                              }`}
                          >
                            <span className={`mx-auto mb-2 block h-5 w-8 rounded-md border ${mode === 'light' ? 'bg-slate-100 border-white' : mode === 'auto' ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-100 border-white/30' : 'bg-slate-950 border-white/15'}`} />
                            {mode}
                            {selected && <Check className="absolute right-1.5 top-1.5 h-3 w-3 text-sky-300" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Accent */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                  >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-fuchsia-500/10 blur-3xl" />
                    <div className="relative flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-fuchsia-400/10 border border-fuchsia-300/15">
                        <Palette className="h-4 w-4 text-fuchsia-300" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white">Accent Color</div>
                        <div className="text-[9px] text-slate-500">Pick your signature glow</div>
                      </div>
                    </div>
                    <div className="relative flex flex-wrap items-center gap-3">
                      {ACCENT_COLORS.map((acc, i) => {
                        const selected = personalization.accent === acc.id;
                        return (
                          <motion.button
                            key={acc.id}
                            type="button"
                            aria-label={`Select ${acc.label} accent`}
                            whileHover={{ y: -4, scale: 1.12, rotate: i % 2 ? 2 : -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setPersonalization(p => ({ ...p, accent: acc.id }));
                              sound.playClick();
                            }}
                            className={`relative h-9 w-9 rounded-full border-2 transition-all ${selected ? 'border-white shadow-[0_0_0_4px_rgba(255,255,255,0.08),0_0_28px_rgba(255,255,255,0.18)]' : 'border-white/10'}`}
                            style={{ background: `radial-gradient(circle at 32% 25%, white 0%, ${acc.color} 16%, ${acc.color} 55%, #090d18 115%)` }}
                          >
                            {selected && <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-lg" strokeWidth={3.5} />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* UI Density */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                  >
                    <div className="relative flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-400/10 border border-indigo-300/15">
                        <Layers className="h-4 w-4 text-indigo-300" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white">UI Density</div>
                        <div className="text-[9px] text-slate-500">Control the breathing room</div>
                      </div>
                    </div>
                    <div className="relative grid grid-cols-3 gap-2">
                      {(['balanced', 'compact', 'spacious'] as const).map(style => {
                        const selected = personalization.uiStyle === style;
                        return (
                          <motion.button
                            key={style}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              setPersonalization(p => ({ ...p, uiStyle: style }));
                              sound.playClick();
                            }}
                            className={`rounded-2xl border px-2 py-3 text-[10px] font-bold capitalize transition-all ${selected ? 'border-indigo-300/60 bg-indigo-400/15 text-white shadow-[0_8px_25px_rgba(129,140,248,0.14)]' : 'border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/[0.09] hover:text-slate-200'}`}
                          >
                            <div className="mx-auto mb-2 flex h-5 items-end justify-center gap-0.5">
                              <span className={`w-1.5 rounded-t ${style === 'compact' ? 'h-4' : style === 'balanced' ? 'h-3' : 'h-2'} bg-current opacity-70`} />
                              <span className={`w-1.5 rounded-t ${style === 'compact' ? 'h-5' : style === 'balanced' ? 'h-4' : 'h-3'} bg-current`} />
                              <span className={`w-1.5 rounded-t ${style === 'compact' ? 'h-4' : style === 'balanced' ? 'h-3' : 'h-2'} bg-current opacity-50`} />
                            </div>
                            {style}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Feature toggles */}
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                  >
                    <div className="relative flex items-center gap-3 mb-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400/10 border border-emerald-300/15">
                        <Volume2 className="h-4 w-4 text-emerald-300" />
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-white">Experience</div>
                        <div className="text-[9px] text-slate-500">Fine-tune desktop effects</div>
                      </div>
                    </div>
                    <div className="relative space-y-2">
                      {[
                        { key: 'soundEffects' as const, label: 'Sound Effects', icon: personalization.soundEffects ? Volume2 : VolumeX, tone: 'emerald' },
                        { key: 'liveWallpapers' as const, label: 'Live Wallpapers', icon: Eye, tone: 'sky' },
                      ].map(item => {
                        const enabled = personalization[item.key];
                        const Icon = item.icon;
                        return (
                          <motion.button
                            key={item.key}
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setPersonalization(p => ({ ...p, [item.key]: !p[item.key] }));
                              sound.playClick();
                            }}
                            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition-all ${enabled ? 'border-white/15 bg-white/[0.07]' : 'border-white/10 bg-black/10'}`}
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className={`h-3.5 w-3.5 ${enabled ? item.tone === 'emerald' ? 'text-emerald-300' : 'text-sky-300' : 'text-slate-500'}`} />
                              <span className={`text-[10px] font-bold ${enabled ? 'text-slate-200' : 'text-slate-500'}`}>{item.label}</span>
                            </span>
                            <span className={`relative h-5 w-9 rounded-full border transition-all ${enabled ? 'border-sky-300/40 bg-sky-400/30' : 'border-white/10 bg-white/10'}`}>
                              <motion.span animate={{ x: enabled ? 16 : 2 }} className={`absolute top-0.5 h-3.5 w-3.5 rounded-full shadow-md ${enabled ? 'bg-white' : 'bg-slate-500'}`} />
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-[9px] text-slate-500">
                  <span className="h-1 w-1 rounded-full bg-sky-400" />
                  Changes are applied when you enter Abhishek OS
                  <span className="h-1 w-1 rounded-full bg-indigo-400" />
                </div>
              </motion.div>
            )}

            {/* Screen 6: Desktop Introduction & Finish */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, y: 24, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.985 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative py-1 text-center sm:py-3"
              >
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <motion.div
                    animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.34, 0.18], rotate: [0, 90, 180] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/20 blur-[80px]"
                  />
                  <motion.div
                    animate={{ x: [-40, 35, -40], y: [20, -25, 20] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-1/2 top-8 h-24 w-24 rounded-full bg-indigo-500/15 blur-[50px]"
                  />
                </div>

                <div className="relative mx-auto max-w-xl">
                  <motion.div
                    initial={{ scale: 0.5, rotate: -12, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.08 }}
                    className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] border border-emerald-300/30 bg-gradient-to-br from-emerald-400/25 via-sky-400/15 to-indigo-500/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_20px_60px_rgba(16,185,129,0.18)]"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                      className="absolute inset-1 rounded-[22px] border border-dashed border-white/15"
                    />
                    <Sparkles className="relative h-9 w-9 text-emerald-300 drop-shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
                    <motion.span
                      animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                      className="absolute inset-0 rounded-[26px] border border-emerald-300/30"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.35 }}
                  >
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                      System Ready
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                      Welcome to Abhishek OS.
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-400 sm:text-xs">
                      Your personalized workstation is initialized. Here are a few gestures to get you moving.
                    </p>
                  </motion.div>

                  <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
                    {[
                      {
                        title: 'Top Menu Bar',
                        text: 'Access Control Center, Spotlight, Wi-Fi, Sound, and system menus.',
                        icon: Compass,
                        tone: 'sky',
                      },
                      {
                        title: 'Bottom Dock',
                        text: 'Hover to magnify, launch apps, drag files to Trash, and switch active apps.',
                        icon: Layers,
                        tone: 'purple',
                      },
                      {
                        title: 'Quick Shortcuts',
                        text: 'Use keyboard shortcuts for Spotlight and Mission Control.',
                        icon: Sparkles,
                        tone: 'pink',
                      },
                    ].map((tip, index) => {
                      const Icon = tip.icon;
                      return (
                        <motion.div
                          key={tip.title}
                          initial={{ opacity: 0, y: 18 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.26 + index * 0.08, duration: 0.35 }}
                          whileHover={{ y: -5, scale: 1.015 }}
                          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl"
                        >
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent" />
                          <div className={`relative mb-3 flex h-9 w-9 items-center justify-center rounded-2xl border ${tip.tone === 'sky' ? 'border-sky-300/15 bg-sky-400/10 text-sky-300' : tip.tone === 'purple' ? 'border-purple-300/15 bg-purple-400/10 text-purple-300' : 'border-pink-300/15 bg-pink-400/10 text-pink-300'}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className={`relative mb-1 text-[10px] font-black uppercase tracking-[0.12em] ${tip.tone === 'sky' ? 'text-sky-300' : tip.tone === 'purple' ? 'text-purple-300' : 'text-pink-300'}`}>
                            {tip.title}
                          </div>
                          <p className="relative text-[10px] leading-4 text-slate-500">{tip.text}</p>
                        </motion.div>
                      );
                    })}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    className="mx-auto mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] text-slate-400"
                  >
                    <kbd className="rounded-lg border border-white/10 bg-white/[0.07] px-2 py-1 font-mono font-bold text-slate-200">⌃ Space</kbd>
                    <span>Spotlight</span>
                    <span className="text-white/20">•</span>
                    <kbd className="rounded-lg border border-white/10 bg-white/[0.07] px-2 py-1 font-mono font-bold text-slate-200">⌃ ↑</kbd>
                    <span>Mission Control</span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              &larr; Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <span>{step === 6 ? 'Enter Abhishek OS →' : 'Continue →'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
