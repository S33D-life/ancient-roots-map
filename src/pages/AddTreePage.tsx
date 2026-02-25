import { useState, useEffect } from "react";
import AddTreeDialog from "@/components/AddTreeDialog";
import { useNavigate } from "react-router-dom";

const AddTreePage = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      // User closed the dialog — go back or to map
      navigate("/map");
    }
  }, [open, navigate]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at center, hsl(var(--background)), hsl(var(--card) / 0.95))",
      }}
    >
      <AddTreeDialog open={open} onOpenChange={setOpen} latitude={null} longitude={null} />
    </div>
  );
};

export default AddTreePage;
