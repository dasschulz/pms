import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusOrder } from "@/types/videoplanung";

// Color schemes for different statuses (matching the actual component)
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Brainstorming':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'Skript':
      return 'bg-red-900 text-red-100 border-red-800';
    case 'Dreh':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Schnitt':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Veröffentlichung':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Erledigt':
      return 'bg-white text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

interface TaskRowSkeletonProps {
  isSubtask?: boolean;
}

function TaskRowSkeleton({ isSubtask = false }: TaskRowSkeletonProps) {
  return (
    <TableRow className={cn("hover:bg-muted/50", isSubtask && "bg-muted/20")}>
      <TableCell>
        <div className={cn("flex items-center gap-1", isSubtask && "ml-6")}>
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell>
        {!isSubtask && (
          <Skeleton className="h-6 w-6" />
        )}
      </TableCell>
      <TableCell className={cn(isSubtask && "pl-8")}>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-20" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-16 rounded-full" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-4 w-20" />
        </div>
      </TableCell>
    </TableRow>
  );
}

interface StatusTableSkeletonProps {
  status: string;
  taskCount?: number;
  isCollapsed?: boolean;
}

function StatusTableSkeleton({ status, taskCount = 3, isCollapsed = false }: StatusTableSkeletonProps) {
  const statusColorClass = getStatusColor(status);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className={cn("flex items-center justify-between p-4", statusColorClass)}>
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4" />
          <h3 className="font-semibold">{status}</h3>
          <Badge variant="outline" className="bg-background/50">
            <Skeleton className="h-4 w-4" />
          </Badge>
        </div>
      </div>

      {!isCollapsed && (
        <div className="bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Fälligkeitsdatum</TableHead>
                <TableHead className="w-32">Nächster Job</TableHead>
                <TableHead className="w-24">Priorität</TableHead>
                <TableHead className="w-32">VÖ-Datum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: taskCount }, (_, index) => (
                <TaskRowSkeleton key={index} />
              ))}
              {/* Add some subtask skeletons for variety */}
              {taskCount > 1 && (
                <TaskRowSkeleton isSubtask />
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function VideoPlanningBoardSkeleton() {
  return (
    <div className="space-y-6">
      {statusOrder.map((status, index) => (
        <StatusTableSkeleton
          key={status}
          status={status}
          taskCount={Math.max(1, 4 - index)} // Vary the number of skeleton rows
          isCollapsed={status === 'Erledigt'}
        />
      ))}
    </div>
  );
} 