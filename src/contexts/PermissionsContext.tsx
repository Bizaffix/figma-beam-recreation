import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface PermissionContextType {
  canViewPayments: (eventId?: string) => boolean;
  canViewStudentDetails: (eventId?: string) => boolean;
  canViewInstructorPricing: (eventId?: string) => boolean;
  canManageEvent: (eventId: string) => boolean;
  canMessageStudents: (eventId: string) => boolean;
  canViewEventDetails: (eventId: string) => boolean;
  canAccessInstructorFeatures: () => boolean;
  isCoHostForEvent: (eventId: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { user, role } = useAuth();

  // Check if user is a co-host for specific event
  const isCoHostForEvent = (eventId: string): boolean => {
    // TODO: Implement co-host checking logic
    // This would check if the current user is marked as co-host for this event
    return false;
  };

  // Permission checks based on role and event-specific permissions
  const canViewPayments = (eventId?: string): boolean => {
    if (role === 'admin') return true;
    if (role === 'instructor') return true;
    if (role === 'student') return false;
    if (role === 'location_owner') {
      // Owners can only view payments if they're also instructor for this event
      // or if mutual opt-in is enabled
      return false; // By default, no access to payment flows
    }
    return false;
  };

  const canViewStudentDetails = (eventId?: string): boolean => {
    if (role === 'admin') return true;
    if (role === 'instructor') return true;
    if (role === 'student') return false;
    if (role === 'location_owner') {
      // Owners can only view student details if they're co-host for this event
      // or both parties mutually opt-in
      return eventId ? isCoHostForEvent(eventId) : false;
    }
    return false;
  };

  const canViewInstructorPricing = (eventId?: string): boolean => {
    if (role === 'admin') return true;
    if (role === 'instructor') return true;
    if (role === 'student') return false;
    if (role === 'location_owner') {
      // Owners cannot see instructor pricing by default
      // Only if mutual opt-in or co-host
      return false;
    }
    return false;
  };

  const canManageEvent = (eventId: string): boolean => {
    if (role === 'admin') return true;
    if (role === 'instructor') return true; // Instructors manage their own events
    if (role === 'location_owner') {
      // Owners can manage logistics but not full event management
      // unless they're co-host or also instructor
      return isCoHostForEvent(eventId);
    }
    return false;
  };

  const canMessageStudents = (eventId: string): boolean => {
    if (role === 'admin') return true;
    if (role === 'instructor') return true;
    if (role === 'location_owner') {
      // Owners can only message students about property logistics
      // if they're co-host for the event
      return isCoHostForEvent(eventId);
    }
    return false;
  };

  const canViewEventDetails = (eventId: string): boolean => {
    if (role === 'admin') return true;
    if (role === 'instructor') return true;
    if (role === 'location_owner') {
      // Owners can view basic event details for their property
      // but not sensitive information
      return true;
    }
    if (role === 'student') {
      // Students can only view events they're registered for
      // TODO: Implement registration check
      return false;
    }
    return false;
  };

  const canAccessInstructorFeatures = (): boolean => {
    if (role === 'admin') return true;
    if (role === 'instructor') return true;
    if (role === 'location_owner') {
      // Owners can access instructor features if they've enabled it
      // TODO: Check if owner has enabled instructor mode
      return false; // By default, no instructor features
    }
    return false;
  };

  const value: PermissionContextType = {
    canViewPayments,
    canViewStudentDetails,
    canViewInstructorPricing,
    canManageEvent,
    canMessageStudents,
    canViewEventDetails,
    canAccessInstructorFeatures,
    isCoHostForEvent,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
