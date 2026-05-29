import { useEffect, useState } from "react";
import { Calendar, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetVenueIcalTokenQuery,
  useRegenerateVenueIcalTokenMutation,
} from "@/services/server";
import {
  clearStoredVenueIcalFeedUrl,
  getStoredVenueIcalFeedUrl,
  setStoredVenueIcalFeedUrl,
} from "@/lib/venue-ical-storage";

type CalendarSyncSectionProps = {
  venueId: string;
};

const COPY_CONFIRMATION =
  "Copied! Paste this URL into Google Calendar, Apple Calendar, or any calendar app that supports iCal subscriptions";

const PRIVACY_NOTE = "Keep your feed URL private — anyone with this URL can see your booking calendar";

export function CalendarSyncSection({ venueId }: CalendarSyncSectionProps) {
  const { data: status, isLoading, isError, error, refetch } = useGetVenueIcalTokenQuery(venueId, {
    skip: !venueId,
  });
  const [regenerateToken, { isLoading: isRegenerating }] = useRegenerateVenueIcalTokenMutation();

  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  useEffect(() => {
    if (!venueId) return;
    setFeedUrl(getStoredVenueIcalFeedUrl(venueId));
  }, [venueId, status?.generated]);

  const isActive = Boolean(status?.generated && feedUrl);
  const isPending = isLoading || isRegenerating;

  const applyTokenResponse = (nextFeedUrl?: string) => {
    if (!nextFeedUrl) return;
    setStoredVenueIcalFeedUrl(venueId, nextFeedUrl);
    setFeedUrl(nextFeedUrl);
  };

  const handleGenerate = async () => {
    setActionError(null);
    setCopyMessage(null);
    try {
      const result = await regenerateToken(venueId).unwrap();
      applyTokenResponse(result.feedUrl);
      await refetch();
    } catch {
      setActionError("We couldn't generate your calendar feed. Please try again.");
    }
  };

  const handleRegenerateConfirm = async () => {
    setRegenerateOpen(false);
    setActionError(null);
    setCopyMessage(null);
    try {
      const result = await regenerateToken(venueId).unwrap();
      clearStoredVenueIcalFeedUrl(venueId);
      applyTokenResponse(result.feedUrl);
      await refetch();
    } catch {
      setActionError("We couldn't regenerate your calendar feed. Please try again.");
    }
  };

  const handleCopy = async () => {
    if (!feedUrl) return;
    setCopyMessage(null);
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopyMessage(COPY_CONFIRMATION);
    } catch {
      setActionError("Couldn't copy to clipboard. Please select the URL and copy manually.");
    }
  };

  const formatGeneratedAt = (value: string | null | undefined) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const generatedLabel = formatGeneratedAt(status?.generatedAt);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar Sync
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading calendar sync settings…</p>
          )}

          {isError && !isLoading && (
            <p className="text-sm text-destructive">
              We couldn't load your calendar sync settings. Please refresh the page and try again.
              {error && "message" in error && typeof error.message === "string" ? ` (${error.message})` : ""}
            </p>
          )}

          {!isLoading && !isError && !status?.generated && (
            <>
              <p className="text-sm text-muted-foreground">
                Subscribe to a private iCal feed of your venue&apos;s confirmed bookings in Google Calendar,
                Apple Calendar, Outlook, or any app that supports calendar subscriptions. Your feed updates
                automatically when bookings change.
              </p>
              <Button type="button" onClick={() => void handleGenerate()} disabled={isPending}>
                {isRegenerating ? "Generating…" : "Generate Feed URL"}
              </Button>
            </>
          )}

          {!isLoading && !isError && status?.generated && !feedUrl && (
            <>
              <p className="text-sm text-muted-foreground">
                Your calendar feed is active
                {generatedLabel ? ` (generated ${generatedLabel})` : ""}. Regenerate to view and copy your
                private feed URL.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegenerateOpen(true)}
                disabled={isPending}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate URL
              </Button>
            </>
          )}

          {!isLoading && !isError && isActive && (
            <>
              <p className="text-sm text-muted-foreground">
                Use this private URL to subscribe to your venue booking calendar in an external calendar app.
              </p>

              <div className="space-y-2">
                <Input value={feedUrl ?? ""} readOnly className="font-mono text-xs" />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => void handleCopy()} disabled={isPending}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegenerateOpen(true)}
                    disabled={isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate URL
                  </Button>
                </div>
              </div>

              {generatedLabel && (
                <p className="text-xs text-muted-foreground">Feed generated: {generatedLabel}</p>
              )}

              <p className="text-xs text-muted-foreground">{PRIVACY_NOTE}</p>
            </>
          )}

          {copyMessage && <p className="text-sm text-green-700 dark:text-green-400">{copyMessage}</p>}

          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
        </CardContent>
      </Card>

      <AlertDialog open={regenerateOpen} onOpenChange={setRegenerateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate your feed URL?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new URL and immediately disable your current one. Any calendar apps subscribed
              to your current URL will stop receiving updates. You will need to resubscribe them using the new
              URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRegenerateConfirm()} disabled={isRegenerating}>
              Yes, regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
