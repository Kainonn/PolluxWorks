import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Search,
    X,
} from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// Types
export interface Column<T> {
    key: string;
    header: string | React.ReactNode;
    cell: (item: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface PaginationData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links?: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pagination?: PaginationData;
    searchValue?: string;
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    onSearch?: (e: React.FormEvent) => void;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];
    isLoading?: boolean;
    emptyState?: React.ReactNode;
    getRowKey: (item: T) => string | number;
    rowClassName?: (item: T) => string;
    toolbar?: React.ReactNode;
    showPerPageSelector?: boolean;
}

export function DataTable<T>({
    data,
    columns,
    pagination,
    searchValue = '',
    searchPlaceholder = 'Search...',
    onSearchChange,
    onSearch,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
    isLoading = false,
    emptyState,
    getRowKey,
    rowClassName,
    toolbar,
    showPerPageSelector = true,
}: DataTableProps<T>) {
    const [localSearch, setLocalSearch] = React.useState(searchValue);

    React.useEffect(() => {
        setLocalSearch(searchValue);
    }, [searchValue]);

    const handleSearchChange = (value: string) => {
        setLocalSearch(value);
        onSearchChange?.(value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(e);
    };

    const handleClearSearch = () => {
        setLocalSearch('');
        onSearchChange?.('');
    };

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Search */}
                {onSearchChange && (
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={localSearch}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {localSearch && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>
                )}

                {/* Custom toolbar */}
                {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            {columns.map((column) => (
                                <TableHead
                                    key={column.key}
                                    className={cn('font-semibold', column.headerClassName)}
                                >
                                    {column.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    <div className="flex items-center justify-center">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyState || (
                                        <p className="text-muted-foreground">No results found.</p>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow
                                    key={getRowKey(item)}
                                    className={cn('group', rowClassName?.(item))}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column.key} className={column.className}>
                                            {column.cell(item)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.last_page > 1 && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {pagination.from || 0} to {pagination.to || 0} of{' '}
                            {pagination.total} results
                        </p>
                        {showPerPageSelector && onPerPageChange && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Show</span>
                                <Select
                                    value={String(pagination.per_page)}
                                    onValueChange={(value) => onPerPageChange(Number(value))}
                                >
                                    <SelectTrigger className="h-8 w-17.5">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {perPageOptions.map((option) => (
                                            <SelectItem key={option} value={String(option)}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === 1}
                            onClick={() => onPageChange?.(1)}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === 1}
                            onClick={() => onPageChange?.(pagination.current_page - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {generatePageNumbers(pagination.current_page, pagination.last_page).map(
                                (page, idx) =>
                                    page === '...' ? (
                                        <span
                                            key={`ellipsis-${idx}`}
                                            className="px-2 text-muted-foreground"
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <Button
                                            key={page}
                                            variant={
                                                pagination.current_page === page
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onPageChange?.(page as number)}
                                        >
                                            {page}
                                        </Button>
                                    )
                            )}
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => onPageChange?.(pagination.current_page + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => onPageChange?.(pagination.last_page)}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(
    currentPage: number,
    lastPage: number
): (number | string)[] {
    const pages: (number | string)[] = [];
    const delta = 2;

    const left = Math.max(1, currentPage - delta);
    const right = Math.min(lastPage, currentPage + delta);

    if (left > 1) {
        pages.push(1);
        if (left > 2) {
            pages.push('...');
        }
    }

    for (let i = left; i <= right; i++) {
        pages.push(i);
    }

    if (right < lastPage) {
        if (right < lastPage - 1) {
            pages.push('...');
        }
        pages.push(lastPage);
    }

    return pages;
}

export default DataTable;
