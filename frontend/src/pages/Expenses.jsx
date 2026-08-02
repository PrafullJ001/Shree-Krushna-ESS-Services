import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  addExpense,
  getExpenses,
  getExpenseStaffList,
  updateExpense,
  deleteExpense,
} from "../api/expenseApi";
import Spinner from "../components/common/Spinner";
import EmptyState from "../components/common/EmptyState";
import MathCaptchaModal from "../components/common/MathCaptchaModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CATEGORIES = [
  { label: "ESS Machine", value: "ESS Machine Maintenance", color: "#4C9A5A" },
  { label: "Tractor", value: "Tractor Maintenance", color: "#2B7A9E" },
  { label: "Pickup", value: "Pickup Maintenance", color: "#8B4C9E" },
  { label: "Diesel", value: "Diesel", color: "#D97706" },
];

const STAFF_CATEGORY = { label: "Staff", value: "Staff Expense", color: "#C24949" };

const getTodayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const PRESETS = [
  { label: "Recent", from: daysAgo(30), to: getTodayLocal() },
  { label: "Last Week", from: daysAgo(7), to: getTodayLocal() },
  { label: "All Time", from: "", to: "" },
];

// How many entries to show in the Recent Entries list on-screen. This is a
// display-only cap — totals, grand total, and staff breakdown are still
// computed from the FULL set of expenses returned by the backend.
const RECENT_ENTRIES_DISPLAY_LIMIT = 15;

// How many entries to show by default inside the staff / category detail
// panels — display-only, PDF generation still uses the full filtered set.
const DETAIL_ENTRIES_DISPLAY_LIMIT = 5;

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

// jsPDF's default font has no ₹ glyph — it renders as a broken character.
// Use "Rs." inside PDFs only; on-screen formatCurrency (₹) is untouched.
const formatCurrencyForPdf = (amount) => `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;

export default function Expenses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayLocal());
  const [note, setNote] = useState("");

  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const [activePreset, setActivePreset] = useState("Recent");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [staffTotals, setStaffTotals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Staff breakdown panel
  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [viewingStaff, setViewingStaff] = useState(null);

  // Category detail panel (ESS Machine / Tractor / Pickup / Diesel) — same
  // pattern as the staff detail panel: optional PDF date filter + download.
  const [viewingCategory, setViewingCategory] = useState(null);

  // Optional PDF-only date filter — independent of the page's main date
  // filter, applied only when generating a staff member's PDF report.
  const [pdfFrom, setPdfFrom] = useState("");
  const [pdfTo, setPdfTo] = useState("");
  const [showPdfFilter, setShowPdfFilter] = useState(false);

  // Separate optional date filter for the "All Expenses" PDF export below
  // (kept independent of pdfFrom/pdfTo so it doesn't interfere with the
  // staff/category panels' own filters).
  const [allPdfFrom, setAllPdfFrom] = useState("");
  const [allPdfTo, setAllPdfTo] = useState("");
  const [showAllPdfFilter, setShowAllPdfFilter] = useState(false);

  // ── EDIT / DELETE — new state ──────────────────────────────────────
  // The expense currently being edited (null = edit modal closed).
  const [editingExpense, setEditingExpense] = useState(null);
  const [editCategory, setEditCategory] = useState(CATEGORIES[0].value);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editSelectedStaff, setEditSelectedStaff] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  // The expense pending delete confirmation (goes through MathCaptchaModal,
  // same pattern used elsewhere in the app).
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteCaptcha, setShowDeleteCaptcha] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Admin-only guard
  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, navigate]);

  const loadExpenses = async (from, to) => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const { data } = await getExpenses(params);
      setExpenses(data.expenses || []);
      setTotals(data.totals || {});
      setGrandTotal(data.grandTotal || 0);
      setStaffTotals(data.staffTotals || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  // Re-runs whichever date filter (preset or custom) is currently active —
  // used after add/edit/delete so every mutation refreshes the same view
  // the user is already looking at.
  const reloadCurrentView = () => {
    const preset = PRESETS.find((p) => p.label === activePreset);
    if (preset) {
      loadExpenses(preset.from, preset.to);
    } else {
      loadExpenses(customFrom, customTo);
    }
  };

  useEffect(() => {
    const preset = PRESETS.find((p) => p.label === "Recent");
    loadExpenses(preset.from, preset.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only fetch the staff list the first time "Staff" category is picked
  useEffect(() => {
    if (category === "Staff Expense" && staffList.length === 0 && !staffLoading) {
      setStaffLoading(true);
      getExpenseStaffList()
        .then(({ data }) => setStaffList(data.staff || []))
        .catch(() => setStaffList([]))
        .finally(() => setStaffLoading(false));
    }
  }, [category, staffList.length, staffLoading]);

  // Same lazy-load, but triggered from the edit modal's category picker.
  useEffect(() => {
    if (editCategory === "Staff Expense" && staffList.length === 0 && !staffLoading) {
      setStaffLoading(true);
      getExpenseStaffList()
        .then(({ data }) => setStaffList(data.staff || []))
        .catch(() => setStaffList([]))
        .finally(() => setStaffLoading(false));
    }
  }, [editCategory, staffList.length, staffLoading]);

  const handlePreset = (preset) => {
    setActivePreset(preset.label);
    setShowCustomRange(false);
    loadExpenses(preset.from, preset.to);
  };

  const handleApplyCustomRange = () => {
    setActivePreset("Custom");
    loadExpenses(customFrom, customTo);
  };

  const resetForm = () => {
    setAmount("");
    setDate(getTodayLocal());
    setNote("");
    setSelectedStaff(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || Number(amount) <= 0) {
      return setError("Enter a valid amount");
    }

    if (!date) {
      return setError("Date is required");
    }

    if (category === "Staff Expense" && !selectedStaff) {
      return setError("Select a staff member");
    }

    if (!note.trim()) {
      return setError("Note is required");
    }

    setSubmitting(true);
    try {
      await addExpense({
        category,
        amount: Number(amount),
        date,
        staffMember: category === "Staff Expense" ? selectedStaff._id : undefined,
        note: note.trim(),
      });

      resetForm();
      reloadCurrentView();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add expense");
    } finally {
      setSubmitting(false);
    }
  };

  // ── EDIT / DELETE — new handlers ───────────────────────────────────

  const openEditModal = (exp) => {
    setEditError(null);
    setEditingExpense(exp);
    setEditCategory(exp.category);
    setEditAmount(String(exp.amount ?? ""));
    // exp.date comes back from the API as an ISO string — trim to
    // YYYY-MM-DD for the <input type="date">.
    setEditDate(exp.date ? String(exp.date).slice(0, 10) : "");
    setEditNote(exp.note || "");
    setEditSelectedStaff(exp.staffMember || null);
  };

  const closeEditModal = () => {
    setEditingExpense(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);

    if (!editAmount || Number(editAmount) <= 0) {
      return setEditError("Enter a valid amount");
    }

    if (!editDate) {
      return setEditError("Date is required");
    }

    if (editCategory === "Staff Expense" && !editSelectedStaff) {
      return setEditError("Select a staff member");
    }

    if (!editNote.trim()) {
      return setEditError("Note is required");
    }

    setEditSubmitting(true);
    try {
      await updateExpense(editingExpense._id, {
        category: editCategory,
        amount: Number(editAmount),
        date: editDate,
        staffMember: editCategory === "Staff Expense" ? editSelectedStaff._id : null,
        note: editNote.trim(),
      });

      closeEditModal();
      reloadCurrentView();

      // Keep the staff detail panel in sync if we edited an entry from there.
      if (viewingStaff) {
        setViewingStaff((prev) => (prev ? { ...prev } : prev));
      }
    } catch (err) {
      setEditError(err.response?.data?.message || "Failed to update expense");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete goes through the same MathCaptchaModal confirmation pattern
  // used elsewhere in the app before anything destructive happens.
  const requestDelete = (exp) => {
    setDeleteError(null);
    setDeleteTarget(exp);
    setShowDeleteCaptcha(true);
  };

  const closeDeleteCaptcha = () => {
    setShowDeleteCaptcha(false);
    setDeleteTarget(null);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteExpense(deleteTarget._id);
      setShowDeleteCaptcha(false);
      setDeleteTarget(null);
      reloadCurrentView();
    } catch (err) {
      // MathCaptchaModal has no error prop, so surface API failures this way.
      setDeleteError(err.response?.data?.message || "Failed to delete expense");
      window.alert(err.response?.data?.message || "Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  // Display-only slice for the Recent Entries list — shows only the most
  // recent 15, in the same order the backend already sorts them (newest
  // first). Totals/grandTotal/staffTotals stay based on the full data.
  const recentEntriesToShow = useMemo(
    () => expenses.slice(0, RECENT_ENTRIES_DISPLAY_LIMIT),
    [expenses]
  );

  const filteredStaffTotals = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    if (!q) return staffTotals;
    return staffTotals.filter((s) => s.name?.toLowerCase().includes(q));
  }, [staffTotals, staffSearch]);

  const viewingStaffExpenses = useMemo(() => {
    if (!viewingStaff) return [];
    return expenses.filter(
      (e) => e.category === "Staff Expense" && e.staffMember?._id === viewingStaff.staffId
    );
  }, [expenses, viewingStaff]);

  // Same idea as viewingStaffExpenses, but scoped to whichever category
  // card (ESS Machine / Tractor / Pickup / Diesel) was clicked.
  const viewingCategoryExpenses = useMemo(() => {
    if (!viewingCategory) return [];
    return expenses.filter((e) => e.category === viewingCategory.value);
  }, [expenses, viewingCategory]);

  // Applies the optional PDF date filter on top of viewingStaffExpenses
  // (which is already scoped to the page's main date filter). Empty
  // from/to means "no extra restriction" — i.e. fully optional.
  const pdfFilteredExpenses = useMemo(() => {
    if (!pdfFrom && !pdfTo) return viewingStaffExpenses;
    return viewingStaffExpenses.filter((e) => {
      const d = new Date(e.date);
      if (pdfFrom && d < new Date(pdfFrom)) return false;
      if (pdfTo && d > new Date(pdfTo + "T23:59:59")) return false;
      return true;
    });
  }, [viewingStaffExpenses, pdfFrom, pdfTo]);

  // Same optional date filter, applied to the category panel instead.
  // Reuses pdfFrom/pdfTo since only one of the two panels is ever open
  // at a time (resetPdfFilter runs whenever either panel opens/closes).
  const categoryPdfFilteredExpenses = useMemo(() => {
    if (!pdfFrom && !pdfTo) return viewingCategoryExpenses;
    return viewingCategoryExpenses.filter((e) => {
      const d = new Date(e.date);
      if (pdfFrom && d < new Date(pdfFrom)) return false;
      if (pdfTo && d > new Date(pdfTo + "T23:59:59")) return false;
      return true;
    });
  }, [viewingCategoryExpenses, pdfFrom, pdfTo]);

  // Display-only caps — the on-screen entry lists in both detail panels
  // show only the most recent 5; PDF generation still uses the full
  // filtered set above, untouched by this cap.
  const staffEntriesToShow = useMemo(
    () => viewingStaffExpenses.slice(0, DETAIL_ENTRIES_DISPLAY_LIMIT),
    [viewingStaffExpenses]
  );
  const categoryEntriesToShow = useMemo(
    () => viewingCategoryExpenses.slice(0, DETAIL_ENTRIES_DISPLAY_LIMIT),
    [viewingCategoryExpenses]
  );

  const resetPdfFilter = () => {
    setPdfFrom("");
    setPdfTo("");
  };

  const handleGeneratePdf = (staffName, staffExpenseEntries) => {
    const doc = new jsPDF();
    const generatedOn = new Date().toLocaleDateString("en-IN");

    const rangeLabel =
      pdfFrom && pdfTo
        ? `Period: ${new Date(pdfFrom).toLocaleDateString("en-IN")} to ${new Date(pdfTo).toLocaleDateString("en-IN")}`
        : pdfFrom
        ? `Period: From ${new Date(pdfFrom).toLocaleDateString("en-IN")}`
        : pdfTo
        ? `Period: Up to ${new Date(pdfTo).toLocaleDateString("en-IN")}`
        : "Period: All Time (within current page filter)";

    doc.setFontSize(16);
    doc.text(`${staffName} — Expense Report`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${generatedOn}`, 14, 26);
    doc.text(rangeLabel, 14, 31);

    const sortedEntries = [...staffExpenseEntries].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    autoTable(doc, {
      startY: 38,
      head: [["Date", "Note", "Amount"]],
      body: sortedEntries.map((e) => [
        new Date(e.date).toLocaleDateString("en-IN"),
        e.note || "-",
        formatCurrencyForPdf(e.amount),
      ]),
      foot: [[
        "",
        "Total",
        formatCurrencyForPdf(sortedEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0)),
      ]],
      headStyles: { fillColor: [31, 61, 43] },
      footStyles: { fillColor: [246, 242, 233], textColor: [31, 42, 34], fontStyle: "bold" },
    });

    // Filename: staff name + from date + to date (only the parts that are set)
    const safeName = staffName.replace(/\s+/g, "_");
    const fileSuffix =
      pdfFrom && pdfTo
        ? `${pdfFrom}_to_${pdfTo}`
        : pdfFrom
        ? `from_${pdfFrom}`
        : pdfTo
        ? `upto_${pdfTo}`
        : "all";

    doc.save(`${safeName}_${fileSuffix}.pdf`);
  };

  // "All Expenses" export — every category combined, most recent first,
  // with its own optional date filter, independent of the page's main
  // date filter and of the staff/category panels' filters.
  const allPdfFilteredExpenses = useMemo(() => {
    if (!allPdfFrom && !allPdfTo) return expenses;
    return expenses.filter((e) => {
      const d = new Date(e.date);
      if (allPdfFrom && d < new Date(allPdfFrom)) return false;
      if (allPdfTo && d > new Date(allPdfTo + "T23:59:59")) return false;
      return true;
    });
  }, [expenses, allPdfFrom, allPdfTo]);

  const resetAllPdfFilter = () => {
    setAllPdfFrom("");
    setAllPdfTo("");
  };

  const handleGenerateAllPdf = () => {
    const doc = new jsPDF();
    const generatedOn = new Date().toLocaleDateString("en-IN");

    const rangeLabel =
      allPdfFrom && allPdfTo
        ? `Period: ${new Date(allPdfFrom).toLocaleDateString("en-IN")} to ${new Date(allPdfTo).toLocaleDateString("en-IN")}`
        : allPdfFrom
        ? `Period: From ${new Date(allPdfFrom).toLocaleDateString("en-IN")}`
        : allPdfTo
        ? `Period: Up to ${new Date(allPdfTo).toLocaleDateString("en-IN")}`
        : "Period: All Time (within current page filter)";

    doc.setFontSize(16);
    doc.text("All Expenses Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${generatedOn}`, 14, 26);
    doc.text(rangeLabel, 14, 31);

    // Descending order — most recent expense first.
    const sortedEntries = [...allPdfFilteredExpenses].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    autoTable(doc, {
      startY: 38,
      head: [["Date", "Category", "Note", "Amount"]],
      body: sortedEntries.map((e) => [
        new Date(e.date).toLocaleDateString("en-IN"),
        [...CATEGORIES, STAFF_CATEGORY].find((c) => c.value === e.category)?.label || e.category,
        e.note || "-",
        formatCurrencyForPdf(e.amount),
      ]),
      foot: [[
        "",
        "",
        "Total",
        formatCurrencyForPdf(sortedEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0)),
      ]],
      headStyles: { fillColor: [31, 61, 43] },
      footStyles: { fillColor: [246, 242, 233], textColor: [31, 42, 34], fontStyle: "bold" },
    });

    const fileSuffix =
      allPdfFrom && allPdfTo
        ? `${allPdfFrom}_to_${allPdfTo}`
        : allPdfFrom
        ? `from_${allPdfFrom}`
        : allPdfTo
        ? `upto_${allPdfTo}`
        : "all";

    doc.save(`All_Expenses_${fileSuffix}.pdf`);
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#F6F2E9] pb-24 font-sans selection:bg-[#4C9A5A]/20">
      {/* HEADER */}
      <div
        className="relative px-6 pt-10 pb-16 overflow-hidden rounded-b-[2.5rem] shadow-sm"
        style={{ backgroundImage: "linear-gradient(180deg, #1F3D2B 0%, #234730 60%, #2B5439 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 14px)" }}
        />
        <div className="relative">
          <p className="text-xs text-[#B9D9BE] font-medium tracking-wide uppercase mb-1">Admin</p>
          <h1 className="text-xl font-bold text-white tracking-tight">Expenses</h1>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-10 max-w-2xl mx-auto space-y-4">
        {/* ADD EXPENSE FORM */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-5 space-y-4">
          <h2 className="text-sm font-bold text-[#1F2A22]">Add Expense</h2>

          {/* Category chips */}
          <div className="grid grid-cols-3 gap-2">
            {[...CATEGORIES, STAFF_CATEGORY].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setCategory(c.value);
                  setSelectedStaff(null);
                }}
                className={`py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                  category === c.value
                    ? "text-white shadow-sm"
                    : "bg-[#F6F2E9] text-[#5B6B5E]"
                }`}
                style={category === c.value ? { backgroundColor: c.color } : {}}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Staff picker — only for Staff Expense */}
          {category === "Staff Expense" && (
            <div className="bg-[#F6F2E9] rounded-xl p-3.5">
              <p className="text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-2.5">
                Select Staff
              </p>

              {staffLoading ? (
                <Spinner label="Loading staff..." />
              ) : staffList.length === 0 ? (
                <p className="text-[12px] text-[#8A968C] font-medium">No staff accounts found</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {staffList.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      onClick={() => setSelectedStaff(s)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        selectedStaff?._id === s._id
                          ? "bg-[#C24949] text-white"
                          : "bg-white text-[#1F2A22] border border-black/[0.06]"
                      }`}
                    >
                      <span
                        className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                          selectedStaff?._id === s._id
                            ? "bg-white/20 text-white"
                            : "bg-[#F6F2E9] text-[#1F3D2B]/60"
                        }`}
                      >
                        {s.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                      <span className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{s.name}</p>
                        <p className={`text-[11px] ${selectedStaff?._id === s._id ? "text-white/70" : "text-[#8A968C]"}`}>
                          {s.mobile}
                        </p>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-1.5">
                Amount
              </label>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹0"
                className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
              />
            </div>
          </div>

          {/* Note — now required */}
          <div>
            <label className="block text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-1.5">
              Note *
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Oil change, spare part"
              required
              className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
            />
          </div>

          {error && (
            <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl px-4 py-3">
              <p className="text-[#C24949] text-sm font-semibold">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#2B5439] text-white rounded-2xl py-3 font-bold text-sm shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all"
          >
            {submitting ? "Saving..." : "Add Expense"}
          </button>
        </form>

        {/* DATE FILTER — Recent / Last Week / All Time / Custom — evenly
            sized buttons that all fit on one row without scrolling */}
        <div className="flex items-center gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p)}
              className={`flex-1 px-2 py-2.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all ${
                activePreset === p.label
                  ? "bg-[#2B5439] text-white shadow-sm"
                  : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => {
              setShowCustomRange((prev) => {
                const next = !prev;
                if (next) setActivePreset("Custom");
                return next;
              });
            }}
            className={`flex-1 px-2 py-2.5 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all ${
              activePreset === "Custom"
                ? "bg-[#2B5439] text-white shadow-sm"
                : "bg-white text-[#1F2A22]/60 border border-black/[0.06]"
            }`}
          >
            Custom
          </button>
        </div>

        {showCustomRange && (
          <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1.5">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              onClick={handleApplyCustomRange}
              className="w-full bg-[#4C9A5A] text-white rounded-xl py-2.5 text-sm font-bold"
            >
              Apply Range
            </button>
          </div>
        )}

        {/* TOTALS — modernized */}
        {loading ? (
          <div className="py-10">
            <Spinner label="Loading expenses..." />
          </div>
        ) : (
          <>
            {/* Grand total hero card */}
            <div
              className="rounded-[1.5rem] shadow-sm p-5 flex items-center justify-between"
              style={{ backgroundImage: "linear-gradient(135deg, #1F3D2B 0%, #2B5439 100%)" }}
            >
              <div>
                <p className="text-[11px] font-bold text-[#B9D9BE] uppercase tracking-widest mb-1">
                  Total — {activePreset}
                </p>
                <p className="text-2xl font-black text-white">{formatCurrency(grandTotal)}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* ALL EXPENSES PDF — every category combined, most recent
                first, with a grand total. Own optional date filter, same
                pattern as the staff/category panels. */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4">
              <p className="text-sm font-bold text-[#1F2A22] mb-0.5">All Expenses Report</p>
              <p className="text-[11px] text-[#1F2A22]/50 mb-3">Every category, most recent first, with total</p>

              <div className="bg-[#F6F2E9]/60 rounded-xl mb-3 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAllPdfFilter((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5"
                >
                  <span className="text-[12px] font-bold text-[#1F2A22]">
                    {allPdfFrom || allPdfTo ? (
                      <>
                        PDF Range:{" "}
                        <span className="text-[#4C9A5A]">
                          {allPdfFrom ? new Date(allPdfFrom).toLocaleDateString("en-IN") : "…"} →{" "}
                          {allPdfTo ? new Date(allPdfTo).toLocaleDateString("en-IN") : "…"}
                        </span>
                      </>
                    ) : (
                      "Filter PDF by Date (optional)"
                    )}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 text-[#1F2A22]/40 transition-transform ${showAllPdfFilter ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showAllPdfFilter && (
                  <div className="px-3.5 pb-3.5 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1">From</label>
                        <input
                          type="date"
                          value={allPdfFrom}
                          max={allPdfTo || getTodayLocal()}
                          onChange={(e) => setAllPdfFrom(e.target.value)}
                          className="w-full bg-white border border-black/[0.06] rounded-lg px-2.5 py-2 text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1">To</label>
                        <input
                          type="date"
                          value={allPdfTo}
                          min={allPdfFrom}
                          max={getTodayLocal()}
                          onChange={(e) => setAllPdfTo(e.target.value)}
                          className="w-full bg-white border border-black/[0.06] rounded-lg px-2.5 py-2 text-[13px]"
                        />
                      </div>
                    </div>
                    {(allPdfFrom || allPdfTo) && (
                      <button
                        type="button"
                        onClick={resetAllPdfFilter}
                        className="text-[11px] font-bold text-[#C24949] uppercase tracking-wide"
                      >
                        Clear PDF filter
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateAllPdf}
                disabled={allPdfFilteredExpenses.length === 0}
                className="w-full bg-[#2B5439] text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M5 21h14a2 2 0 002-2V7l-5-5H5a2 2 0 00-2 2v15a2 2 0 002 2z" />
                </svg>
                Download PDF ({allPdfFilteredExpenses.length} entr{allPdfFilteredExpenses.length === 1 ? "y" : "ies"})
              </button>
            </div>

            {/* Category cards (no Staff here — Staff now gets its own full-width row below).
                Tapping a card opens its detail panel, same as tapping Staff. */}
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    setViewingCategory(c);
                    resetPdfFilter();
                    setShowPdfFilter(false);
                  }}
                  className="text-left bg-white rounded-2xl shadow-sm border border-black/[0.04] p-4 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                      style={{ backgroundColor: c.color }}
                    >
                      {c.label.charAt(0)}
                    </span>
                    <p className="text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide">{c.label}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-[#1F2A22]">{formatCurrency(totals[c.value])}</p>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#1F2A22]/30 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>

            {/* STAFF — full-width horizontal card, no wasted empty space */}
            <button
              type="button"
              onClick={() => setShowStaffPanel(true)}
              className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-black/[0.04] px-4 py-3.5 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                  style={{ backgroundColor: STAFF_CATEGORY.color }}
                >
                  {STAFF_CATEGORY.label.charAt(0)}
                </span>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide">{STAFF_CATEGORY.label}</p>
                  <p className="text-[10px] font-semibold text-[#C24949]">Tap for staff breakdown</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <p className="text-lg font-black text-[#1F2A22]">{formatCurrency(totals[STAFF_CATEGORY.value])}</p>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#1F2A22]/30" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* RECENT ENTRIES — capped to the most recent 15, same order as before */}
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-bold text-[#1F2A22] tracking-tight">Recent Entries</h2>
              {recentEntriesToShow.length > 0 && (
                <span className="text-[11px] font-bold uppercase tracking-wide text-[#4C9A5A] bg-[#E9F3E9] rounded-lg px-2.5 py-1 shadow-sm border border-[#4C9A5A]/10">
                  {recentEntriesToShow.length} Total
                </span>
              )}
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-black/[0.04] p-1 overflow-hidden">
              {recentEntriesToShow.length === 0 ? (
                <div className="py-6">
                  <EmptyState icon="🧾" title="No expenses yet" subtitle="Entries you add will show up here" />
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {recentEntriesToShow.map((exp) => {
                    const catMeta = [...CATEGORIES, STAFF_CATEGORY].find((c) => c.value === exp.category);
                    return (
                      <div key={exp._id} className="flex items-center justify-between px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-[11px] font-bold text-white"
                            style={{ backgroundColor: catMeta?.color || "#8A968C" }}
                          >
                            {catMeta?.label?.charAt(0) || "?"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#1F2A22] truncate">
                              {catMeta?.label || exp.category}
                              {exp.staffMember?.name ? ` • ${exp.staffMember.name}` : ""}
                            </p>
                            <p className="text-[11px] text-[#1F2A22]/45 font-medium">
                              {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              {exp.note ? ` • ${exp.note}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <p className="text-sm font-black text-[#1F2A22]">
                            {formatCurrency(exp.amount)}
                          </p>
                          <button
                            type="button"
                            onClick={() => openEditModal(exp)}
                            aria-label="Edit expense"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#1F2A22]/40 hover:text-[#2B5439] hover:bg-[#F6F2E9] transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(exp)}
                            aria-label="Delete expense"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#1F2A22]/40 hover:text-[#C24949] hover:bg-[#FCEDED] transition-colors"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* STAFF BREAKDOWN PANEL — raised z-index + bottom margin so the
          bottom navbar never overlaps the modal's content or buttons */}
      {showStaffPanel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[1.5rem] shadow-lg w-full max-w-md max-h-[75vh] mb-20 flex flex-col overflow-hidden">
            {!viewingStaff ? (
              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-[#1F2A22]">Staff Expenses</h2>
                  <button
                    onClick={() => {
                      setShowStaffPanel(false);
                      setStaffSearch("");
                    }}
                    className="text-[#1F2A22]/40"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Search staff name..."
                  className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
                />

                {filteredStaffTotals.length === 0 ? (
                  <EmptyState icon="🧾" title="No staff expenses" subtitle="Nothing recorded in this date range" />
                ) : (
                  <div className="space-y-2">
                    {filteredStaffTotals.map((s) => (
                      <button
                        key={s.staffId}
                        onClick={() => {
                          setViewingStaff(s);
                          resetPdfFilter();
                        }}
                        className="w-full flex items-center justify-between bg-[#F6F2E9]/60 hover:bg-[#F6F2E9] rounded-xl px-3.5 py-3 transition-all text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-9 w-9 rounded-full bg-[#C24949] text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                            {s.name?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-[#1F2A22] truncate">{s.name}</p>
                            <p className="text-[11px] text-[#1F2A22]/50">{s.count} entr{s.count === 1 ? "y" : "ies"}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-[#C24949] shrink-0 ml-2">{formatCurrency(s.total)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => {
                      setViewingStaff(null);
                      resetPdfFilter();
                      setShowPdfFilter(false);
                    }}
                    className="flex items-center gap-1.5 text-[#1F2A22]/60 text-sm font-semibold"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <button
                    onClick={() => {
                      setShowStaffPanel(false);
                      setViewingStaff(null);
                      setStaffSearch("");
                      resetPdfFilter();
                      setShowPdfFilter(false);
                    }}
                    className="text-[#1F2A22]/40"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <span className="h-11 w-11 rounded-full bg-[#C24949] text-white flex items-center justify-center text-[14px] font-bold shrink-0">
                    {viewingStaff.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                  <div>
                    <h2 className="font-bold text-lg text-[#1F2A22]">{viewingStaff.name}</h2>
                    <p className="text-[12px] text-[#1F2A22]/50">
                      {viewingStaff.count} entr{viewingStaff.count === 1 ? "y" : "ies"} • {formatCurrency(viewingStaff.total)} total
                    </p>
                  </div>
                </div>

                {/* Optional PDF date filter */}
                <div className="bg-[#F6F2E9]/60 rounded-xl mb-4 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowPdfFilter((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5"
                  >
                    <span className="text-[12px] font-bold text-[#1F2A22]">
                      {pdfFrom || pdfTo ? (
                        <>
                          PDF Range:{" "}
                          <span className="text-[#4C9A5A]">
                            {pdfFrom ? new Date(pdfFrom).toLocaleDateString("en-IN") : "…"} →{" "}
                            {pdfTo ? new Date(pdfTo).toLocaleDateString("en-IN") : "…"}
                          </span>
                        </>
                      ) : (
                        "Filter PDF by Date (optional)"
                      )}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-3.5 w-3.5 text-[#1F2A22]/40 transition-transform ${showPdfFilter ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showPdfFilter && (
                    <div className="px-3.5 pb-3.5 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1">From</label>
                          <input
                            type="date"
                            value={pdfFrom}
                            max={pdfTo || getTodayLocal()}
                            onChange={(e) => setPdfFrom(e.target.value)}
                            className="w-full bg-white border border-black/[0.06] rounded-lg px-2.5 py-2 text-[13px]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1">To</label>
                          <input
                            type="date"
                            value={pdfTo}
                            min={pdfFrom}
                            max={getTodayLocal()}
                            onChange={(e) => setPdfTo(e.target.value)}
                            className="w-full bg-white border border-black/[0.06] rounded-lg px-2.5 py-2 text-[13px]"
                          />
                        </div>
                      </div>
                      {(pdfFrom || pdfTo) && (
                        <button
                          type="button"
                          onClick={resetPdfFilter}
                          className="text-[11px] font-bold text-[#C24949] uppercase tracking-wide"
                        >
                          Clear PDF filter
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleGeneratePdf(viewingStaff.name, pdfFilteredExpenses)}
                  disabled={pdfFilteredExpenses.length === 0}
                  className="w-full mb-4 bg-[#2B5439] text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M5 21h14a2 2 0 002-2V7l-5-5H5a2 2 0 00-2 2v15a2 2 0 002 2z" />
                  </svg>
                  Download PDF ({pdfFilteredExpenses.length} entr{pdfFilteredExpenses.length === 1 ? "y" : "ies"})
                </button>

                <div className="flex items-center justify-between px-0.5 mb-2">
                  <p className="text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide">Recent Entries</p>
                  {viewingStaffExpenses.length > DETAIL_ENTRIES_DISPLAY_LIMIT && (
                    <span className="text-[10px] font-semibold text-[#1F2A22]/40">
                      Showing {staffEntriesToShow.length} of {viewingStaffExpenses.length}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {staffEntriesToShow.map((e) => (
                    <div key={e._id} className="flex items-center justify-between bg-[#F6F2E9]/50 rounded-xl px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1F2A22] truncate">{e.note}</p>
                        <p className="text-[11px] text-[#1F2A22]/50">
                          {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <p className="text-sm font-black text-[#1F2A22]">{formatCurrency(e.amount)}</p>
                        <button
                          type="button"
                          onClick={() => openEditModal(e)}
                          aria-label="Edit expense"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#1F2A22]/40 hover:text-[#2B5439] hover:bg-white transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(e)}
                          aria-label="Delete expense"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#1F2A22]/40 hover:text-[#C24949] hover:bg-white transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY DETAIL PANEL (ESS Machine / Tractor / Pickup / Diesel) —
          same pattern as the Staff detail panel: optional PDF date-range
          filter, a Download PDF button (defaults to all entries in the
          current page filter), and the 5 most recent entries with
          edit/delete. */}
      {viewingCategory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-[1.5rem] shadow-lg w-full max-w-md max-h-[75vh] mb-20 flex flex-col overflow-hidden">
            <div className="p-5 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="h-11 w-11 rounded-full text-white flex items-center justify-center text-[14px] font-bold shrink-0"
                    style={{ backgroundColor: viewingCategory.color }}
                  >
                    {viewingCategory.label.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg text-[#1F2A22] truncate">{viewingCategory.label}</h2>
                    <p className="text-[12px] text-[#1F2A22]/50">
                      {formatCurrency(totals[viewingCategory.value])} total
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setViewingCategory(null);
                    resetPdfFilter();
                    setShowPdfFilter(false);
                  }}
                  className="text-[#1F2A22]/40 shrink-0"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Optional PDF date filter — same UI/behavior as the staff panel */}
              <div className="bg-[#F6F2E9]/60 rounded-xl mb-4 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPdfFilter((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5"
                >
                  <span className="text-[12px] font-bold text-[#1F2A22]">
                    {pdfFrom || pdfTo ? (
                      <>
                        PDF Range:{" "}
                        <span className="text-[#4C9A5A]">
                          {pdfFrom ? new Date(pdfFrom).toLocaleDateString("en-IN") : "…"} →{" "}
                          {pdfTo ? new Date(pdfTo).toLocaleDateString("en-IN") : "…"}
                        </span>
                      </>
                    ) : (
                      "Filter PDF by Date (optional)"
                    )}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3.5 w-3.5 text-[#1F2A22]/40 transition-transform ${showPdfFilter ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showPdfFilter && (
                  <div className="px-3.5 pb-3.5 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1">From</label>
                        <input
                          type="date"
                          value={pdfFrom}
                          max={pdfTo || getTodayLocal()}
                          onChange={(e) => setPdfFrom(e.target.value)}
                          className="w-full bg-white border border-black/[0.06] rounded-lg px-2.5 py-2 text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[#1F2A22]/50 uppercase tracking-wide mb-1">To</label>
                        <input
                          type="date"
                          value={pdfTo}
                          min={pdfFrom}
                          max={getTodayLocal()}
                          onChange={(e) => setPdfTo(e.target.value)}
                          className="w-full bg-white border border-black/[0.06] rounded-lg px-2.5 py-2 text-[13px]"
                        />
                      </div>
                    </div>
                    {(pdfFrom || pdfTo) && (
                      <button
                        type="button"
                        onClick={resetPdfFilter}
                        className="text-[11px] font-bold text-[#C24949] uppercase tracking-wide"
                      >
                        Clear PDF filter
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleGeneratePdf(viewingCategory.label, categoryPdfFilteredExpenses)}
                disabled={categoryPdfFilteredExpenses.length === 0}
                className="w-full mb-4 bg-[#2B5439] text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M5 21h14a2 2 0 002-2V7l-5-5H5a2 2 0 00-2 2v15a2 2 0 002 2z" />
                </svg>
                Download PDF ({categoryPdfFilteredExpenses.length} entr{categoryPdfFilteredExpenses.length === 1 ? "y" : "ies"})
              </button>

              <div className="flex items-center justify-between px-0.5 mb-2">
                <p className="text-[11px] font-bold text-[#1F2A22]/50 uppercase tracking-wide">Recent Entries</p>
                {viewingCategoryExpenses.length > DETAIL_ENTRIES_DISPLAY_LIMIT && (
                  <span className="text-[10px] font-semibold text-[#1F2A22]/40">
                    Showing {categoryEntriesToShow.length} of {viewingCategoryExpenses.length}
                  </span>
                )}
              </div>

              {categoryEntriesToShow.length === 0 ? (
                <EmptyState icon="🧾" title="No expenses yet" subtitle="Entries in this category will show up here" />
              ) : (
                <div className="space-y-2">
                  {categoryEntriesToShow.map((e) => (
                    <div key={e._id} className="flex items-center justify-between bg-[#F6F2E9]/50 rounded-xl px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1F2A22] truncate">{e.note}</p>
                        <p className="text-[11px] text-[#1F2A22]/50">
                          {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <p className="text-sm font-black text-[#1F2A22]">{formatCurrency(e.amount)}</p>
                        <button
                          type="button"
                          onClick={() => openEditModal(e)}
                          aria-label="Edit expense"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#1F2A22]/40 hover:text-[#2B5439] hover:bg-white transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(e)}
                          aria-label="Delete expense"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#1F2A22]/40 hover:text-[#C24949] hover:bg-white transition-colors"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL — reuses the same category/staff/amount/date/note
          fields as the Add Expense form above. */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[1.5rem] shadow-lg w-full max-w-md max-h-[85vh] mb-16 flex flex-col overflow-hidden">
            <div className="p-5 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-[#1F2A22]">Edit Expense</h2>
                <button onClick={closeEditModal} className="text-[#1F2A22]/40">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                {/* Category chips */}
                <div className="grid grid-cols-3 gap-2">
                  {[...CATEGORIES, STAFF_CATEGORY].map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setEditCategory(c.value);
                        setEditSelectedStaff(null);
                      }}
                      className={`py-2.5 rounded-xl text-[12px] font-bold transition-all ${
                        editCategory === c.value ? "text-white shadow-sm" : "bg-[#F6F2E9] text-[#5B6B5E]"
                      }`}
                      style={editCategory === c.value ? { backgroundColor: c.color } : {}}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                {/* Staff picker — only for Staff Expense */}
                {editCategory === "Staff Expense" && (
                  <div className="bg-[#F6F2E9] rounded-xl p-3.5">
                    <p className="text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-2.5">
                      Select Staff
                    </p>

                    {staffLoading ? (
                      <Spinner label="Loading staff..." />
                    ) : staffList.length === 0 ? (
                      <p className="text-[12px] text-[#8A968C] font-medium">No staff accounts found</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {staffList.map((s) => (
                          <button
                            key={s._id}
                            type="button"
                            onClick={() => setEditSelectedStaff(s)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                              editSelectedStaff?._id === s._id
                                ? "bg-[#C24949] text-white"
                                : "bg-white text-[#1F2A22] border border-black/[0.06]"
                            }`}
                          >
                            <span
                              className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                editSelectedStaff?._id === s._id
                                  ? "bg-white/20 text-white"
                                  : "bg-[#F6F2E9] text-[#1F3D2B]/60"
                              }`}
                            >
                              {s.name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                            <span className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold truncate">{s.name}</p>
                              <p className={`text-[11px] ${editSelectedStaff?._id === s._id ? "text-white/70" : "text-[#8A968C]"}`}>
                                {s.mobile}
                              </p>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Amount + Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="₹0"
                      className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-1.5">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
                    />
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-[#5B6B5E] uppercase tracking-wide mb-1.5">
                    Note *
                  </label>
                  <input
                    type="text"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="e.g. Oil change, spare part"
                    required
                    className="w-full bg-[#F6F2E9] border border-black/[0.06] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4C9A5A]/30"
                  />
                </div>

                {editError && (
                  <div className="bg-[#FCEDED] border border-[#F3C6C6] rounded-xl px-4 py-3">
                    <p className="text-[#C24949] text-sm font-semibold">{editError}</p>
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 bg-[#F6F2E9] text-[#1F2A22] rounded-2xl py-3 font-bold text-sm active:scale-[0.98] transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSubmitting}
                    className="flex-1 bg-[#2B5439] text-white rounded-2xl py-3 font-bold text-sm shadow-sm disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION — same MathCaptchaModal pattern used elsewhere
          in the app before a destructive action is carried out. Only
          mounted while active, since the component has no isOpen prop of
          its own. */}
      {showDeleteCaptcha && deleteTarget && (
        <MathCaptchaModal
          title="Delete Expense"
          message={`Solve to confirm deleting "${deleteTarget.note || deleteTarget.category}" (${formatCurrency(deleteTarget.amount)}). This can't be undone.`}
          onConfirm={handleDeleteConfirmed}
          onCancel={closeDeleteCaptcha}
          loading={deleting}
          confirmLabel="Confirm Delete"
          loadingLabel="Deleting..."
        />
      )}
    </div>
  );
}