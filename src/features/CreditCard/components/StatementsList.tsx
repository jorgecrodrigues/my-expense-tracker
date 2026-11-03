import React from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  NativeSelect,
  Skeleton,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  IconArrowDown,
  IconArrowUp,
  IconChevronLeft,
  IconChevronRight,
  IconRefresh,
  IconReportAnalytics,
} from "@tabler/icons-react";
import { useLocation } from "wouter";
import useIsMobile from "@/shared/hooks/useIsMobile";
import { toaster } from "@/components/ui/toaster";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import type {
  CreditCardStatementSortField,
  SortOrder,
} from "../../../../convex/lib/creditCardValidators";
import RemoveStatementDialog from "../modals/RemoveStatement";
import StatementStatusBadge from "./StatementStatusBadge";
import {
  formatCents,
  formatDay,
  formatReferenceMonth,
  issuerLabel,
} from "../utils/creditCard";

const PER_PAGE = 5;
const COLUMNS = 6;

type SortState = { key: CreditCardStatementSortField; direction: SortOrder };

const DEFAULT_SORT: SortState = { key: "uploadedAt", direction: "desc" };

const SORT_OPTIONS: { label: string; sort: SortState }[] = [
  { label: "Recently uploaded", sort: DEFAULT_SORT },
  {
    label: "Month (newest)",
    sort: { key: "referenceMonth", direction: "desc" },
  },
  {
    label: "Month (oldest)",
    sort: { key: "referenceMonth", direction: "asc" },
  },
  { label: "Due date (latest)", sort: { key: "dueDate", direction: "desc" } },
  { label: "Due date (earliest)", sort: { key: "dueDate", direction: "asc" } },
  {
    label: "Total (highest)",
    sort: { key: "totalAmountCents", direction: "desc" },
  },
  {
    label: "Total (lowest)",
    sort: { key: "totalAmountCents", direction: "asc" },
  },
  { label: "Issuer (A-Z)", sort: { key: "issuer", direction: "asc" } },
  { label: "Issuer (Z-A)", sort: { key: "issuer", direction: "desc" } },
];

const sortValue = ({ key, direction }: SortState) => `${key}-${direction}`;

function SortableHeader({
  label,
  sortKey,
  sort,
  onSort,
}: {
  label: string;
  sortKey: CreditCardStatementSortField;
  sort: SortState;
  onSort: (key: CreditCardStatementSortField) => void;
}) {
  const active = sort.key === sortKey;
  return (
    <Table.ColumnHeader
      aria-sort={
        active
          ? sort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <Button
        size="xs"
        variant={active ? "subtle" : "ghost"}
        onClick={() => onSort(sortKey)}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active &&
          (sort.direction === "asc" ? (
            <IconArrowUp size={12} />
          ) : (
            <IconArrowDown size={12} />
          ))}
      </Button>
    </Table.ColumnHeader>
  );
}

function StatementActions({
  statement,
  onView,
  onRetry,
}: {
  statement: Doc<"creditCardStatements">;
  onView: () => void;
  onRetry: () => void;
}) {
  return (
    <HStack gap={1}>
      {statement.status === "completed" && (
        <IconButton
          aria-label="View report"
          title="View report"
          variant="ghost"
          size="sm"
          onClick={onView}
        >
          <IconReportAnalytics />
        </IconButton>
      )}
      {statement.status === "failed" && (
        <IconButton
          aria-label="Process again"
          title="Process again"
          variant="ghost"
          size="sm"
          onClick={onRetry}
        >
          <IconRefresh />
        </IconButton>
      )}
      <RemoveStatementDialog statement={statement} />
    </HStack>
  );
}

const formatTotal = (statement: Doc<"creditCardStatements">) =>
  statement.totalAmountCents !== undefined
    ? formatCents(statement.totalAmountCents)
    : "-";

export default function StatementsList() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const retryStatement = useMutation(api.creditCardStatements.retryStatement);
  const [sort, setSort] = React.useState<SortState>(DEFAULT_SORT);
  // One cursor per visited page; the last one is the current page.
  const [cursors, setCursors] = React.useState<(string | null)[]>([null]);
  const pageIndex = cursors.length - 1;

  const sortArgs = { sortBy: sort.key, order: sort.direction };
  const currentPage = useQuery(api.creditCardStatements.listStatements, {
    ...sortArgs,
    paginationOpts: { numItems: PER_PAGE, cursor: cursors[pageIndex] },
  });
  // Prefetched so "Next" is instant and disabled when the next page is empty,
  // which `isDone` alone does not guarantee.
  const nextPage = useQuery(
    api.creditCardStatements.listStatements,
    currentPage && !currentPage.isDone
      ? {
          ...sortArgs,
          paginationOpts: {
            numItems: PER_PAGE,
            cursor: currentPage.continueCursor,
          },
        }
      : "skip",
  );

  const statements = currentPage?.page ?? [];
  const isLoading = currentPage === undefined;
  const hasPreviousPage = pageIndex > 0;
  const hasNextPage =
    !!currentPage && !currentPage.isDone && nextPage?.page.length !== 0;

  // Removing the last statement of the last page leaves it empty.
  if (currentPage?.page.length === 0 && hasPreviousPage) {
    setCursors(cursors.slice(0, -1));
  }

  const changeSort = (next: SortState) => {
    setSort(next);
    setCursors([null]);
  };

  const handleSort = (key: CreditCardStatementSortField) =>
    changeSort(
      sort.key === key
        ? { key, direction: sort.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "issuer" ? "asc" : "desc" },
    );

  const goToNextPage = () => {
    if (currentPage && hasNextPage) {
      setCursors((prev) => [...prev, currentPage.continueCursor]);
    }
  };

  const goToPreviousPage = () => setCursors((prev) => prev.slice(0, -1));

  const handleRetry = async (statementId: Id<"creditCardStatements">) => {
    try {
      await retryStatement({ statementId });
    } catch (error) {
      toaster.create({
        type: "error",
        title: "Could not process the statement again",
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const renderActions = (statement: Doc<"creditCardStatements">) => (
    <StatementActions
      statement={statement}
      onView={() => navigate(`/credit-card/statements/${statement._id}`)}
      onRetry={() => handleRetry(statement._id)}
    />
  );

  const emptyState = currentPage?.page.length === 0 && !hasPreviousPage && (
    <Badge variant="outline" size="md" whiteSpace="normal">
      No statements yet. Upload a Nubank or Inter PDF above.
    </Badge>
  );

  const sortSelect = (
    <HStack justify="flex-end">
      <NativeSelect.Root size="sm" width="auto">
        <NativeSelect.Field
          aria-label="Sort statements"
          value={sortValue(sort)}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
            const option = SORT_OPTIONS.find(
              (item) => sortValue(item.sort) === event.target.value,
            );
            if (option) changeSort(option.sort);
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <option
              key={sortValue(option.sort)}
              value={sortValue(option.sort)}
            >
              {option.label}
            </option>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </HStack>
  );

  const pagination = (hasPreviousPage || hasNextPage) && (
    <HStack justify="space-between">
      <Text fontSize="sm" color="fg.muted">
        Page {pageIndex + 1}
      </Text>
      <ButtonGroup size="sm" variant="ghost" attached>
        <IconButton
          aria-label="Previous page"
          title="Previous page"
          disabled={!hasPreviousPage}
          onClick={goToPreviousPage}
        >
          <IconChevronLeft />
        </IconButton>
        <IconButton
          aria-label="Next page"
          title="Next page"
          disabled={!hasNextPage}
          onClick={goToNextPage}
        >
          <IconChevronRight />
        </IconButton>
      </ButtonGroup>
    </HStack>
  );

  if (isMobile) {
    return (
      <Stack gap={2}>
        {sortSelect}
        {statements.length > 0 && (
          <Stack as="ul" aria-label="Statements" gap={2} listStyleType="none">
            {statements.map((statement) => (
              <Box
                as="li"
                key={statement._id}
                borderWidth="1px"
                borderColor="border.subtle"
                borderRadius="lg"
                bg="bg.panel"
                p={3}
              >
                <HStack justify="space-between" align="flex-start" gap={3}>
                  <Stack gap={0.5} minW={0}>
                    <HStack gap={2} wrap="wrap">
                      <Text fontSize="sm" fontWeight="medium">
                        {formatReferenceMonth(statement.referenceMonth)}
                      </Text>
                      <StatementStatusBadge status={statement.status} />
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {issuerLabel(statement.issuer)}
                      {statement.dueDate &&
                        ` · Due ${formatDay(statement.dueDate)}`}
                    </Text>
                    <Text fontSize="xs" color="fg.subtle" truncate>
                      {statement.filename}
                    </Text>
                  </Stack>
                  <Text fontSize="sm" fontWeight="semibold" whiteSpace="nowrap">
                    {formatTotal(statement)}
                  </Text>
                </HStack>
                {statement.status === "failed" && statement.errorMessage && (
                  <Text fontSize="xs" color="fg.error" mt={2}>
                    {statement.errorMessage}
                  </Text>
                )}
                <HStack justify="flex-end" mt={1}>
                  {renderActions(statement)}
                </HStack>
              </Box>
            ))}
          </Stack>
        )}
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="shine" height="88px" />
          ))}
        {emptyState}
        {pagination}
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      {sortSelect}
      <Table.ScrollArea>
        <Table.Root size="sm" striped>
          <Table.Header>
            <Table.Row>
              <SortableHeader
                label="Statement"
                sortKey="referenceMonth"
                sort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label="Issuer"
                sortKey="issuer"
                sort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label="Due date"
                sortKey="dueDate"
                sort={sort}
                onSort={handleSort}
              />
              <SortableHeader
                label="Total"
                sortKey="totalAmountCents"
                sort={sort}
                onSort={handleSort}
              />
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader w="1%">Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {statements.map((statement) => (
              <Table.Row key={statement._id}>
                <Table.Cell fontSize="xs">
                  <Text fontWeight="medium">
                    {formatReferenceMonth(statement.referenceMonth)}
                  </Text>
                  <Text color="fg.muted" truncate maxW="xs">
                    {statement.filename}
                  </Text>
                </Table.Cell>
                <Table.Cell fontSize="xs">
                  {issuerLabel(statement.issuer)}
                </Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {formatDay(statement.dueDate)}
                </Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {formatTotal(statement)}
                </Table.Cell>
                <Table.Cell fontSize="xs">
                  <StatementStatusBadge status={statement.status} />
                  {statement.status === "failed" && statement.errorMessage && (
                    <Text color="fg.error" mt={1} maxW="sm">
                      {statement.errorMessage}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>{renderActions(statement)}</Table.Cell>
              </Table.Row>
            ))}

            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <Table.Row key={`skeleton-${index}`}>
                  {Array.from({ length: COLUMNS }).map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>
                      <Skeleton variant="shine" height="20px" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}

            {emptyState && (
              <Table.Row>
                <Table.Cell colSpan={COLUMNS}>{emptyState}</Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
      {pagination}
    </Stack>
  );
}
