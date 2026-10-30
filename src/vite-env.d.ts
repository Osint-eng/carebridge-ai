/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_CARTESIA_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare namespace THREE {
  class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    copy(v: any): this;
    clone(): Vector3;
    lerp(v: any, a: number): this;
    [key: string]: any;
  }
  class Group {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
    [key: string]: any;
  }
  class Mesh {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
    [key: string]: any;
  }
  class Object3D {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
    [key: string]: any;
  }
  class BufferGeometry {
    setFromPoints(points: any[]): this;
  }
  class Color {
    constructor(color?: any);
  }
  const DoubleSide: any;
}

declare module 'react' {
  function useState<S = any>(initial?: S | (() => S)): [S, (v: S | ((p: S) => S)) => void];
  function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  function useRef<T = any>(initial?: T | null): { current: T | null };
  function useMemo<T>(factory: () => T, deps: readonly any[]): T;
  function useCallback<T extends (...args: any[]) => any>(fn: T, deps: readonly any[]): T;
  function useContext<T = any>(ctx: any): T;
  function createContext<T = any>(defaultValue?: T): any;
  function createElement(type: any, props?: any, ...children: any[]): any;
  const StrictMode: any;
  const Fragment: any;
  type FC<P = any> = (props: P & { children?: any }) => any;
  type ReactNode = any;
  type CSSProperties = Record<string, any>;
  type FormEvent<T = any> = any;
  type ChangeEvent<T = any> = any;
  type MouseEvent<T = any> = any;
  type KeyboardEvent<T = any> = any;
  type ReactElement = any;
  namespace React {
    type FC<P = any> = (props: P & { children?: any }) => any;
    type ReactNode = any;
    type FormEvent<T = any> = any;
    type ChangeEvent<T = any> = any;
    type MouseEvent<T = any> = any;
    type CSSProperties = Record<string, any>;
    type ReactElement = any;
  }
  const React: any;
  export default React;
  export {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    useContext,
    createContext,
    createElement,
    StrictMode,
    Fragment,
  };
  export type {
    FC,
    ReactNode,
    CSSProperties,
    FormEvent,
    ChangeEvent,
    MouseEvent,
    KeyboardEvent,
    ReactElement,
  };
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-dom/client' {
  export function createRoot(el: any): { render: (node: any) => void };
}

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const Navigate: any;
  export const Link: any;
  export const NavLink: any;
  export const Outlet: any;
  export const useNavigate: any;
  export const useLocation: any;
  export const useParams: any;
}

declare module '@react-three/fiber' {
  export const Canvas: any;
  export const useFrame: any;
  export const useThree: any;
  export const extend: any;
}

declare module '@react-three/drei' {
  export const OrbitControls: any;
  export const Environment: any;
  export const Text: any;
  export const Line: any;
  export const Html: any;
}

declare module 'three' {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    copy(v: any): this;
    clone(): Vector3;
    lerp(v: any, a: number): this;
    [key: string]: any;
  }
  export class Group {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
    [key: string]: any;
  }
  export class Mesh {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
    [key: string]: any;
  }
  export class Object3D {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
    [key: string]: any;
  }
  export class BufferGeometry {
    setFromPoints(points: any[]): this;
  }
  export class Color {
    constructor(color?: any);
  }
  export const DoubleSide: any;
  const THREE: any;
  export default THREE;
}

declare module 'framer-motion' {
  export const motion: any;
  export const AnimatePresence: any;
}

declare module 'lucide-react' {
  export const FileUp: any;
  export const FileSearch: any;
  export const HeartHandshake: any;
  export const BookOpenCheck: any;
  export const Refrigerator: any;
  export const CalendarClock: any;
  export const FolderArchive: any;
  export const Play: any;
  export const Square: any;
  export const Loader2: any;
  export const Upload: any;
  export const FileText: any;
  export const Mail: any;
  export const Lock: any;
  export const User: any;
  export const ArrowRight: any;
  export const AlertCircle: any;
  export const LogOut: any;
  export const Settings: any;
  export const Home: any;
  export const Menu: any;
  export const X: any;
  export const Check: any;
  export const ChevronRight: any;
  export const ChevronDown: any;
  export const Shield: any;
  export const ShieldCheck: any;
  export const ShieldAlert: any;
  export const Activity: any;
  export const Stethoscope: any;
  export const Type: any;
  export const Contrast: any;
  export const ZapOff: any;
  export const CheckCircle2: any;
  export const Trash2: any;
  export const LayoutDashboard: any;
  export const FolderOpen: any;
  export const Languages: any;
  export const Volume2: any;
  export const Calendar: any;
  export const BarChart3: any;
  export const Users: any;
  export const Scan: any;
  export const ClipboardList: any;
  export const BookOpen: any;
  export const Printer: any;
  export const Sparkles: any;
  const _default: any;
  export default _default;
}

declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string): any;
  export type SupabaseClient = any;
}

declare module 'clsx' {
  export default function clsx(...args: any[]): string;
}

declare module 'tailwind-merge' {
  export function twMerge(...args: any[]): string;
}

declare module 'canvas-confetti' {
  export default function confetti(opts?: any): void;
}

declare module 'jspdf' {
  export class jsPDF {
    constructor(opts?: any);
    [key: string]: any;
  }
}
