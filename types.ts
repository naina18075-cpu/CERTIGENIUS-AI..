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
  type: 'logo' | 'signature';
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
  signerName: string;
  signerTitle: string;
  date: string;
}

export interface Participant {
  id: string;
  name: string;
  rank?: string;
  role?: string;
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
  ADMIN_DESIGN = 'ADMIN_DESIGN',
  ADMIN_DATA = 'ADMIN_DATA',
  PARTICIPANT_LOGIN = 'PARTICIPANT_LOGIN',
  PARTICIPANT_VIEW = 'PARTICIPANT_VIEW',
}