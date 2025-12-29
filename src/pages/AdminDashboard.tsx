import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, GraduationCap, DollarSign, BookOpen, Loader2, Bell, X, Upload, Trash2, Save, FileText, FolderOpen, Plus, GripVertical, MapPin, Eye, Calendar, Link as LinkIcon, Percent, Tag } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { sendCustomEmail } from "@/lib/email-notifications";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Booking {
  id: string;
  full_name: string;
  email: string;
  skill_level: string;
  amount: number;
  status: string;
  created_at: string;
  retreat_id: number;
  retreat?: {
    title: string;
    instructor_id: string;
  };
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  } | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: 'template' | 'draft';
  subject: string;
  message: string;
  images: string[];
  recipient_type: 'students' | 'instructors' | null;
  created_at: string;
  updated_at: string;
}

interface EmailSection {
  id: string;
  message: string;
  images: string[];
}

interface DraftEvent {
  id: number;
  title: string;
  instructor_id: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  image?: string;
}

interface DraftVenue {
  id: string;
  property_name: string;
  owner_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  photos?: string[];
}

const AdminDashboard = () => {
  const { role, user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalBookings, setTotalBookings] = useState<number>(0);
  const [totalInstructors, setTotalInstructors] = useState<number>(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [totalLocationOwners, setTotalLocationOwners] = useState<number>(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [recentInstructors, setRecentInstructors] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [recentVenues, setRecentVenues] = useState<any[]>([]);
  const [recentDraftEvents, setRecentDraftEvents] = useState<DraftEvent[]>([]);
  const [recentDraftVenues, setRecentDraftVenues] = useState<DraftVenue[]>([]);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [instructorsDialogOpen, setInstructorsDialogOpen] = useState(false);
  const [locationOwnersDialogOpen, setLocationOwnersDialogOpen] = useState(false);
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);
  const [instructorsList, setInstructorsList] = useState<UserProfile[]>([]);
  const [locationOwnersList, setLocationOwnersList] = useState<UserProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingLocationOwners, setLoadingLocationOwners] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationRecipients, setNotificationRecipients] = useState<'students' | 'organizers' | null>(null);
  const [notificationSubject, setNotificationSubject] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedInstructors, setSelectedInstructors] = useState<Set<string>>(new Set());
  const [selectedLocationOwners, setSelectedLocationOwners] = useState<Set<string>>(new Set());
  const [emailImages, setEmailImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [emailSections, setEmailSections] = useState<EmailSection[]>([
    { id: '1', message: '', images: [] }
  ]);
  const [uploadingSectionImages, setUploadingSectionImages] = useState<{ [key: string]: boolean }>({});
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [drafts, setDrafts] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [loadTemplateDialogOpen, setLoadTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [draftEvents, setDraftEvents] = useState<DraftEvent[]>([]);
  const [draftVenues, setDraftVenues] = useState<DraftVenue[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftEventsDialogOpen, setDraftEventsDialogOpen] = useState(false);
  const [draftVenuesDialogOpen, setDraftVenuesDialogOpen] = useState(false);
  const [viewVenueDialogOpen, setViewVenueDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [loadingVenueDetails, setLoadingVenueDetails] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountRecipientType, setDiscountRecipientType] = useState<'instructors' | 'location_owners'>('instructors');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [assigningDiscount, setAssigningDiscount] = useState(false);

  useEffect(() => {
    if (role !== 'admin' || !user) return;
    fetchData();
  }, [role, user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, full_name, email, skill_level, amount, status, created_at, retreat_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        console.error('Bookings error details:', bookingsError);
        toast({
          title: "Error",
          description: bookingsError.message || "Failed to load bookings",
          variant: "destructive",
        });
      } else {
        console.log('Bookings fetched:', bookingsData?.length || 0);
        const confirmedBookings = bookingsData?.filter(b => b.status === 'confirmed') || [];
        const revenue = confirmedBookings.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
        setTotalRevenue(revenue);
        setTotalBookings(confirmedBookings.length);
        setRecentBookings(bookingsData || []);
      }

      // Fetch retreats to get instructor info
      const { data: retreatsData } = await supabase
        .from('retreats')
        .select('id, title, instructor_id');

      // Fetch all instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'instructor');

      if (!instructorsError && instructorsData) {
        setTotalInstructors(instructorsData.length);
      }

      // Fetch all students
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');

      if (!studentsError && studentsData) {
        setTotalStudents(studentsData.length);
      }

      // Fetch all location owners
      const { data: locationOwnersData, error: locationOwnersError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'location_owner');

      if (!locationOwnersError && locationOwnersData) {
        setTotalLocationOwners(locationOwnersData.length);
      }

      // Fetch recent instructors with avatars for thumbnails
      const { data: recentInstructorsData } = await supabase
        .from('profiles')
        .select('id, avatar_url, full_name')
        .eq('role', 'instructor')
        .order('created_at', { ascending: false })
        .limit(4);

      if (recentInstructorsData) {
        setRecentInstructors(recentInstructorsData);
      }

      // Fetch recent students with avatars for thumbnails
      const { data: recentStudentsData } = await supabase
        .from('profiles')
        .select('id, avatar_url, full_name')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(4);

      if (recentStudentsData) {
        setRecentStudents(recentStudentsData);
      }

      // Fetch recent venues with photos for thumbnails
      const { data: recentVenuesData } = await supabase
        .from('properties')
        .select('id, photos, property_name, status')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(4);

      if (recentVenuesData) {
        setRecentVenues(recentVenuesData);
      }

      // Fetch draft events (retreats with published=false)
      const { data: draftEventsData, error: draftEventsError } = await supabase
        .from('retreats')
        .select('id, title, instructor_id, created_at, updated_at, published, image')
        .eq('published', false)
        .order('updated_at', { ascending: false });

      if (!draftEventsError && draftEventsData) {
        setDraftEvents(draftEventsData || []);
        setRecentDraftEvents(draftEventsData.slice(0, 4));
      }

      // Fetch draft venues (properties with status='draft')
      const { data: draftVenuesData, error: draftVenuesError } = await supabase
        .from('properties')
        .select('id, property_name, owner_id, status, created_at, updated_at, photos')
        .eq('status', 'draft')
        .order('updated_at', { ascending: false });

      if (!draftVenuesError && draftVenuesData) {
        setDraftVenues(draftVenuesData || []);
        setRecentDraftVenues(draftVenuesData.slice(0, 4));
      }

      // Enrich bookings with retreat info
      if (bookingsData && retreatsData) {
        const enrichedBookings = bookingsData.map(booking => {
          const retreat = retreatsData.find(r => r.id === booking.retreat_id);
          return {
            ...booking,
            retreat: retreat ? { title: retreat.title, instructor_id: retreat.instructor_id } : undefined,
          };
        });
        setRecentBookings(enrichedBookings);
      } else if (bookingsData) {
        // Set bookings even if retreats fetch failed
        setRecentBookings(bookingsData);
      }

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const fetchStudentsList = async () => {
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Error",
          description: "Failed to load students list",
          variant: "destructive",
        });
      } else {
        setStudentsList(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching students:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const fetchInstructorsList = async () => {
    setLoadingInstructors(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, discount')
        .eq('role', 'instructor')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching instructors:', error);
        toast({
          title: "Error",
          description: "Failed to load instructors list",
          variant: "destructive",
        });
      } else {
        setInstructorsList(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching instructors:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingInstructors(false);
    }
  };

  const fetchLocationOwnersList = async () => {
    setLoadingLocationOwners(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at, discount')
        .eq('role', 'location_owner')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching location owners:', error);
        toast({
          title: "Error",
          description: "Failed to load location owners list",
          variant: "destructive",
        });
      } else {
        setLocationOwnersList(data || []);
      }
    } catch (error) {
      console.error('Unexpected error fetching location owners:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingLocationOwners(false);
    }
  };

  const handleStudentsCardClick = () => {
    setStudentsDialogOpen(true);
    if (studentsList.length === 0) {
      fetchStudentsList();
    }
  };

  const handleInstructorsCardClick = () => {
    setInstructorsDialogOpen(true);
    if (instructorsList.length === 0) {
      fetchInstructorsList();
    }
  };

  const handleLocationOwnersCardClick = () => {
    setLocationOwnersDialogOpen(true);
    if (locationOwnersList.length === 0) {
      fetchLocationOwnersList();
    }
  };

  const handleNotificationClick = (recipientType: 'students' | 'organizers') => {
    const selected = recipientType === 'students' ? selectedStudents : selectedInstructors;
    if (selected.size === 0) {
      toast({
        title: "No recipients selected",
        description: `Please select at least one ${recipientType === 'students' ? 'student' : 'organizer'} to notify`,
        variant: "destructive",
      });
      return;
    }
    setNotificationRecipients(recipientType);
    setNotificationSubject('');
    setNotificationMessage('');
    setEmailImages([]);
    setNotificationDialogOpen(true);
    fetchTemplatesAndDrafts();
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const toggleInstructorSelection = (instructorId: string) => {
    setSelectedInstructors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(instructorId)) {
        newSet.delete(instructorId);
      } else {
        newSet.add(instructorId);
      }
      return newSet;
    });
  };

  const toggleLocationOwnerSelection = (locationOwnerId: string) => {
    setSelectedLocationOwners(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationOwnerId)) {
        newSet.delete(locationOwnerId);
      } else {
        newSet.add(locationOwnerId);
      }
      return newSet;
    });
  };

  const toggleAllStudents = () => {
    if (selectedStudents.size === studentsList.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(studentsList.map(s => s.id)));
    }
  };

  const toggleAllInstructors = () => {
    if (selectedInstructors.size === instructorsList.length) {
      setSelectedInstructors(new Set());
    } else {
      setSelectedInstructors(new Set(instructorsList.map(i => i.id)));
    }
  };

  const toggleAllLocationOwners = () => {
    if (selectedLocationOwners.size === locationOwnersList.length) {
      setSelectedLocationOwners(new Set());
    } else {
      setSelectedLocationOwners(new Set(locationOwnersList.map(l => l.id)));
    }
  };

  const handleAssignDiscount = (recipientType: 'instructors' | 'location_owners') => {
    const selected = recipientType === 'instructors' ? selectedInstructors : selectedLocationOwners;
    if (selected.size === 0) {
      toast({
        title: "No recipients selected",
        description: `Please select at least one ${recipientType === 'instructors' ? 'organizer' : 'venue'} to assign discount`,
        variant: "destructive",
      });
      return;
    }
    setDiscountRecipientType(recipientType);
    setDiscountType('percentage');
    setDiscountValue('');
    setDiscountDialogOpen(true);
  };

  const handleSaveDiscount = async () => {
    if (!discountValue.trim() || isNaN(Number(discountValue)) || Number(discountValue) <= 0) {
      toast({
        title: "Invalid discount value",
        description: "Please enter a valid discount value",
        variant: "destructive",
      });
      return;
    }

    if (discountType === 'percentage' && Number(discountValue) > 100) {
      toast({
        title: "Invalid discount",
        description: "Percentage discount cannot exceed 100%",
        variant: "destructive",
      });
      return;
    }

    const selected = discountRecipientType === 'instructors' ? selectedInstructors : selectedLocationOwners;
    if (selected.size === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setAssigningDiscount(true);
    try {
      const discountData = {
        type: discountType,
        value: Number(discountValue),
      };

      const { error } = await supabase
        .from('profiles')
        .update({ discount: discountData })
        .in('id', Array.from(selected));

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Discount assigned to ${selected.size} ${discountRecipientType === 'instructors' ? 'organizer(s)' : 'venue(s)'}`,
      });

      // Refresh the lists
      if (discountRecipientType === 'instructors') {
        fetchInstructorsList();
        setSelectedInstructors(new Set());
      } else {
        fetchLocationOwnersList();
        setSelectedLocationOwners(new Set());
      }

      setDiscountDialogOpen(false);
      setDiscountValue('');
    } catch (error: any) {
      console.error('Error assigning discount:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign discount",
        variant: "destructive",
      });
    } finally {
      setAssigningDiscount(false);
    }
  };

  const handleRemoveDiscount = async (userId: string, recipientType: 'instructors' | 'location_owners') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ discount: null })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Discount removed successfully",
      });

      // Refresh the lists
      if (recipientType === 'instructors') {
        fetchInstructorsList();
      } else {
        fetchLocationOwnersList();
      }
    } catch (error: any) {
      console.error('Error removing discount:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove discount",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/email-images/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage (using retreat-images bucket)
      const { error: uploadError } = await supabase.storage
        .from('retreat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({
          title: "Error",
          description: uploadError.message || "Failed to upload image",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('retreat-images')
        .getPublicUrl(filePath);

      setEmailImages(prev => [...prev, publicUrl]);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setEmailImages(prev => prev.filter((_, i) => i !== index));
  };

  const addEmailSection = () => {
    const newId = Date.now().toString();
    setEmailSections(prev => [...prev, { id: newId, message: '', images: [] }]);
  };

  const removeEmailSection = (sectionId: string) => {
    if (emailSections.length > 1) {
      setEmailSections(prev => prev.filter(s => s.id !== sectionId));
      // Clean up uploading state for removed section
      setUploadingSectionImages(prev => {
        const newState = { ...prev };
        delete newState[sectionId];
        return newState;
      });
    } else {
      toast({
        title: "Cannot remove",
        description: "You must have at least one section",
        variant: "destructive",
      });
    }
  };

  const updateSectionMessage = (sectionId: string, message: string) => {
    setEmailSections(prev =>
      prev.map(s => s.id === sectionId ? { ...s, message } : s)
    );
  };

  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingSectionImages(prev => ({ ...prev, [sectionId]: true }));

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/email-images/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('retreat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({
          title: "Error",
          description: uploadError.message || "Failed to upload image",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('retreat-images')
        .getPublicUrl(filePath);

      setEmailSections(prev =>
        prev.map(s => s.id === sectionId
          ? { ...s, images: [...s.images, publicUrl] }
          : s
        )
      );

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading image",
        variant: "destructive",
      });
    } finally {
      setUploadingSectionImages(prev => ({ ...prev, [sectionId]: false }));
      e.target.value = '';
    }
  };

  const removeSectionImage = (sectionId: string, imageIndex: number) => {
    setEmailSections(prev =>
      prev.map(s => s.id === sectionId
        ? { ...s, images: s.images.filter((_, i) => i !== imageIndex) }
        : s
      )
    );
  };

  const fetchTemplatesAndDrafts = async () => {
    if (!user) return;
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: "Error",
          description: "Failed to load templates and drafts",
          variant: "destructive",
        });
      } else {
        const templatesList = (data || []).filter(t => t.type === 'template');
        const draftsList = (data || []).filter(t => t.type === 'draft');
        setTemplates(templatesList as EmailTemplate[]);
        setDrafts(draftsList as EmailTemplate[]);
      }
    } catch (error) {
      console.error('Unexpected error fetching templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveAsTemplate = async (type: 'template' | 'draft') => {
    if (!user || !notificationSubject.trim()) {
      toast({
        title: "Error",
        description: "Please fill in subject before saving",
        variant: "destructive",
      });
      return;
    }

    // Check if at least one section has content
    const hasContent = emailSections.some(s => s.message.trim() || s.images.length > 0);
    if (!hasContent) {
      toast({
        title: "Error",
        description: "Please add at least one section with content before saving",
        variant: "destructive",
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the " + type,
        variant: "destructive",
      });
      return;
    }

    setSavingTemplate(true);
    try {
      // Combine sections into a message for backward compatibility
      const combinedMessage = emailSections
        .map((section) => section.message.trim())
        .filter(text => text)
        .join('\n\n---\n\n');

      // Combine all images from all sections
      const allImages = emailSections.flatMap(s => s.images);

      const { error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          name: templateName.trim(),
          type: type,
          subject: notificationSubject,
          message: combinedMessage || ' ',
          images: allImages,
          recipient_type: notificationRecipients || null,
          sections: emailSections, // Store sections as JSONB
        });

      if (error) {
        console.error('Error saving template:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save " + type,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: type.charAt(0).toUpperCase() + type.slice(1) + " saved successfully",
        });
        setSaveTemplateDialogOpen(false);
        setTemplateName('');
        fetchTemplatesAndDrafts();
      }
    } catch (error: any) {
      console.error('Unexpected error saving template:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleLoadTemplate = (template: EmailTemplate) => {
    setNotificationSubject(template.subject);
    
    // Check if template has sections (new format) or use legacy format
    if ((template as any).sections && Array.isArray((template as any).sections) && (template as any).sections.length > 0) {
      // Load sections
      setEmailSections((template as any).sections.map((s: any, idx: number) => ({
        id: (Date.now() + idx).toString(),
        message: s.message || '',
        images: s.images || []
      })));
    } else {
      // Legacy format: convert message and images to a single section
      setEmailSections([{
        id: Date.now().toString(),
        message: template.message || '',
        images: template.images || []
      }]);
    }
    
    setNotificationMessage(template.message); // Keep for backward compatibility
    setEmailImages(template.images || []); // Keep for backward compatibility
    
    if (template.recipient_type) {
      setNotificationRecipients(template.recipient_type);
    }
    setLoadTemplateDialogOpen(false);
    toast({
      title: "Template loaded",
      description: `"${template.name}" has been loaded`,
    });
  };

  const handleDeleteTemplate = async (templateId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error deleting template:', error);
        toast({
          title: "Error",
          description: "Failed to delete template",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Template deleted successfully",
        });
        fetchTemplatesAndDrafts();
      }
    } catch (error: any) {
      console.error('Unexpected error deleting template:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleSendNotification = async () => {
    if (!notificationSubject.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the subject",
        variant: "destructive",
      });
      return;
    }

    // Check if at least one section has content
    const hasContent = emailSections.some(s => s.message.trim() || s.images.length > 0);
    if (!hasContent) {
      toast({
        title: "Error",
        description: "Please add at least one section with content",
        variant: "destructive",
      });
      return;
    }

    if (!notificationRecipients) {
      return;
    }

    const selectedIds = notificationRecipients === 'students' ? selectedStudents : selectedInstructors;
    if (selectedIds.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one recipient",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      const recipientList = notificationRecipients === 'students' ? studentsList : instructorsList;
      const selectedRecipients = recipientList.filter(user => selectedIds.has(user.id));
      const emails = selectedRecipients.map(user => user.email);
      
      // Combine all sections into a single message with images
      const allImages = emailSections.flatMap(s => s.images);
      
      // Combine messages from all sections
      const combinedMessage = emailSections
        .map((section, idx) => {
          let sectionText = section.message.trim();
          if (section.images.length > 0 && sectionText) {
            sectionText += `\n\n[${section.images.length} image(s) attached to this section]`;
          } else if (section.images.length > 0) {
            sectionText = `[${section.images.length} image(s) in this section]`;
          }
          return sectionText;
        })
        .filter(text => text)
        .join('\n\n---\n\n');

      const { error } = await sendCustomEmail({
        emails,
        subject: notificationSubject,
        message: combinedMessage,
        recipientType: notificationRecipients,
        images: allImages.length > 0 ? allImages : undefined,
        sections: emailSections.map(s => ({
          message: s.message,
          images: s.images
        })),
      });

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Email sent to ${emails.length} ${notificationRecipients === 'students' ? 'student(s)' : 'organizer(s)'}`,
        });
        setNotificationDialogOpen(false);
        setNotificationSubject('');
        setNotificationMessage('');
        setEmailImages([]);
        setEmailSections([{ id: '1', message: '', images: [] }]);
        // Clear selections after sending
        if (notificationRecipients === 'students') {
          setSelectedStudents(new Set());
        } else {
          setSelectedInstructors(new Set());
        }
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero pb-20">
        <div className="bg-gradient-primary text-white px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2 bg-white/20" />
              <Skeleton className="h-5 w-64 bg-white/20" />
            </div>
            <Skeleton className="h-10 w-24 bg-white/20" />
          </div>
        </div>
        <div className="px-4 sm:px-6 -mt-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 text-center">
                  <Skeleton className="h-8 w-20 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Admin Dashboard</h1>
            <p className="text-white/90 text-sm sm:text-lg">Monitor and manage platform activity</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 w-full sm:w-auto"
            size="sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 -mt-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={DollarSign}
            value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            label="Total Revenue"
            variant="revenue"
          />
          <StatCard
            icon={BookOpen}
            value={totalBookings}
            label="Total Bookings"
            variant="bookings"
          />
          <StatCard
            icon={GraduationCap}
            value={totalInstructors}
            label="Organizers"
            variant="default"
            onClick={handleInstructorsCardClick}
            tooltip="Tap to view"
            thumbnails={recentInstructors
              .filter(i => i.avatar_url)
              .map(i => i.avatar_url)
              .slice(0, 4)}
          />
          <StatCard
            icon={Users}
            value={totalStudents}
            label="Attendees"
            variant="students"
            onClick={handleStudentsCardClick}
            tooltip="Tap to view"
            thumbnails={recentStudents
              .filter(s => s.avatar_url)
              .map(s => s.avatar_url)
              .slice(0, 4)}
          />
          <StatCard
            icon={MapPin}
            value={totalLocationOwners}
            label="Venues"
            variant="default"
            onClick={handleLocationOwnersCardClick}
            tooltip="Tap to view"
            thumbnails={recentVenues
              .filter(v => v.photos && v.photos.length > 0)
              .map(v => v.photos[0])
              .slice(0, 4)}
          />
        </div>

        {/* Draft Events and Venues Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <StatCard
            icon={Calendar}
            value={draftEvents.length}
            label="Draft Events"
            variant="default"
            onClick={() => setDraftEventsDialogOpen(true)}
            tooltip="Tap to view"
            thumbnails={recentDraftEvents
              .filter(e => e.image)
              .map(e => e.image!)
              .slice(0, 4)}
          />
          <StatCard
            icon={MapPin}
            value={draftVenues.length}
            label="Draft Venues"
            variant="default"
            onClick={() => setDraftVenuesDialogOpen(true)}
            tooltip="Tap to view"
            thumbnails={recentDraftVenues
              .filter(v => v.photos && v.photos.length > 0)
              .map(v => v.photos[0])
              .slice(0, 4)}
          />
        </div>

        {/* Affiliate Program Manager Card */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Affiliate Program Manager</h3>
                  <p className="text-sm text-muted-foreground">Manage affiliates, campaigns, referrals, and payouts</p>
                </div>
                <Button onClick={() => navigate('/admin/affiliates')}>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Open Manager
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4">Recent Bookings</h2>
            
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Skill Level</th>
                    <th className="text-left p-3">Retreat</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-muted-foreground">
                        No bookings yet
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-medium">{booking.full_name}</td>
                        <td className="p-3 text-muted-foreground">{booking.email}</td>
                        <td className="p-3 text-muted-foreground">{booking.skill_level}</td>
                        <td className="p-3 text-muted-foreground">
                          {booking.retreat?.title || `Retreat #${booking.retreat_id}`}
                        </td>
                        <td className="p-3 text-right font-semibold">
                          ${Number(booking.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3">
              {recentBookings.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No bookings yet
                </div>
              ) : (
                recentBookings.map((booking) => (
                  <Card key={booking.id} className="border">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{booking.full_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{booking.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="pt-2 border-t space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span>{new Date(booking.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Skill Level:</span>
                          <span>{booking.skill_level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Retreat:</span>
                          <span className="text-right max-w-[60%] truncate">
                            {booking.retreat?.title || `Retreat #${booking.retreat_id}`}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="text-muted-foreground font-medium">Amount:</span>
                          <span className="font-semibold">
                            ${Number(booking.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Dialog */}
      <Dialog open={studentsDialogOpen} onOpenChange={(open) => {
        setStudentsDialogOpen(open);
        if (!open) {
          setSelectedStudents(new Set());
        }
      }}>
        <DialogContent className="max-w-2xl h-[100vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 m-0 sm:m-auto rounded-none sm:rounded-lg w-full sm:w-auto left-0 top-0 sm:left-[50%] sm:top-[50%] translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] [&>button:last-child]:hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
            <DialogTitle className="sr-only">Students ({totalStudents})</DialogTitle>
            <DialogDescription className="sr-only">List of students with selection options</DialogDescription>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-base sm:text-lg font-semibold whitespace-nowrap">
              Students ({totalStudents})
                </span>
                {selectedStudents.size > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    ({selectedStudents.size} selected)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Button
                  onClick={toggleAllStudents}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm gap-1 sm:gap-2 whitespace-nowrap"
                >
                  {selectedStudents.size === studentsList.length && studentsList.length > 0 ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={() => handleNotificationClick('students')}
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm gap-1 sm:gap-2"
                  disabled={selectedStudents.size === 0}
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Notify</span>
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {loadingStudents ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading students...</p>
              </div>
            ) : studentsList.length === 0 ? (
              <div className="text-center p-8">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No students found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold w-12">
                          <Checkbox
                            checked={selectedStudents.size === studentsList.length && studentsList.length > 0}
                            onCheckedChange={toggleAllStudents}
                          />
                        </th>
                        <th className="text-left p-3 font-semibold">Name</th>
                        <th className="text-left p-3 font-semibold">Email</th>
                        <th className="text-left p-3 font-semibold">Signed Up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList.map((student) => (
                        <tr key={student.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                          </td>
                          <td className="p-3 font-medium">{student.full_name || 'N/A'}</td>
                          <td className="p-3 text-muted-foreground">{student.email}</td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(student.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {studentsList.map((student) => (
                    <Card key={student.id} className="border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                          <p className="font-semibold text-sm">{student.full_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-all">{student.email}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Signed Up:</span>
                            <span>{new Date(student.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructors Dialog */}
      <Dialog open={instructorsDialogOpen} onOpenChange={(open) => {
        setInstructorsDialogOpen(open);
        if (!open) {
          setSelectedInstructors(new Set());
        }
      }}>
        <DialogContent className="max-w-2xl h-[100vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 m-0 sm:m-auto rounded-none sm:rounded-lg w-full sm:w-auto left-0 top-0 sm:left-[50%] sm:top-[50%] translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] [&>button:last-child]:hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
            <DialogTitle className="sr-only">Instructors ({totalInstructors})</DialogTitle>
            <DialogDescription className="sr-only">List of instructors with selection options</DialogDescription>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-base sm:text-lg font-semibold whitespace-nowrap">
              Instructors ({totalInstructors})
                </span>
                {selectedInstructors.size > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    ({selectedInstructors.size} selected)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Button
                  onClick={toggleAllInstructors}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm gap-1 sm:gap-2 whitespace-nowrap"
                >
                  {selectedInstructors.size === instructorsList.length && instructorsList.length > 0 ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={() => handleAssignDiscount('instructors')}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm gap-1 sm:gap-2"
                  disabled={selectedInstructors.size === 0}
                >
                  <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Discount</span>
                </Button>
                <Button
                  onClick={() => handleNotificationClick('organizers')}
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm gap-1 sm:gap-2"
                  disabled={selectedInstructors.size === 0}
                >
                  <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Notify</span>
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {loadingInstructors ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading instructors...</p>
              </div>
            ) : instructorsList.length === 0 ? (
              <div className="text-center p-8">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No instructors found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold w-12">
                          <Checkbox
                            checked={selectedInstructors.size === instructorsList.length && instructorsList.length > 0}
                            onCheckedChange={toggleAllInstructors}
                          />
                        </th>
                        <th className="text-left p-3 font-semibold">Name</th>
                        <th className="text-left p-3 font-semibold">Email</th>
                        <th className="text-left p-3 font-semibold">Discount</th>
                        <th className="text-left p-3 font-semibold">Signed Up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instructorsList.map((instructor) => (
                        <tr key={instructor.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedInstructors.has(instructor.id)}
                              onCheckedChange={() => toggleInstructorSelection(instructor.id)}
                            />
                          </td>
                          <td className="p-3 font-medium">{instructor.full_name || 'N/A'}</td>
                          <td className="p-3 text-muted-foreground">{instructor.email}</td>
                          <td className="p-3">
                            {instructor.discount ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {instructor.discount.type === 'percentage' 
                                    ? `${instructor.discount.value}%` 
                                    : `$${instructor.discount.value}`}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleRemoveDiscount(instructor.id, 'instructors')}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(instructor.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {instructorsList.map((instructor) => (
                    <Card key={instructor.id} className="border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedInstructors.has(instructor.id)}
                            onCheckedChange={() => toggleInstructorSelection(instructor.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                          <p className="font-semibold text-sm">{instructor.full_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-all">{instructor.email}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Discount:</span>
                            {instructor.discount ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {instructor.discount.type === 'percentage' 
                                    ? `${instructor.discount.value}%` 
                                    : `$${instructor.discount.value}`}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => handleRemoveDiscount(instructor.id, 'instructors')}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Signed Up:</span>
                            <span>{new Date(instructor.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Owners Dialog */}
      <Dialog open={locationOwnersDialogOpen} onOpenChange={(open) => {
        setLocationOwnersDialogOpen(open);
        if (!open) {
          setSelectedLocationOwners(new Set());
        }
      }}>
        <DialogContent className="max-w-2xl h-[100vh] sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 m-0 sm:m-auto rounded-none sm:rounded-lg w-full sm:w-auto left-0 top-0 sm:left-[50%] sm:top-[50%] translate-x-0 translate-y-0 sm:translate-x-[-50%] sm:translate-y-[-50%] [&>button:last-child]:hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
            <DialogTitle className="sr-only">Location Owners ({totalLocationOwners})</DialogTitle>
            <DialogDescription className="sr-only">List of location owners with selection options</DialogDescription>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-base sm:text-lg font-semibold whitespace-nowrap">
              Location Owners ({totalLocationOwners})
                </span>
                {selectedLocationOwners.size > 0 && (
                  <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    ({selectedLocationOwners.size} selected)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Button
                  onClick={toggleAllLocationOwners}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm gap-1 sm:gap-2 whitespace-nowrap"
                >
                  {selectedLocationOwners.size === locationOwnersList.length && locationOwnersList.length > 0 ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={() => handleAssignDiscount('location_owners')}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 sm:px-3 text-xs sm:text-sm gap-1 sm:gap-2"
                  disabled={selectedLocationOwners.size === 0}
                >
                  <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Discount</span>
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {loadingLocationOwners ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading location owners...</p>
              </div>
            ) : locationOwnersList.length === 0 ? (
              <div className="text-center p-8">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No location owners found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold w-12">
                          <Checkbox
                            checked={selectedLocationOwners.size === locationOwnersList.length && locationOwnersList.length > 0}
                            onCheckedChange={toggleAllLocationOwners}
                          />
                        </th>
                        <th className="text-left p-3 font-semibold">Name</th>
                        <th className="text-left p-3 font-semibold">Email</th>
                        <th className="text-left p-3 font-semibold">Discount</th>
                        <th className="text-left p-3 font-semibold">Signed Up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locationOwnersList.map((locationOwner) => (
                        <tr key={locationOwner.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3">
                            <Checkbox
                              checked={selectedLocationOwners.has(locationOwner.id)}
                              onCheckedChange={() => toggleLocationOwnerSelection(locationOwner.id)}
                            />
                          </td>
                          <td className="p-3 font-medium">{locationOwner.full_name || 'N/A'}</td>
                          <td className="p-3 text-muted-foreground">{locationOwner.email}</td>
                          <td className="p-3">
                            {locationOwner.discount ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {locationOwner.discount.type === 'percentage' 
                                    ? `${locationOwner.discount.value}%` 
                                    : `$${locationOwner.discount.value}`}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleRemoveDiscount(locationOwner.id, 'location_owners')}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(locationOwner.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {locationOwnersList.map((locationOwner) => (
                    <Card key={locationOwner.id} className="border">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedLocationOwners.has(locationOwner.id)}
                            onCheckedChange={() => toggleLocationOwnerSelection(locationOwner.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                          <p className="font-semibold text-sm">{locationOwner.full_name || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-all">{locationOwner.email}</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Discount:</span>
                            {locationOwner.discount ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {locationOwner.discount.type === 'percentage' 
                                    ? `${locationOwner.discount.value}%` 
                                    : `$${locationOwner.discount.value}`}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => handleRemoveDiscount(locationOwner.id, 'location_owners')}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">None</span>
                            )}
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Signed Up:</span>
                            <span>{new Date(locationOwner.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={(open) => {
        setNotificationDialogOpen(open);
        if (!open) {
          setEmailImages([]);
          setEmailSections([{ id: '1', message: '', images: [] }]);
        }
      }}>
        <DialogContent className="max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Send Notification to {notificationRecipients === 'students' ? 'Students' : 'Organizers'}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center justify-between">
                {notificationRecipients && (
                  <span>
                    Sending to {notificationRecipients === 'students' ? selectedStudents.size : selectedInstructors.size} selected {notificationRecipients === 'students' ? 'student(s)' : 'organizer(s)'}
                  </span>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLoadTemplateDialogOpen(true)}
                    disabled={sendingEmail}
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Load
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTemplateName('');
                      setSaveTemplateDialogOpen(true);
                    }}
                    disabled={sendingEmail || !notificationSubject.trim() || !emailSections.some(s => s.message.trim() || s.images.length > 0)}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-subject">Subject</Label>
              <Input
                id="notification-subject"
                placeholder="Enter email subject"
                value={notificationSubject}
                onChange={(e) => setNotificationSubject(e.target.value)}
                disabled={sendingEmail}
              />
            </div>

            {/* Email Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email Sections</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmailSection}
                  disabled={sendingEmail}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Section
                </Button>
              </div>

              {emailSections.map((section, sectionIndex) => (
                <Card key={section.id} className="border-2">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Section {sectionIndex + 1}
                        </span>
                      </div>
                      {emailSections.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEmailSection(section.id)}
                          disabled={sendingEmail}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`section-message-${section.id}`}>Message</Label>
                      <Textarea
                        id={`section-message-${section.id}`}
                        placeholder="Enter message for this section..."
                        value={section.message}
                        onChange={(e) => updateSectionMessage(section.id, e.target.value)}
                        disabled={sendingEmail}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Images (Optional)</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSectionImageUpload(e, section.id)}
                          disabled={sendingEmail || uploadingSectionImages[section.id]}
                          className="hidden"
                          id={`section-images-upload-${section.id}`}
                        />
                        <label
                          htmlFor={`section-images-upload-${section.id}`}
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          {uploadingSectionImages[section.id] ? (
                            <>
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">Click to add images</span>
                              <span className="text-xs text-muted-foreground">Max 5MB per image</span>
                            </>
                          )}
                        </label>
                      </div>

                      {/* Section Image Previews */}
                      {section.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                          {section.images.map((imageUrl, imageIndex) => (
                            <div key={imageIndex} className="relative border rounded-lg overflow-hidden group">
                              <img 
                                src={imageUrl} 
                                alt={`Section ${sectionIndex + 1} image ${imageIndex + 1}`} 
                                className="w-full h-32 object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeSectionImage(section.id, imageIndex)}
                                disabled={sendingEmail}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 p-6 border-t shrink-0">
            <Button
              variant="outline"
              onClick={() => setNotificationDialogOpen(false)}
              disabled={sendingEmail}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={sendingEmail || !notificationSubject.trim() || !emailSections.some(s => s.message.trim() || s.images.length > 0)}
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Template/Draft Dialog */}
      <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template or Draft</DialogTitle>
            <DialogDescription>
              Save your current email composition for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                placeholder="Enter template name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={savingTemplate}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSaveTemplateDialogOpen(false);
                  setTemplateName('');
                }}
                disabled={savingTemplate}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSaveAsTemplate('draft')}
                disabled={savingTemplate || !templateName.trim()}
              >
                {savingTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </Button>
              <Button
                onClick={() => handleSaveAsTemplate('template')}
                disabled={savingTemplate || !templateName.trim()}
              >
                {savingTemplate ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save as Template'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load Template/Draft Dialog */}
      <Dialog open={loadTemplateDialogOpen} onOpenChange={setLoadTemplateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Load Template or Draft</DialogTitle>
            <DialogDescription>
              Select a saved template or draft to load
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {loadingTemplates ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Templates Section */}
                {templates.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Templates ({templates.length})
                    </h3>
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <Card key={template.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{template.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {template.subject}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(template.updated_at).toLocaleDateString()}
                                  {template.images && template.images.length > 0 && (
                                    <span className="ml-2">• {template.images.length} image(s)</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => handleLoadTemplate(template)}
                                >
                                  Load
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteTemplate(template.id, template.name)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drafts Section */}
                {drafts.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Drafts ({drafts.length})
                    </h3>
                    <div className="space-y-2">
                      {drafts.map((draft) => (
                        <Card key={draft.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{draft.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {draft.subject}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(draft.updated_at).toLocaleDateString()}
                                  {draft.images && draft.images.length > 0 && (
                                    <span className="ml-2">• {draft.images.length} image(s)</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => handleLoadTemplate(draft)}
                                >
                                  Load
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteTemplate(draft.id, draft.name)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {templates.length === 0 && drafts.length === 0 && (
                  <div className="text-center p-8">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No templates or drafts saved yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setLoadTemplateDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draft Events Dialog */}
      <Dialog open={draftEventsDialogOpen} onOpenChange={setDraftEventsDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Draft Events ({draftEvents.length})
            </DialogTitle>
            <DialogDescription>
              View-only access to draft events. Click on an event to view its details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loadingDrafts ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading draft events...</p>
              </div>
            ) : draftEvents.length === 0 ? (
              <div className="text-center p-8">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No draft events found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {draftEvents.map((event) => (
                  <Card key={event.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{event.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Event ID: {event.id}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {new Date(event.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigate(`/retreat/${event.id}`);
                            setDraftEventsDialogOpen(false);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Draft Venues Dialog */}
      <Dialog open={draftVenuesDialogOpen} onOpenChange={setDraftVenuesDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Draft Venues ({draftVenues.length})
            </DialogTitle>
            <DialogDescription>
              View-only access to draft venues. Click on a venue to view its details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {loadingDrafts ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading draft venues...</p>
              </div>
            ) : draftVenues.length === 0 ? (
              <div className="text-center p-8">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No draft venues found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {draftVenues.map((venue) => (
                  <Card key={venue.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{venue.property_name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Venue ID: {venue.id}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last updated: {new Date(venue.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            setLoadingVenueDetails(true);
                            try {
                              const { data, error } = await supabase
                                .from('properties')
                                .select('*')
                                .eq('id', venue.id)
                                .single();
                              
                              if (error) throw error;
                              
                              setSelectedVenue(data);
                              setViewVenueDialogOpen(true);
                            } catch (error) {
                              console.error('Error fetching venue details:', error);
                              toast({
                                title: "Error",
                                description: "Failed to load venue details",
                                variant: "destructive",
                              });
                            } finally {
                              setLoadingVenueDetails(false);
                            }
                          }}
                          disabled={loadingVenueDetails}
                        >
                          {loadingVenueDetails ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Eye className="w-4 h-4 mr-2" />
                          )}
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Venue Details Dialog */}
      <Dialog open={viewVenueDialogOpen} onOpenChange={setViewVenueDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedVenue?.property_name || 'Venue Details'}
            </DialogTitle>
            <DialogDescription>
              View-only access to draft venue details
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {selectedVenue ? (
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedVenue.property_name}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {selectedVenue.location || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span> 
                      <Badge className="ml-2">{selectedVenue.status}</Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedVenue.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{selectedVenue.description}</p>
                  </div>
                )}

                {/* Photos */}
                {selectedVenue.photos && selectedVenue.photos.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Photos ({selectedVenue.photos.length})</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {selectedVenue.photos.map((photo: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img 
                            src={photo} 
                            alt={`Venue photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Capacity */}
                <div>
                  <h3 className="font-semibold mb-2">Capacity</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Sleeps:</span> {selectedVenue.sleeps || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Max Quilters:</span> {selectedVenue.max_quilters || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Sewing Room Details */}
                {selectedVenue.dedicated_sewing_room && (
                  <div>
                    <h3 className="font-semibold mb-2">Sewing Room</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Dedicated Sewing Room:</span> Yes
                      </div>
                      {selectedVenue.max_sewing_stations && (
                        <div>
                          <span className="font-medium">Max Sewing Stations:</span> {selectedVenue.max_sewing_stations}
                        </div>
                      )}
                      {selectedVenue.cutting_stations && (
                        <div>
                          <span className="font-medium">Cutting Stations:</span> {selectedVenue.cutting_stations}
                        </div>
                      )}
                      {selectedVenue.pressing_stations && (
                        <div>
                          <span className="font-medium">Pressing Stations:</span> {selectedVenue.pressing_stations}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  <div>Created: {new Date(selectedVenue.created_at).toLocaleString()}</div>
                  <div>Last Updated: {new Date(selectedVenue.updated_at).toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 p-6 border-t shrink-0">
            <Button variant="outline" onClick={() => setViewVenueDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Assignment Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Assign Discount to {discountRecipientType === 'instructors' ? 'Organizers' : 'Venues'}
            </DialogTitle>
            <DialogDescription>
              Assign a discount to {discountRecipientType === 'instructors' 
                ? selectedInstructors.size 
                : selectedLocationOwners.size} selected {discountRecipientType === 'instructors' ? 'organizer(s)' : 'venue(s)'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="discount-type">Discount Type</Label>
              <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                <SelectTrigger id="discount-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount-value">
                Discount Value {discountType === 'percentage' ? '(0-100)' : '($)'}
              </Label>
              <Input
                id="discount-value"
                type="number"
                step={discountType === 'percentage' ? '0.01' : '0.01'}
                min="0"
                max={discountType === 'percentage' ? '100' : undefined}
                placeholder={discountType === 'percentage' ? '10' : '50'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                disabled={assigningDiscount}
              />
              <p className="text-xs text-muted-foreground">
                {discountType === 'percentage' 
                  ? 'Enter a percentage (e.g., 10 for 10% off)' 
                  : 'Enter a fixed dollar amount (e.g., 50 for $50 off)'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setDiscountDialogOpen(false);
                setDiscountValue('');
              }}
              disabled={assigningDiscount}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDiscount}
              disabled={assigningDiscount || !discountValue.trim() || isNaN(Number(discountValue)) || Number(discountValue) <= 0}
            >
              {assigningDiscount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Tag className="w-4 h-4 mr-2" />
                  Assign Discount
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

