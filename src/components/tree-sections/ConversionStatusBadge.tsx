/**
 * ConversionStatusBadge — Shows the current conversion stage
 * of a research tree with appropriate styling.
 */
import { Badge } from "@/components/ui/badge";
import {
  type ConversionStatus,
  CONVERSION_STATUSES,
} from "@/utils/researchConversion";

interface Props {
  status: ConversionStatus;
  className?: string;
}

const ConversionStatusBadge = ({ status, className = "" }: Props) => {
  const meta = CONVERSION_STATUSES[status];
  return (
    <Badge
      variant="outline"
      className={`font-serif text-xs tracking-wider border-primary/25 bg-primary/10 text-primary gap-1 ${className}`}
    >
      <span>{meta.icon}</span>
      {meta.label}
    </Badge>
  );
};

export default ConversionStatusBadge;
