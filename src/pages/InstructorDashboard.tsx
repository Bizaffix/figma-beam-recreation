import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RetreatCard } from "@/components/RetreatCard";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Retreat {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  total_spots: number;
  spots_available: number;
  image: string;
  includes: string[];
  schedule: { day: string; activities: string }[];
  published: boolean;
  instructor_id: string;
}

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [allRetreats, setAllRetreats] = useState<Retreat[]>([]);
  const [loading, setLoading] = useState(true);

  // Only show this page to instructors
  if (role !== 'instructor') {
    return null;
  }

  // Fetch retreats from Supabase
  useEffect(() => {
    const fetchRetreats = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('retreats')
          .select('*')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching retreats:', error);
          toast({
            title: "Error",
            description: "Failed to load retreats",
            variant: "destructive",
          });
        } else {
          setAllRetreats(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRetreats();
  }, [user, toast]);

  const handleTogglePublish = async (id: number) => {
    const retreat = allRetreats.find(r => r.id === id);
    if (!retreat || !user) return;

    try {
      const { error } = await supabase
        .from('retreats')
        .update({ published: !retreat.published })
        .eq('id', id)
        .eq('instructor_id', user.id);

      if (error) {
        console.error('Error updating retreat:', error);
        toast({
          title: "Error",
          description: "Failed to update retreat status",
          variant: "destructive",
        });
      } else {
        setAllRetreats(prev => prev.map(r => 
          r.id === id ? { ...r, published: !r.published } : r
        ));
        toast({
          title: "Success",
          description: retreat.published ? "Retreat unpublished" : "Retreat published",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this retreat?')) {
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('retreats')
        .delete()
        .eq('id', id)
        .eq('instructor_id', user.id);

      if (error) {
        console.error('Error deleting retreat:', error);
        toast({
          title: "Error",
          description: "Failed to delete retreat",
          variant: "destructive",
        });
      } else {
        setAllRetreats(prev => prev.filter(r => r.id !== id));
        toast({
          title: "Success",
          description: "Retreat deleted successfully",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const publishedCount = allRetreats.filter(r => r.published).length;
  const unpublishedCount = allRetreats.filter(r => !r.published).length;

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Instructor Dashboard</h1>
        <p className="text-white/90 text-lg">Manage your retreats and events</p>
      </div>

      {/* Stats */}
      <div className="px-6 -mt-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-card-foreground">{allRetreats.length}</p>
              <p className="text-sm text-muted-foreground">Total Retreats</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-card-foreground">{publishedCount}</p>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create New Button */}
      <div className="px-6 mb-6">
        <Button 
          className="w-full h-12 text-lg"
          onClick={() => navigate('/instructor/retreats/new')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Retreat
        </Button>
      </div>

      {/* Retreats List */}
      <div className="px-6 space-y-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">Loading retreats...</p>
          </div>
        ) : allRetreats.length > 0 ? (
          allRetreats.map((retreat) => (
            <Card key={retreat.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={retreat.image || "/placeholder.svg"}
                  alt={retreat.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className={retreat.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                    {retreat.published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-5">
                <h3 className="text-xl font-semibold text-card-foreground mb-4">{retreat.title}</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/instructor/retreats/${retreat.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePublish(retreat.id)}
                  >
                    {retreat.published ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(retreat.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>{retreat.location} • {retreat.date}</p>
                  <p className="mt-1">{retreat.spots_available} of {retreat.total_spots} spots available</p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">No retreats yet. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default InstructorDashboard;

