import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

const DONE_KEY = "ritiri_report_reminder_done";
const SHOWN_KEY = "ritiri_report_reminder_shown";

export function shouldShowReportReminder(): boolean {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
  const doneMonth = localStorage.getItem(DONE_KEY);
  const shownMonth = localStorage.getItem(SHOWN_KEY);
  const isFirstOfMonth = today.getDate() === 1;
  return doneMonth !== currentMonthKey && (isFirstOfMonth || shownMonth === currentMonthKey || !doneMonth);
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
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <FileDown className="h-6 w-6 text-primary" />
            </div>
          </div>
          <AlertDialogTitle className="text-center">Promemoria report mensile</AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Ricorda di inviare il report di <span className="font-semibold capitalize">{mese}</span> al commercialista.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" onClick={onLater}>
            Lo farò più tardi
          </Button>
          <Button className="w-full sm:w-auto" onClick={onDone}>
            Fatto ✓
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function markReportDone() {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
  localStorage.setItem(DONE_KEY, currentMonthKey);
}

export function markReportShown() {
  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
  localStorage.setItem(SHOWN_KEY, currentMonthKey);
}
