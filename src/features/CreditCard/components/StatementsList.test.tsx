// @vitest-environment jsdom
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { mockMatchMedia } from "@/test/mockMatchMedia";

type Page = { page: unknown[]; isDone: boolean; continueCursor: string };
type ListArgs = {
  sortBy: string;
  order: string;
  paginationOpts: { numItems: number; cursor: string | null };
};

const { pages, queryMock, retryMock, navigateMock } = vi.hoisted(() => ({
  pages: {} as Record<string, Page>,
  queryMock: vi.fn(),
  retryMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    creditCardStatements: {
      listStatements: "listStatements",
      retryStatement: "retryStatement",
    },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: (_query: unknown, args: ListArgs | "skip") =>
    args === "skip" ? undefined : queryMock(args),
  useMutation: () => retryMock,
}));

vi.mock("wouter", () => ({
  useLocation: () => ["/credit-card", navigateMock],
}));

vi.mock("@tabler/icons-react", () => ({
  IconArrowDown: () => <span />,
  IconArrowUp: () => <span />,
  IconChevronLeft: () => <span />,
  IconChevronRight: () => <span />,
  IconRefresh: () => <span />,
  IconReportAnalytics: () => <span />,
}));

vi.mock("@/components/ui/toaster", () => ({ toaster: { create: vi.fn() } }));

vi.mock("../modals/RemoveStatement", () => ({
  default: () => <button type="button">Delete statement</button>,
}));

import StatementsList from "./StatementsList";

const statement = (overrides: Record<string, unknown>) => ({
  _creationTime: 1,
  userId: "user1",
  issuer: "nubank",
  storageId: "storage1",
  filename: "fatura.pdf",
  ...overrides,
});

const FIRST_PAGE = "first";

function setStatements(statements: unknown[]) {
  pages[FIRST_PAGE] = { page: statements, isDone: true, continueCursor: "end" };
}

const lastQueryArgs = (): ListArgs =>
  queryMock.mock.calls[queryMock.mock.calls.length - 1][0];

function renderList() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <StatementsList />
    </ChakraProvider>,
  );
}

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  for (const key of Object.keys(pages)) delete pages[key];
  setStatements([]);
  queryMock.mockImplementation(
    ({ paginationOpts }: ListArgs) => pages[paginationOpts.cursor ?? FIRST_PAGE],
  );
  retryMock.mockResolvedValue(null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("StatementsList", () => {
  it("shows an empty state", () => {
    renderList();
    expect(screen.getByText(/no statements yet/i)).toBeInTheDocument();
  });

  it("renders completed statements with a link to the report", () => {
    setStatements([
      statement({
        _id: "s1",
        status: "completed",
        referenceMonth: "2026-10",
        dueDate: "2026-10-10",
        totalAmountCents: 123456,
      }),
    ]);
    renderList();

    expect(screen.getByText("Oct 2026")).toBeInTheDocument();
    expect(screen.getByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("10/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Process again" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View report" }));
    expect(navigateMock).toHaveBeenCalledWith("/credit-card/statements/s1");
  });

  it("shows the progress of statements being analyzed", () => {
    setStatements([
      statement({ _id: "s2", status: "processing", issuer: "inter" }),
    ]);
    renderList();
    expect(screen.getByText("Analyzing")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View report" }),
    ).not.toBeInTheDocument();
  });

  it("shows the error of a failed statement and retries it", async () => {
    setStatements([
      statement({
        _id: "s3",
        status: "failed",
        errorMessage: "No transactions were found in the statement",
      }),
    ]);
    renderList();

    expect(
      screen.getByText("No transactions were found in the statement"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Process again" }));
    await waitFor(() =>
      expect(retryMock).toHaveBeenCalledWith({ statementId: "s3" }),
    );
  });

  it("requests 5 statements per page, newest uploads first", () => {
    renderList();
    expect(lastQueryArgs()).toEqual({
      sortBy: "uploadedAt",
      order: "desc",
      paginationOpts: { numItems: 5, cursor: null },
    });
  });

  it("hides the pagination when everything fits in one page", () => {
    setStatements([statement({ _id: "s1", status: "completed" })]);
    renderList();
    expect(
      screen.queryByRole("button", { name: "Next page" }),
    ).not.toBeInTheDocument();
  });

  it("navigates between pages", () => {
    pages[FIRST_PAGE] = {
      page: [statement({ _id: "s1", status: "completed", filename: "a.pdf" })],
      isDone: false,
      continueCursor: "c1",
    };
    pages.c1 = {
      page: [statement({ _id: "s2", status: "completed", filename: "b.pdf" })],
      isDone: true,
      continueCursor: "end",
    };
    renderList();

    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("b.pdf")).toBeInTheDocument();
    expect(screen.queryByText("a.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
  });

  it("disables the next page when it turns out to be empty", () => {
    pages[FIRST_PAGE] = {
      page: [statement({ _id: "s1", status: "completed" })],
      isDone: false,
      continueCursor: "c1",
    };
    pages.c1 = { page: [], isDone: true, continueCursor: "end" };
    renderList();
    expect(
      screen.queryByRole("button", { name: "Next page" }),
    ).not.toBeInTheDocument();
  });

  it("goes back a page when the current page becomes empty", () => {
    pages[FIRST_PAGE] = {
      page: [statement({ _id: "s1", status: "completed", filename: "a.pdf" })],
      isDone: false,
      continueCursor: "c1",
    };
    pages.c1 = {
      page: [statement({ _id: "s2", status: "completed", filename: "b.pdf" })],
      isDone: true,
      continueCursor: "end",
    };
    const { rerender } = renderList();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    pages.c1 = { page: [], isDone: true, continueCursor: "end" };
    rerender(
      <ChakraProvider value={defaultSystem}>
        <StatementsList />
      </ChakraProvider>,
    );
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
  });

  it("sorts by a column and toggles its direction", () => {
    pages[FIRST_PAGE] = {
      page: [statement({ _id: "s1", status: "completed" })],
      isDone: false,
      continueCursor: "c1",
    };
    pages.c1 = {
      page: [statement({ _id: "s2", status: "completed" })],
      isDone: true,
      continueCursor: "end",
    };
    renderList();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    const dueDateHeader = screen
      .getByRole("button", { name: "Sort by Due date" })
      .closest("th");
    fireEvent.click(screen.getByRole("button", { name: "Sort by Due date" }));
    expect(queryMock).toHaveBeenCalledWith({
      sortBy: "dueDate",
      order: "desc",
      paginationOpts: { numItems: 5, cursor: null },
    });
    expect(dueDateHeader).toHaveAttribute("aria-sort", "descending");
    expect(screen.getByText("Page 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sort by Due date" }));
    expect(queryMock).toHaveBeenCalledWith({
      sortBy: "dueDate",
      order: "asc",
      paginationOpts: { numItems: 5, cursor: null },
    });
    expect(dueDateHeader).toHaveAttribute("aria-sort", "ascending");
  });

  it("sorts from the sort selector", () => {
    renderList();
    fireEvent.change(screen.getByRole("combobox", { name: "Sort statements" }), {
      target: { value: "totalAmountCents-asc" },
    });
    expect(lastQueryArgs()).toMatchObject({
      sortBy: "totalAmountCents",
      order: "asc",
    });
    expect(
      screen.getByRole("button", { name: "Sort by Total" }).closest("th"),
    ).toHaveAttribute("aria-sort", "ascending");
  });

  describe("on mobile", () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      mockMatchMedia(true);
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it("lists statements as cards with their actions", async () => {
      setStatements([
        statement({
          _id: "s1",
          status: "completed",
          referenceMonth: "2026-10",
          dueDate: "2026-10-10",
          totalAmountCents: 123456,
        }),
        statement({
          _id: "s3",
          status: "failed",
          issuer: "inter",
          errorMessage: "No transactions were found in the statement",
        }),
      ]);
      renderList();

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      const [completed, failed] = within(
        screen.getByRole("list", { name: "Statements" }),
      ).getAllByRole("listitem");

      expect(within(completed).getByText("Oct 2026")).toBeInTheDocument();
      expect(
        within(completed).getByText("Nubank · Due 10/10/2026"),
      ).toBeInTheDocument();
      expect(within(completed).getByText("Ready")).toBeInTheDocument();
      fireEvent.click(
        within(completed).getByRole("button", { name: "View report" }),
      );
      expect(navigateMock).toHaveBeenCalledWith("/credit-card/statements/s1");

      expect(within(failed).getByText("Inter")).toBeInTheDocument();
      expect(
        within(failed).getByText("No transactions were found in the statement"),
      ).toBeInTheDocument();
      fireEvent.click(
        within(failed).getByRole("button", { name: "Process again" }),
      );
      await waitFor(() =>
        expect(retryMock).toHaveBeenCalledWith({ statementId: "s3" }),
      );
    });

    it("shows an empty state", () => {
      renderList();
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
      expect(screen.getByText(/no statements yet/i)).toBeInTheDocument();
    });
  });
});
