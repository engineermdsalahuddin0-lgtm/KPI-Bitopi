import { UserSession } from '../types';
import { db } from './db';

const SESSION_KEY = 'bitopi_kpi_user_session';

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = localStorage.getItem(SESSION_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.role === 'admin' || parsed.role === 'department')) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  // Do NOT automatically log in as admin!
  // Return null so the user must enter valid credentials on the login screen.
  return null;
}

export function saveSession(session: UserSession) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function loginAsAdmin(email: string, password?: string): { success: boolean; error?: string } {
  const trimmedEmail = email?.trim().toLowerCase() || '';
  const trimmedPass = password?.trim() || '';

  const requiredAdminEmail = 'emdadul.karim@bitopibd.com';
  const requiredAdminPassword = 'emdadul.karim@bitopibd.com';

  if (trimmedEmail !== requiredAdminEmail || trimmedPass !== requiredAdminPassword) {
    return {
      success: false,
      error: 'Invalid admin credentials. Please enter correct email and password.',
    };
  }

  const session: UserSession = {
    role: 'admin',
    email: requiredAdminEmail,
  };
  saveSession(session);
  return { success: true };
}

export function loginAsDepartment(
  departmentIdInput: string,
  deptCodeInput: string,
  accessCodeInput: string
): { success: boolean; session?: UserSession; error?: string } {
  const departments = db.getDepartments();
  const dept = departments.find((d) => d.id === departmentIdInput);

  if (!dept) {
    return { success: false, error: 'Selected department not found.' };
  }

  if (dept.status === 'disabled') {
    return { success: false, error: 'This department account is currently disabled by administrator.' };
  }

  // Validate exact match of Department ID and Access Code (Requirement #8)
  const cleanId = deptCodeInput.trim().toUpperCase();
  const cleanCode = accessCodeInput.trim().toUpperCase();

  const isIdMatch = dept.department_id.toUpperCase() === cleanId;
  const isCodeMatch = dept.access_code.toUpperCase() === cleanCode;

  if (!isIdMatch || !isCodeMatch) {
    return { success: false, error: 'Invalid department credentials.' };
  }

  const session: UserSession = {
    role: 'department',
    departmentId: dept.id,
    departmentName: dept.name,
    departmentCode: dept.short_code,
  };

  saveSession(session);
  return { success: true, session };
}
