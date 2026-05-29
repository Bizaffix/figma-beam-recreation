import { runApiEndpoint } from "@/redux/apiDispatch";
import { adminApi } from "@/services/server/admin/api";

interface RetreatEmailData {
  id: string | number;
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
  price: number;
  instructor_id: string;
}

/** Email notifications are handled server-side when retreats are published. */
export const notifyStudentsAboutNewRetreat = async (
  _retreatData: RetreatEmailData,
): Promise<{ error?: unknown }> => ({});

export const notifyInstructorAboutBooking = async (
  _bookingId: string,
): Promise<{ error?: unknown }> => ({});

export const sendCustomEmail = async (_payload: {
  to?: string;
  emails?: string[];
  subject: string;
  html?: string;
  message?: string;
  recipientType?: string;
  images?: string[];
  sections?: Array<{ message?: string; images?: string[] }>;
}): Promise<{ error?: unknown }> => {
  console.warn("sendCustomEmail: use backend email templates API");
  return {};
};

export const invokeEmailFunction = async (
  _functionName: string,
  _body: Record<string, unknown>,
): Promise<{ data?: unknown; error?: unknown }> => ({ data: null });

export async function fetchEmailTemplates() {
  return runApiEndpoint(adminApi.endpoints.getEmailTemplates);
}
