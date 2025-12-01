import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Users, GraduationCap, DollarSign, BookOpen, Loader2, Bell, X } from "lucide-react";
import { sendCustomEmail } from "@/lib/email-notifications";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [instructorsDialogOpen, setInstructorsDialogOpen] = useState(false);
  const [studentsList, setStudentsList] = useState<UserProfile[]>([]);
  const [instructorsList, setInstructorsList] = useState<UserProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [notificationRecipients, setNotificationRecipients] = useState<'students' | 'instructors' | null>(null);
  const [notificationSubject, setNotificationSubject] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedInstructors, setSelectedInstructors] = useState<Set<string>>(new Set());

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
        .select('id, full_name, email, created_at')
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

  const handleNotificationClick = (recipientType: 'students' | 'instructors') => {
    const selected = recipientType === 'students' ? selectedStudents : selectedInstructors;
    if (selected.size === 0) {
      toast({
        title: "No recipients selected",
        description: `Please select at least one ${recipientType === 'students' ? 'student' : 'instructor'} to notify`,
        variant: "destructive",
      });
      return;
    }
    setNotificationRecipients(recipientType);
    setNotificationSubject('');
    setNotificationMessage('');
    setNotificationDialogOpen(true);
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

  const handleSendNotification = async () => {
    if (!notificationSubject.trim() || !notificationMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message",
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
      
      const { error } = await sendCustomEmail({
        emails,
        subject: notificationSubject,
        message: notificationMessage,
        recipientType: notificationRecipients,
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
          description: `Email sent to ${emails.length} ${notificationRecipients === 'students' ? 'student(s)' : 'instructor(s)'}`,
        });
        setNotificationDialogOpen(false);
        setNotificationSubject('');
        setNotificationMessage('');
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="w-5 h-5 text-muted-foreground mr-2" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-card-foreground mb-1">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5 text-muted-foreground mr-2" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-card-foreground mb-1">{totalBookings}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
          <Card 
            className="group cursor-pointer hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
            onClick={handleInstructorsCardClick}
          >
            <CardContent className="p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <GraduationCap className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 mr-2" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-card-foreground mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">{totalInstructors}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Instructors</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">Tap to view</p>
            </CardContent>
          </Card>
          <Card 
            className="group cursor-pointer hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/20 dark:hover:to-pink-950/20 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
            onClick={handleStudentsCardClick}
          >
            <CardContent className="p-4 sm:p-5 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 mr-2" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-card-foreground mb-1 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-300">{totalStudents}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Students</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">Tap to view</p>
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
                  onClick={() => handleNotificationClick('instructors')}
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
                        <div className="pt-2 border-t">
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

      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Send Notification to {notificationRecipients === 'students' ? 'Students' : 'Instructors'}
            </DialogTitle>
            <DialogDescription>
              {notificationRecipients && (
                <span>
                  Sending to {notificationRecipients === 'students' ? selectedStudents.size : selectedInstructors.size} selected {notificationRecipients === 'students' ? 'student(s)' : 'instructor(s)'}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <div className="space-y-2">
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                placeholder="Enter your message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                disabled={sendingEmail}
                rows={8}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setNotificationDialogOpen(false)}
                disabled={sendingEmail}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={sendingEmail || !notificationSubject.trim() || !notificationMessage.trim()}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

