import { Suspense } from "react";
import EquipmentPrintContent from "./EquipmentPrintContent";

export default function EquipmentPrintPage() {
  return (
    <Suspense fallback={<div className="p-8">Memuat laporan...</div>}>
      <EquipmentPrintContent />
    </Suspense>
  );
}