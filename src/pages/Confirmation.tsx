import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import calendar, { createGoogleCalendarUrl } from "@/lib/calendar";

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const retreat = (location.state as any)?.retreat;
  const booking = (location.state as any)?.booking;

  const email = booking?.email ?? "";

  const handleAddToCalendar = () => {
    const info = {
      title: retreat?.title ?? "Retreat",
      description: retreat?.description ?? "",
      location: retreat?.location ?? "",
      dateRange: retreat?.date,
      email,
    };

    // Trigger ICS download
    try {
      calendar.downloadICS(info);
    } catch (e) {
      // ignore
    }

    // Open Google Calendar in a new tab with prefilled event
    const url = createGoogleCalendarUrl(info);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20 flex items-start justify-center pt-10">
      <div className="w-full max-w-2xl px-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl">✓</div>
          <h1 className="text-2xl font-bold mt-6">You're All Set!</h1>
          <p className="text-muted-foreground mt-2">Your spot has been reserved for {retreat?.title}</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img src={retreat?.image} alt={retreat?.title} className="w-20 h-16 rounded-md object-cover" />
              <div>
                <p className="font-semibold text-card-foreground">{retreat?.title}</p>
                <p className="text-sm text-muted-foreground">{retreat?.date}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-4 text-muted-foreground">
              <p>Confirmation sent to: <span className="text-card-foreground">{email || "(no email provided)"}</span></p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white" onClick={handleAddToCalendar}>
            Add to Calendar
          </Button>

          <Button variant="outline" className="w-full h-12" onClick={() => navigate('/home')}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
