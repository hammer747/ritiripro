import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

const doneKey = (email: string) => `ritiri_report_reminder_done_${email}`;

export function shouldShowReportReminder(email: string): boolean {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
  const doneMonth = localStorage.getItem(doneKey(email));
  const isFirstOfMonth = today.getDate() === 1;
  return isFirstOfMonth && doneMonth !== currentMonthKey;
}

interface Props {
  open: boolean;
  onLater: () => void;
  onDone: () => void;
}

export function ReportReminderDialog({ open, onLater, onDone }: Props) {
  const today = new Date();
  const mese = today.toLocaleDateString("it-IT", { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onLater()}>
      <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <FileDown className="h-6 w-6 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Promemoria report mensile</DialogTitle>
          <DialogDescription className="text-center">
            Ricorda di inviare il report di <span className="font-semibold capitalize">{mese}</span> al commercialista.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onLater}>
            Lo farò più tardi
          </Button>
          <Button className="w-full sm:w-auto" onClick={onDone}>
            Fatto ✓
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function markReportDone(email: string) {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
  localStorage.setItem(doneKey(email), currentMonthKey);
}
