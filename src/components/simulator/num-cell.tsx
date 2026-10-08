import type * as React from "react";

import { TableCell } from "@/components/ui/table";

/** Right-aligned table cell with a main value and an optional muted line under it. */
export function NumCell({ main, sub }: { main: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <TableCell className="text-right align-top tabular-nums">
      <div>{main}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </TableCell>
  );
}
