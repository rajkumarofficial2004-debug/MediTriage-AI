/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UrgencyLevel {
  EMERGENCY = 'EMERGENCY',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
  SELF_CARE = 'SELF_CARE',
}

export interface TriageResult {
  level: UrgencyLevel;
  title: string;
  recommendation: string;
  rationale: string;
  nextSteps: string[];
  possibleCauses?: string[]; // Potential conditions
  isFallback?: boolean;
}

export interface AdaptiveQuestionResult {
  question: string;
  suggestions: string[];
  isComplete: boolean;
  refinedSymptomsSummary: string;
}

export interface AssessmentData {
  age: string;
  gender: string;
  symptoms: string;
  duration: string;
  severity: number; // 1-10
  preExisting: string;
  hasRedFlags: boolean;
}

export const URGENCY_DETAILS: Record<UrgencyLevel, { color: string; label: string; icon: string }> = {
  [UrgencyLevel.EMERGENCY]: {
    color: '#ef4444', // red-500
    label: 'Call Emergency Services',
    icon: 'PhoneCall',
  },
  [UrgencyLevel.URGENT]: {
    color: '#f97316', // orange-500
    label: 'Seek Urgent Care Today',
    icon: 'Stethoscope',
  },
  [UrgencyLevel.ROUTINE]: {
    color: '#3b82f6', // blue-500
    label: 'Contact Your GP',
    icon: 'Calendar',
  },
  [UrgencyLevel.SELF_CARE]: {
    color: '#10b981', // emerald-500
    label: 'Self-Care & Monitoring',
    icon: 'Home',
  },
};

export const RED_FLAGS = [
  'chest pain',
  'difficulty breathing',
  'shortness of breath',
  'stroke',
  'facial drooping',
  'arm weakness',
  'speech difficulty',
  'severe allergic reaction',
  'anaphylaxis',
  'unconscious',
  'severe bleeding',
  'suicidal ideation',
  'harming myself',
  'heavy bleeding',
];

// Clinical Users & Role Definitions
export type UserRole = 'PATIENT' | 'NURSE' | 'DOCTOR' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  displayName?: string;
  licenseNumber?: string;
  institution?: string;
  specialty?: string;
  experienceYears?: string;
  createdAt: string;
}

export interface NurseConsultation {
  loggedAt: string;
  nurseName: string;
  nurseEmail: string;
  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  oxygenSat?: string;
  nurseComments?: string;
  status: 'AWAITING_CONSULT' | 'IN_PROGRESS' | 'ESCALATED' | 'COMPLETED';
}

export interface DoctorConsultation {
  loggedAt: string;
  doctorName: string;
  doctorEmail: string;
  prescription?: string;
  differentialDiagnosis?: string;
  consultNotes?: string;
  isResolved: boolean;
}

// Extend existing triage record structures to support clinical modules
export interface ClinicalTriageRecord {
  id: string;
  userId: string;
  patientEmail?: string;
  patientName?: string;
  data: AssessmentData;
  result: TriageResult;
  createdAt: { seconds: number };
  systemScore?: number;
  nurseConsult?: NurseConsultation;
  doctorConsult?: DoctorConsultation;
  flowStatus?: 'PENDING' | 'NURSE_TRIAGE' | 'DOCTOR_REVIEW' | 'ARCHIVED';
  accessCode?: string;
}

