import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-white/90 text-lg">Monitor and manage platform activity</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 -mt-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-card-foreground">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-card-foreground">{totalBookings}</p>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-card-foreground">{totalInstructors}</p>
              <p className="text-sm text-muted-foreground">Instructors</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-card-foreground">{totalStudents}</p>
              <p className="text-sm text-muted-foreground">Students</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Recent Bookings</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Skill Level</th>
                    <th className="text-left p-2">Retreat</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-4 text-muted-foreground">
                        No bookings yet
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => (
                      <tr key={booking.id} className="border-b">
                        <td className="p-2 text-muted-foreground">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-2">{booking.full_name}</td>
                        <td className="p-2 text-muted-foreground">{booking.email}</td>
                        <td className="p-2 text-muted-foreground">{booking.skill_level}</td>
                        <td className="p-2 text-muted-foreground">
                          {booking.retreat?.title || `Retreat #${booking.retreat_id}`}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          ${Number(booking.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            booking.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

