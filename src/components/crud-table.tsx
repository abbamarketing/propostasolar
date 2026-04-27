import type { LucideIcon } from "lucide-react";
import { Edit, Power, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type CrudColumn<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type CrudTableProps<T extends { id: string }> = {
  title: string;
  newLabel: string;
  search: string;
  onSearchChange: (value: string) => void;
  onlyActive?: boolean;
  onOnlyActiveChange?: (value: boolean) => void;
  showActiveFilter?: boolean;
  rows: T[];
  columns: CrudColumn<T>[];
  isLoading: boolean;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  onNew: () => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  deleteLabel?: "Inativar" | "Remover";
  searchPlaceholder?: string;
  extraActions?: ReactNode;
};

const pageSize = 10;

export function CrudTable<T extends { id: string }>({
  title,
  newLabel,
  search,
  onSearchChange,
  onlyActive = true,
  onOnlyActiveChange,
  showActiveFilter = true,
  rows,
  columns,
  isLoading,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onNew,
  onEdit,
  onDelete,
  deleteLabel = "Inativar",
  searchPlaceholder = "Buscar por marca ou modelo",
  extraActions,
}: CrudTableProps<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, rows]);

  function handleSearch(value: string) {
    setPage(1);
    onSearchChange(value);
  }

  return (
    <Card className="shadow-soft">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-black text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">Catálogo base usado na montagem de propostas.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {extraActions}
            <Button onClick={onNew}>{newLabel}</Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder={searchPlaceholder} className="md:max-w-sm" />
          {showActiveFilter ? (
            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Switch checked={onlyActive} onCheckedChange={onOnlyActiveChange} />
              Só ativos
            </label>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} action={<Button onClick={onNew}>{newLabel}</Button>} />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column.header} className={column.className}>{column.header}</TableHead>
                  ))}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column) => (
                      <TableCell key={column.header} className={column.className}>{column.cell(row)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEdit(row)}>
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
                          {deleteLabel === "Inativar" ? <Power className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                          {deleteLabel}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Próxima</Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
