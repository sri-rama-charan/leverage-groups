import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { PlusCircle, Wallet as WalletIcon, Calendar, TrendingUp, History, Info } from "lucide-react";

const presetAmounts = [500, 1000, 2500, 5000];

function formatINR(v) {
  if (v === null || v === undefined) return "-";
  return `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const SummaryCard = ({ icon: Icon, label, value }) => (
  <div className="bg-[#121621] border border-[#1f2637] rounded-xl p-4 flex items-center gap-4">
    <div className="h-10 w-10 rounded-lg bg-[#0d1220] border border-[#242b3f] flex items-center justify-center text-[#7aa2ff]">
      <Icon size={20} />
    </div>
    <div>
      <div className="text-sm text-[#9aa5b1]">{label}</div>
      <div className="text-xl font-semibold text-white">{value}</div>
    </div>
  </div>
);

const AddMoneyModal = ({ open, onClose, onAdded }) => {
  const [amount, setAmount] = useState(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAmount(1000);
      setError("");
    }
  }, [open]);

  const handleAdd = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.post("/wallet/brand/add-money", { amount: Number(amount) });
      if (res.data?.success) {
        onAdded(res.data.balance);
        onClose();
      } else {
        setError(res.data?.message || "Failed to add money");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Failed to add money");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b1020] border border-[#1e263a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Add Money</h3>
          <button onClick={onClose} className="text-[#9aa5b1] hover:text-white">✕</button>
        </div>
        <div className="mb-3">
          <div className="text-sm text-[#9aa5b1] mb-2">Select amount</div>
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((v) => (
              <button key={v} onClick={() => setAmount(v)} className={`px-3 py-2 rounded-lg border ${amount === v ? "border-[#7aa2ff] bg-[#10172b] text-white" : "border-[#27304a] text-[#c5d1e0] hover:bg-[#0f1629]"}`}>
                {formatINR(v)}
              </button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-sm text-[#9aa5b1] mb-1">Custom amount</div>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#0b1020] border border-[#27304a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#7aa2ff]" />
        </div>
        <div className="text-xs text-[#9aa5b1] bg-[#0d1326] border border-[#1f2740] rounded-lg p-3 mb-4 flex gap-2">
          <Info size={14} className="text-[#7aa2ff] shrink-0 mt-0.5" />
          <div>
            Prepaid wallet in test mode. Top-ups are non-refundable in Phase-1. Razorpay live integration to follow.
          </div>
        </div>
        {error && <div className="text-red-400 text-sm mb-3">{error}</div>}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg border border-[#27304a] text-[#c5d1e0] hover:bg-[#0f1629]">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="px-3 py-2 rounded-lg bg-[#1a2846] text-white hover:bg-[#24355c] disabled:opacity-60 flex items-center gap-2">
            <PlusCircle size={16} /> {loading ? "Processing..." : "Add Money"}
          </button>
        </div>
      </div>
    </div>
  );
};

const BrandWallet = () => {
  const [summary, setSummary] = useState({ currentBalance: 0, totalAdded: 0, totalSpend: 0, lastTopUpDate: null });
  const [transactions, setTransactions] = useState([]);
  const [txMeta, setTxMeta] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const loadSummary = async () => {
    const res = await api.get("/wallet/brand/summary");
    setSummary(res.data.summary);
  };
  const loadTransactions = async (page = 1) => {
    const res = await api.get("/wallet/brand/transactions", { params: { page } });
    setTransactions(res.data.transactions);
    setTxMeta({ page: res.data.pagination.page, pages: res.data.pagination.pages, total: res.data.pagination.total, limit: res.data.pagination.limit });
  };
  const loadBreakdown = async () => {
    const res = await api.get("/wallet/brand/campaign-spend");
    setBreakdown(res.data.breakdown);
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([loadSummary(), loadTransactions(1), loadBreakdown()]);
      } catch (e) {
        setError(e.response?.data?.message || e.message || "Failed to load wallet");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onAdded = async () => {
    await loadSummary();
    await loadTransactions(txMeta.page || 1);
  };

  const rules = useMemo(() => ([
    { k: "Campaigns blocked if balance insufficient" },
    { k: "Estimated cost shown before scheduling" },
    { k: "Minor variance possible due to delivery failures" },
  ]), []);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Wallet</h1>
          <div className="text-[#9aa5b1]">Manage balance, top-ups and campaign spend</div>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-[#1a2846] text-white hover:bg-[#24355c] border border-[#223154] flex items-center gap-2">
          <PlusCircle size={18} /> Add Money
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <SummaryCard icon={WalletIcon} label="Current Balance" value={formatINR(summary.currentBalance)} />
        <SummaryCard icon={TrendingUp} label="Total Added" value={formatINR(summary.totalAdded)} />
        <SummaryCard icon={History} label="Total Spend" value={formatINR(summary.totalSpend)} />
        <SummaryCard icon={Calendar} label="Last Top-up" value={summary.lastTopUpDate ? new Date(summary.lastTopUpDate).toLocaleString() : "—"} />
      </div>

      {error && <div className="mt-4 text-red-400">{error}</div>}

      {/* Transaction History */}
      <div className="mt-8 bg-[#0b1020] border border-[#1e263a] rounded-xl">
        <div className="px-4 py-3 border-b border-[#1e263a] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Wallet Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[#9aa5b1] text-sm">
              <tr className="border-b border-[#1e263a]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Balance After</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#9aa5b1]">No transactions yet.</td>
                </tr>
              )}
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-[#0f172a] hover:bg-[#0e1426]">
                  <td className="px-4 py-3 text-white">{new Date(t.date).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-md text-xs border ${t.type === "DEBIT" ? "text-red-300 border-red-900/50 bg-red-900/10" : "text-green-300 border-green-900/50 bg-green-900/10"}`}>
                      {t.type === "DEBIT" ? "Campaign Debit" : t.type === "TOPUP" ? "Top-Up" : t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#c5d1e0]">{t.reference || "—"}</td>
                  <td className={`px-4 py-3 font-medium ${t.amount < 0 ? "text-red-300" : "text-green-300"}`}>{t.amount < 0 ? `- ${formatINR(Math.abs(t.amount))}` : `+ ${formatINR(t.amount)}`}</td>
                  <td className="px-4 py-3 text-white">{formatINR(t.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 flex items-center justify-between text-sm text-[#9aa5b1]">
          <div>Total: {txMeta.total}</div>
          <div className="flex items-center gap-2">
            <button disabled={txMeta.page <= 1} onClick={() => loadTransactions(txMeta.page - 1)} className="px-3 py-1.5 rounded-lg border border-[#27304a] hover:bg-[#0f1629] disabled:opacity-50">Prev</button>
            <span className="text-white">{txMeta.page} / {txMeta.pages}</span>
            <button disabled={txMeta.page >= txMeta.pages} onClick={() => loadTransactions(txMeta.page + 1)} className="px-3 py-1.5 rounded-lg border border-[#27304a] hover:bg-[#0f1629] disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Campaign Spend Breakdown */}
      <div className="mt-8 bg-[#0b1020] border border-[#1e263a] rounded-xl">
        <div className="px-4 py-3 border-b border-[#1e263a]">
          <h2 className="text-lg font-semibold text-white">Campaign Spend Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[#9aa5b1] text-sm">
              <tr className="border-b border-[#1e263a]">
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Messages Sent</th>
                <th className="px-4 py-3">Amount Spent</th>
                <th className="px-4 py-3">Cost / Message</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {breakdown.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[#9aa5b1]">No spend data yet.</td>
                </tr>
              )}
              {breakdown.map((b) => (
                <tr key={b.campaignId} className="border-b border-[#0f172a] hover:bg-[#0e1426]">
                  <td className="px-4 py-3 text-white">{b.campaignName}</td>
                  <td className="px-4 py-3 text-[#c5d1e0]">{b.status}</td>
                  <td className="px-4 py-3 text-white">{b.messagesSent}</td>
                  <td className="px-4 py-3 text-white">{formatINR(b.amountSpent)}</td>
                  <td className="px-4 py-3 text-white">{formatINR(b.costPerMessage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wallet Rules */}
      <div className="mt-8 bg-[#0b1020] border border-[#1e263a] rounded-xl">
        <div className="px-4 py-3 border-b border-[#1e263a]">
          <h2 className="text-lg font-semibold text-white">Wallet Rules</h2>
        </div>
        <ul className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {rules.map((r, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[#c5d1e0]"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#7aa2ff]"></span>{r.k}</li>
          ))}
        </ul>
      </div>

      <AddMoneyModal open={modalOpen} onClose={() => setModalOpen(false)} onAdded={onAdded} />
      {loading && <div className="mt-4 text-[#9aa5b1]">Loading...</div>}
    </div>
  );
};

export default BrandWallet;
