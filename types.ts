export interface ElementPosition {
  x: number;
  y: number;
}

export interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'logo' | 'decoration'; // Changed 'signature' to 'decoration' to differentiate from SignerBlock signatures
}

export interface SignerBlock {
  id: string; // Unique ID for this block
  name: string;
  title: string;
  x: number;
  y: number;
  signatureImageSrc?: string; // Base64 string of the signature image, if any
  signatureWidth?: number; // width of signature image, if any
  signatureHeight?: number; // height of signature image, if any
}

export interface DesignConfig {
  theme: string;
  fontFamily: string;
  titleColor: string;
  bodyColor: string;
  accentColor: string;
  isMetallicTitle: boolean;
  backgroundStyle: string;
  fontSizeScale: number;
}

export interface CertificateContent {
  title: string;
  subtitle: string;
  bodyTemplate: string; // Contains {{name}}, {{id}}, etc.
  signerBlocks: SignerBlock[]; // Array of signer blocks
  date: string;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  rank?: string;
  role?: string;
  status?: 'pending' | 'sent' | 'error';
  [key: string]: string | undefined; // Dynamic fields from CSV
}

export interface AppState {
  design: DesignConfig;
  content: CertificateContent;
  images: ImageElement[];
  participants: Participant[];
  projectSavedTime: number | null;
}

export enum ViewMode {
  WELCOME = 'WELCOME', // New Welcome screen view mode
  ADMIN_DESIGN = 'ADMIN_DESIGN',
  ADMIN_DATA = 'ADMIN_DATA',
}