import React, { useCallback, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, TrendingUp, Calculator, History, ShieldCheck, Info, FileText, Download, Printer, X, Edit3 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const fetchJson = async (path, opts = {}) => {
  const token = (() => {
    try {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    } catch {
      return null;
    }
  })();
  const headers = { ...(opts.headers || {}) };
  if (token && !headers.Authorization && !headers.authorization)
    headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { credentials: "include", ...opts, headers });
  if (!res.ok) {
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {
      // Ignore JSON parse errors, use text as-is
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const apiGet = (p) => fetchJson(`${API_BASE}${p}`);
const apiPost = (p, body) =>
  fetchJson(`${API_BASE}${p}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// Utiliy function to calculate payslip details
const calculatePayslipData = (totalSalary, presentDays, absentDays, month, year, pfEnabled, bonusAmount = 0) => {
  const annualCtc = Number(totalSalary) || 0;
  const monthlySalary = annualCtc / 12;
  presentDays = Number(presentDays) || 0;
  absentDays = Number(absentDays) || 0;
  bonusAmount = Number(bonusAmount) || 0;

  const basic = Math.round(monthlySalary * 0.48);
  const hra = Math.round(monthlySalary * 0.20);
  const lta = Math.round(monthlySalary * 0.05);
  const bonus = Math.round(monthlySalary * 0.04);
  const specialAllowance = monthlySalary - (basic + hra + lta + bonus);

  // TDS is 1% of monthly salary (e.g. 150 for 15000 salary)
  const tds = Math.round(monthlySalary * 0.01);
  const pt = 0;
  const pf = pfEnabled ? Math.round(basic * 0.12) : 0;

  // LOP Calculation
  const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const monthIndex = monthNames.indexOf((month || "").toLowerCase());
  const daysInMonth = monthIndex >= 0 ? new Date(year, monthIndex + 1, 0).getDate() : 30;

  const perDaySalary = monthlySalary / daysInMonth;
  const lopDeduction = Math.round(perDaySalary * absentDays);

  const totalEarnings = monthlySalary + bonusAmount;
  const totalDeductions = tds + pt + pf + lopDeduction;
  const netSalary = Math.max(0, totalEarnings - totalDeductions);

  return {
    basic, hra, lta, bonus, specialAllowance,
    bonusAmount,
    tds, pt, pf, lopDays: absentDays, lopDeduction,
    totalEarnings, totalDeductions, netSalary,
    daysInMonth, effectiveWorkDays: daysInMonth - absentDays
  };
};

const convertNumberToWords = (amount) => {
  const single = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const formatTens = (num) => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + single[num % 10] : "");
  };

  if (amount === 0) return "Zero";
  let num = Math.floor(amount);
  let words = "";

  if (Math.floor(num / 10000000) > 0) {
    words += formatTens(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (Math.floor(num / 100000) > 0) {
    words += formatTens(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (Math.floor(num / 1000) > 0) {
    words += formatTens(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (Math.floor(num / 100) > 0) {
    words += formatTens(Math.floor(num / 100)) + " Hundred ";
    num %= 100;
  }
  if (num > 0) {
    words += formatTens(num) + " ";
  }
  return words.trim();
};

const PayslipModal = ({ employee, month, year, data, onClose, logoBase64, paymentDate }) => {
  const printRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const formattedPayDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Editable state fields initialized from props
  const [editEmpName, setEditEmpName] = useState(employee?.name || "");
  const [editEmpId, setEditEmpId] = useState(employee?.employeeId || (employee?._id ? `QT-${employee._id.toString().slice(-6).toUpperCase()}` : ""));
  const [editDesignation, setEditDesignation] = useState(employee?.position || "");
  const [editDepartment, setEditDepartment] = useState(employee?.department || "");
  const [editLocation, setEditLocation] = useState(employee?.location || "Pune");
  const [editBankName, setEditBankName] = useState(employee?.bankName || employee?.documents?.bankName || "-");
  const [editBankAccount, setEditBankAccount] = useState(employee?.bankAccount || employee?.documents?.bankAccountNumber || "-");
  const [editPanNumber, setEditPanNumber] = useState(employee?.panNumber || employee?.documents?.panNumber || "-");
  const [editPaymentDate, setEditPaymentDate] = useState(formattedPayDate);
  const [editEffectiveDays, setEditEffectiveDays] = useState(data?.effectiveWorkDays ?? 30);
  const [editDaysInMonth, setEditDaysInMonth] = useState(data?.daysInMonth ?? 30);
  const [editLopDays, setEditLopDays] = useState(data?.lopDays ?? 0);

  const [editBasic, setEditBasic] = useState(data?.basic || 0);
  const [editHra, setEditHra] = useState(data?.hra || 0);
  const [editSpecialAllowance, setEditSpecialAllowance] = useState(data?.specialAllowance || 0);
  const [editLta, setEditLta] = useState(data?.lta || 0);
  const [editBonus, setEditBonus] = useState(data?.bonus || 0);
  const [editBonusAmount, setEditBonusAmount] = useState(data?.bonusAmount || 0);
  const [editTds, setEditTds] = useState(data?.tds || Math.round((data?.totalEarnings || 0) * 0.01) || 150);
  const [editPf, setEditPf] = useState(data?.pf || 0);
  const [editPt, setEditPt] = useState(data?.pt || 0);
  const [editLopDeduction, setEditLopDeduction] = useState(data?.lopDeduction || 0);

  // Live recalculated totals
  const calcTotalEarnings = Number(editBasic) + Number(editHra) + Number(editSpecialAllowance) + Number(editLta) + Number(editBonus) + Number(editBonusAmount);
  const calcTotalDeductions = Number(editTds) + Number(editPf) + Number(editPt) + Number(editLopDeduction);
  const calcNetSalary = Math.max(0, calcTotalEarnings - calcTotalDeductions);

  const displayMonth = (month || "").charAt(0).toUpperCase() + (month || "").slice(1);

  const handleDownloadPDF = () => {
    const element = printRef.current;
    if (!element) return;

    // Clone element to sanitize inputs for print
    const clone = element.cloneNode(true);
    const inputs = clone.querySelectorAll("input");
    inputs.forEach((input) => {
      const span = document.createElement("span");
      span.textContent = input.value;
      span.style.fontFamily = "'Times New Roman', Times, serif";
      span.style.fontSize = "12px";
      if (input.dataset.align === "right") {
        span.style.display = "block";
        span.style.textAlign = "right";
      }
      if (input.style.fontWeight === "bold") span.style.fontWeight = "bold";
      input.parentNode.replaceChild(span, input);
    });

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip_${(editEmpName || 'Employee').replace(/\s+/g, '_')}_${month}_${year}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: A4; margin: 0; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0; margin: 0; }
              #payslip-content {
                width: 100% !important;
                min-height: 100vh !important;
                margin: 0 !important;
              }
              table, tr, td, th { page-break-inside: avoid; }
            }
            body { background: white; font-family: 'Times New Roman', Times, serif; font-size: 12px; color: #000; }
          </style>
        </head>
        <body>
          ${clone.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handlePrint = handleDownloadPDF;

  if (!data || !employee) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-6xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-2">
              <FileText size={24} className="text-blue-500" />
              Payslip Preview
            </h2>
            {isEditing && (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-xs font-black uppercase tracking-wider animate-pulse">
                ✏️ Edit Mode Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 font-bold rounded-xl transition-all shadow-sm ${isEditing
                  ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Edit3 size={18} /> {isEditing ? "Done Editing" : "Edit Payslip"}
            </button>
            <button
              onClick={handlePrint}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
            >
              <Printer size={18} /> Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              <Download size={18} /> {isGenerating ? "Processing..." : "Save / Print PDF"}
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-8 bg-gray-200/50 flex justify-center min-w-max flex-1 overflow-auto">
          <div
            ref={printRef}
            id="payslip-content"
            className="bg-white shrink-0"
            style={{
              width: "794px",
              minHeight: "1123px",
              padding: "40px 48px",
              boxSizing: "border-box",
              color: "#000",
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: "12px",
              lineHeight: "16px",
              backgroundColor: "white",
              position: "relative",
            }}
          >
            <div style={{ position: 'relative', backgroundColor: 'white', color: 'black' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ width: '140px', flexShrink: 0 }}>
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Company Logo" style={{ height: '42px', objectFit: 'contain', objectPosition: 'left' }} />
                  ) : (
                    <img src="/qiro-logo.png" alt="Company Logo" style={{ height: '42px', objectFit: 'contain', objectPosition: 'left' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '19px', color: '#000' }}>Qiro Tech Innovation Pvt. Ltd.</div>
                  <div style={{ fontSize: '10px', color: '#333' }}>Unit 602, Floor 6th, The Business, AdvantEDGE, Hinjewadi Phase 1, Pune - 411057</div>
                </div>
                <div style={{ width: '140px' }}></div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', padding: '2px 0px', marginBottom: '10px' }}>
                Payslip for the month of {displayMonth || "-"} {year || "-"}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '10px' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '20%', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Name:</td>
                    <td style={{ width: '30%', padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editEmpName} onChange={(e) => setEditEmpName(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editEmpName || "-")}
                    </td>
                    <td style={{ width: '25%', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>PAN Number:</td>
                    <td style={{ width: '25%', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editPanNumber} onChange={(e) => setEditPanNumber(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editPanNumber || "-")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Employee ID:</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editEmpId} onChange={(e) => setEditEmpId(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editEmpId || "-")}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Emp Effective Workdays:</td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" value={editEffectiveDays} onChange={(e) => setEditEffectiveDays(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : editEffectiveDays}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Designation:</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editDesignation || "-")}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>DAYS IN MONTH:</td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" value={editDaysInMonth} onChange={(e) => setEditDaysInMonth(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : editDaysInMonth}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Department:</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editDepartment || "-")}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>PF No:</td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>-</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Location:</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editLocation || "Pune")}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>PF UAN:</td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>-</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Employee Bank:</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editBankName} onChange={(e) => setEditBankName(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editBankName || "-")}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>LOP:</td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" value={editLopDays} onChange={(e) => setEditLopDays(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editLopDays || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Bank Account No:</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editBankAccount} onChange={(e) => setEditBankAccount(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editBankAccount || "-")}
                    </td>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Gross Salary:</td>
                    <td style={{ padding: '4px 6px', fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {calcTotalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Pay Date:</td>
                    <td style={{ padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="text" value={editPaymentDate} onChange={(e) => setEditPaymentDate(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none font-sans text-xs" />
                      ) : (editPaymentDate || "-")}
                    </td>
                    <td style={{ padding: '4px 6px' }}></td>
                    <td style={{ padding: '4px 6px' }}></td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                <thead>
                  <tr>
                    <th style={{ width: '35%', textAlign: 'left', fontWeight: 'bold', padding: '5px 6px', borderBottom: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Earnings</th>
                    <th style={{ width: '15%', textAlign: 'right', fontWeight: 'bold', padding: '5px 6px', borderRight: '1px solid black', borderBottom: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Rs.</th>
                    <th style={{ width: '35%', textAlign: 'left', fontWeight: 'bold', padding: '5px 6px', borderBottom: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Deductions</th>
                    <th style={{ width: '15%', textAlign: 'right', fontWeight: 'bold', padding: '5px 6px', borderBottom: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Rs.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Basic Salary</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editBasic} onChange={(e) => setEditBasic(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : Number(editBasic).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>TDS / Income Tax</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editTds} onChange={(e) => setEditTds(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : (Number(editTds) > 0 ? Number(editTds).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>House Rent Allowance</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editHra} onChange={(e) => setEditHra(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : Number(editHra).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Provident Fund</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editPf} onChange={(e) => setEditPf(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : (Number(editPf) > 0 ? Number(editPf).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Special Allowance</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editSpecialAllowance} onChange={(e) => setEditSpecialAllowance(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : Number(editSpecialAllowance).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Professional Tax</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editPt} onChange={(e) => setEditPt(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : (Number(editPt) > 0 ? Number(editPt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Leave Travel Allowance</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editLta} onChange={(e) => setEditLta(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : Number(editLta).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Lop / Absence Deduction</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editLopDeduction} onChange={(e) => setEditLopDeduction(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : (Number(editLopDeduction) > 0 ? Number(editLopDeduction).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-")}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Statutory Bonus</td>
                    <td style={{ textAlign: 'right', padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                      {isEditing ? (
                        <input type="number" data-align="right" value={editBonus} onChange={(e) => setEditBonus(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                      ) : Number(editBonus).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '4px 6px' }}></td>
                    <td style={{ padding: '4px 6px' }}></td>
                  </tr>
                  {Number(editBonusAmount) > 0 && (
                    <tr>
                      <td style={{ padding: '4px 6px', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Bonus Allocation</td>
                      <td style={{ textAlign: 'right', padding: '4px 6px', borderRight: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>
                        {isEditing ? (
                          <input type="number" data-align="right" value={editBonusAmount} onChange={(e) => setEditBonusAmount(e.target.value)} className="w-full border border-blue-400 bg-blue-50 px-1 rounded outline-none text-right font-sans text-xs" />
                        ) : Number(editBonusAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '4px 6px' }}></td>
                      <td style={{ padding: '4px 6px' }}></td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ fontWeight: 'bold', padding: '5px 6px', borderTop: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Total Earnings:</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '5px 6px', borderRight: '1px solid black', borderTop: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>{calcTotalEarnings.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 'bold', padding: '5px 6px', borderTop: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Total Deductions:</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '5px 6px', borderTop: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>{calcTotalDeductions ? calcTotalDeductions.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} style={{ fontWeight: 'bold', padding: '5px 6px', borderTop: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>Net Salary: {convertNumberToWords(calcNetSalary)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '5px 6px', borderTop: '1px solid black', fontFamily: "'Times New Roman', Times, serif", fontSize: '12px' }}>{calcNetSalary.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ borderTop: '1px solid #ccc', marginTop: '40px', paddingTop: '8px', textAlign: 'center', fontSize: '10px', color: '#555' }}>
                This is a computer-generated payslip and does not require a signature.
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const HRSalaryPage = () => {
  const role = localStorage.getItem("role") || "hr";
  const prefix = role === "hr" ? "/hr" : "/admin";

  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bonus, setBonus] = useState(0);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCrediting, setIsCrediting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split('T')[0]);
  const [customAbsentDays, setCustomAbsentDays] = useState("");
  const [customPresentDays, setCustomPresentDays] = useState("");
  const [salaryDetails, setSalaryDetails] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [logoBase64, setLogoBase64] = useState(null);

  const [previewData, setPreviewData] = useState(null);
  const [creditSummary, setCreditSummary] = useState(null);

  const activeAbsentDays = customAbsentDays !== "" ? Number(customAbsentDays) : (salaryDetails?.absentDays || 0);
  const activePresentDays = customPresentDays !== "" ? Number(customPresentDays) : (salaryDetails?.presentDays || 0);

  const buildCreditSummary = () => {
    if (!selected || !selectedMonth || !selectedYear || !salaryDetails) return null;

    const bonusAmount = Number(bonus || 0);

    const payslip = calculatePayslipData(
      selected.salary,
      activePresentDays,
      activeAbsentDays,
      selectedMonth,
      selectedYear,
      selected.pfEnabled,
      bonusAmount
    );

    const basePayout = Math.round((Number(payslip.netSalary) || 0) - bonusAmount);

    return {
      employee: selected,
      month: selectedMonth,
      year: selectedYear,
      paymentDate: salaryDate,
      basePayout,
      bonus: bonusAmount,
      total: basePayout + bonusAmount,
      presentDays: activePresentDays,
      absentDays: activeAbsentDays,
      dailyRate: Number(salaryDetails.dailyRate) || 0,
    };
  };

  const calculateSalaryDetails = useCallback(async () => {
    setIsCalculating(true);
    try {
      const yr = Number(selectedYear || new Date().getFullYear());
      const details = await apiPost(`${prefix}/salary/calculate`, {
        userId: selected._id,
        month: selectedMonth.toLowerCase(),
        year: yr,
      });
      setSalaryDetails(details);
      setCustomAbsentDays(details.absentDays !== undefined ? String(details.absentDays) : "");
      setCustomPresentDays(details.presentDays !== undefined ? String(details.presentDays) : "");
    } catch (e) {
      console.error("Error calculating salary:", e);
      setSalaryDetails(null);
    } finally {
      setIsCalculating(false);
    }
  }, [selected, selectedMonth, selectedYear, prefix]);

  useEffect(() => {
    fetchUsers();
    fetchSalaryHistory();
    loadLogo();
  }, []);

  useEffect(() => {
    if (selected && selectedMonth && selectedYear && String(selectedYear).length === 4) {
      calculateSalaryDetails();
    } else {
      setSalaryDetails(null);
    }
  }, [selected, selectedMonth, selectedYear, calculateSalaryDetails]);

  useEffect(() => {
    setCreditSummary(null);
  }, [selected, selectedMonth, selectedYear, bonus]);

  const loadLogo = async () => {
    try {
      const res = await fetch('/full_logo.jpeg');
      if (res.ok) {
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      }
    } catch (e) {
      console.error("Failed to load logo", e);
    }
  };

  const fetchUsers = async () => {
    try {
      const employees = await apiGet(`${prefix}/employees`);
      const leaders = await apiGet(`${prefix}/leaders`);
      const hrs = await apiGet(`${prefix}/hrs`);
      setUsers([...employees, ...leaders, ...hrs]);
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      const history = await apiGet(`${prefix}/salary`);
      setSalaryHistory(history);
    } catch (e) {
      console.error("Error fetching salary history:", e);
    }
  };

  const credit = async () => {
    if (!selected) return alert("Select a user");
    if (!selectedMonth) return alert("Select a month");
    const yr = Number(selectedYear || new Date().getFullYear());
    if (!yr || yr < 2000 || yr > 2100) return alert("Enter a valid year (2000-2100)");

    const summary = buildCreditSummary();
    if (!summary) return alert("Calculate salary first");

    setIsCrediting(true);
    try {
      const creditedRecord = await apiPost(`${prefix}/salary/credit`, {
        userId: selected._id,
        bonus: Number(bonus || 0),
        month: selectedMonth.toLowerCase(),
        year: yr,
        paymentDate: salaryDate,
        absentDays: activeAbsentDays,
        presentDays: activePresentDays,
      });
      // Derive stable values from API response but prefer computed fallbacks
      const basePayoutVal = Number(creditedRecord.baseSalary) || summary.basePayout;
      const bonusVal = Number(creditedRecord.bonus) || summary.bonus;
      const totalVal = (Number(creditedRecord.totalCredited) && Number(creditedRecord.totalCredited) > 0)
        ? Number(creditedRecord.totalCredited)
        : (basePayoutVal + bonusVal);

      setCreditSummary({
        employee: creditedRecord.user || selected,
        month: creditedRecord.month || selectedMonth,
        year: creditedRecord.year || yr,
        paymentDate: salaryDate,
        basePayout: basePayoutVal,
        bonus: bonusVal,
        total: totalVal,
        presentDays: summary.presentDays,
        absentDays: summary.absentDays,
        dailyRate: summary.dailyRate,
      });
      setShowSuccess(true);
      fetchSalaryHistory();
    } catch (e) {
      console.error("Error crediting salary:", e);
      alert(e?.message || "Failed to credit salary");
    } finally {
      setIsCrediting(false);
    }
  };

  const handlePreviewCurrent = () => {
    if (!selected || !selectedMonth || !selectedYear || !salaryDetails) return;
    const payslipData = calculatePayslipData(
      selected.salary,
      activePresentDays,
      activeAbsentDays,
      selectedMonth,
      selectedYear,
      selected.pfEnabled,
      bonus
    );
    setPreviewData({
      employee: selected,
      month: selectedMonth,
      year: selectedYear,
      paymentDate: salaryDate,
      data: payslipData
    });
  };

  const buildHistoryPreviewData = (record) => {
    const recordUserId = record.user?._id || record.user?.id || record.user;
    const resolvedEmployee = users.find((user) => {
      const userId = user._id?.toString?.() || String(user._id || "");
      return recordUserId && userId === recordUserId.toString();
    }) || record.user || {};

    const baseSal = Number(resolvedEmployee.salary) || Number(record.user?.salary) || Number(record.baseSalary) || 0;
    const absentDays = Number(record.absentDays) || 0;
    const presentDays = (record.presentDays !== undefined && record.presentDays !== null)
      ? Number(record.presentDays)
      : Math.max(Number(record.daysInMonth) - absentDays, 0) || 30;

    const data = calculatePayslipData(
      baseSal,
      presentDays,
      absentDays,
      record.month,
      record.year,
      Boolean(resolvedEmployee.pfEnabled),
      record.bonus || 0
    );

    return { employee: resolvedEmployee, data };
  };

  const handlePreviewHistory = (record) => {
    const { employee, data } = buildHistoryPreviewData(record);

    setPreviewData({
      employee,
      month: record.month || "Unknown",
      year: record.year || new Date().getFullYear(),
      paymentDate: record.paymentDate || record.creditedOn,
      data
    });
  };

  return (
    <div className="min-h-screen bg-background text-primary p-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <Banknote size={28} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-primary tracking-tight mb-2">Salary Disbursal</h2>
            <p className="text-secondary font-medium opacity-80">Calculate and credit monthly compensation.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200">
            <h3 className="text-xl font-black mb-6 text-primary flex items-center gap-2">
              <Calculator size={20} className="text-primary" />
              Compensation Parameters
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Personnel</label>
                <select
                  onChange={(e) => setSelected(users.find((u) => u._id.toString() === e.target.value))}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                >
                  <option value="">Select an Employee/Lead</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id.toString()}>
                      {u.name} ({u.position}) - ₹{u.salary}/year
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                >
                  <option value="">Select Month</option>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Year</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  placeholder={new Date().getFullYear()}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Salary / Disbursal Date</label>
                <input
                  type="date"
                  value={salaryDate}
                  onChange={(e) => setSalaryDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Bonus Allocation (₹)</label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">LOP / Absent Days (Override)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="31"
                  value={customAbsentDays}
                  onChange={(e) => setCustomAbsentDays(e.target.value)}
                  placeholder={salaryDetails ? String(salaryDetails.absentDays) : "0"}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary/70 uppercase tracking-widest ml-1">Present Days (Override)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="31"
                  value={customPresentDays}
                  onChange={(e) => setCustomPresentDays(e.target.value)}
                  placeholder={salaryDetails ? String(salaryDetails.presentDays) : "0"}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-primary font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="flex items-end md:col-span-2">
                <button
                  onClick={credit}
                  disabled={isCrediting || !salaryDetails}
                  className="w-full bg-primary hover:bg-secondary text-white p-4 rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all duration-300 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  {isCrediting ? "Crediting..." : <><Banknote size={20} /> Credit Salary</>}
                </button>
              </div>
            </div>
          </div>

          {/* Salary History */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200 overflow-hidden">
            <div className="p-8 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-black text-primary flex items-center gap-2">
                <History size={20} className="text-primary" />
                Ledger History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-200">
                    <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Employee</th>
                    <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Amount</th>
                    <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Period</th>
                    <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Credited On</th>
                    <th className="p-5 font-bold text-secondary uppercase tracking-widest text-xs">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {salaryHistory.map((record) => {
                    const { data } = buildHistoryPreviewData(record);

                    return (
                      <tr key={record._id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-5">
                          <div className="font-bold text-primary">{record.user?.name || "N/A"}</div>
                          {/* <div className="text-[10px] text-secondary font-medium">BASE: ₹{record.baseSalary ?? 0}</div> */}
                        </td>
                        <td className="p-5">
                          {(() => {
                            const amountVal = (record.totalCredited && record.totalCredited >= 3000)
                              ? record.totalCredited
                              : (data.netSalary && data.netSalary >= 3000 ? data.netSalary : (record.baseSalary >= 3000 ? record.baseSalary : data.netSalary));
                            return (
                              <div className="font-black text-primary">₹ {amountVal.toLocaleString("en-IN")}</div>
                            );
                          })()}
                        </td>
                        <td className="p-5">
                          <span className="px-3 py-1 bg-gray-50 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">
                            {record.month ? record.month.split(' ')[0] : "—"} {record.year}
                          </span>
                        </td>
                        <td className="p-5 text-secondary font-medium text-xs">
                          {record.creditedOn ? new Date(record.creditedOn).toLocaleDateString('en-GB') : "—"}
                        </td>
                        <td className="p-5">
                          <button
                            onClick={() => handlePreviewHistory(record)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            <FileText size={14} /> Preview
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Breakdown Sidebar */}
        <div className="space-y-8">
          <AnimatePresence mode="wait">
            {isCalculating ? (
              <motion.div
                key="calc"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-200 text-center space-y-4"
              >
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-secondary font-bold">Auditing Attendance...</p>
              </motion.div>
            ) : salaryDetails ? (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-primary p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <TrendingUp size={120} />
                </div>

                <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                  <Info size={20} />
                  Calculated Payout
                </h3>

                <div className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl">
                      <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">Effective Present</div>
                      <div className="text-xl font-black">{Number(activePresentDays).toFixed(2)} <span className="text-xs opacity-60">DAYS</span></div>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl">
                      <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">Total LOP (Absences)</div>
                      <div className="text-xl font-black">{Number(activeAbsentDays).toFixed(2)} <span className="text-xs opacity-60">DAYS</span></div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200/10">
                    <div className="flex justify-between text-xs text-white/80">
                      <span>Leaves Taken</span>
                      <span className="font-bold">{salaryDetails.leaveDays || 0} Days</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/80">
                      <span>Late/Early/Break Deductions</span>
                      <span className="font-bold">{Number(salaryDetails.fractionalAbsences || 0).toFixed(2)} Days</span>
                    </div>
                    <div className="flex justify-between text-xs text-white/80">
                      <span>Unmarked Absences</span>
                      <span className="font-bold">{salaryDetails.unmarkedAbsences || 0} Days</span>
                    </div>
                  </div>

                  {(() => {
                    const rawSal = Number(selected?.salary) || 0;
                    const monthlySal = rawSal / 12;
                    const daysInM = Number(salaryDetails?.daysInMonth) || 30;
                    const perDay = monthlySal / daysInM;
                    const lop = Math.round(perDay * activeAbsentDays);
                    const bonusNum = Number(bonus || 0);
                    const totalEarn = monthlySal + bonusNum;
                    const tds = Math.round(monthlySal * 0.01);
                    const basic = Math.round(monthlySal * 0.48);
                    const pf = selected?.pfEnabled ? Math.round(basic * 0.12) : 0;
                    const netPay = Math.max(0, totalEarn - tds - pf - lop);

                    return (
                      <>
                        <div className="flex justify-between text-sm pt-2">
                          <span className="opacity-60">Daily Rate</span>
                          <span className="font-bold">₹{Math.round(perDay).toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="opacity-60">Gross Salary</span>
                          <span className="font-bold">₹{monthlySal.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-200">
                          <span className="opacity-80">TDS Deduction (1%)</span>
                          <span className="font-bold">- ₹{tds.toLocaleString("en-IN")}</span>
                        </div>
                        {pf > 0 && (
                          <div className="flex justify-between text-sm text-red-200">
                            <span className="opacity-80">Provident Fund</span>
                            <span className="font-bold">- ₹{pf.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        {bonusNum > 0 && (
                          <div className="flex justify-between text-sm text-emerald-300">
                            <span className="opacity-90">Bonus</span>
                            <span className="font-bold">+ ₹{bonusNum.toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        <div className="pt-6 border-t border-gray-200/10 flex flex-col gap-4">
                          <div>
                            <div className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Final Net Payout</div>
                            <div className="text-4xl font-black tracking-tighter">
                              ₹{netPay.toLocaleString("en-IN")}
                            </div>
                          </div>
                          <button
                            onClick={handlePreviewCurrent}
                            className="w-full bg-white text-primary hover:bg-gray-50 p-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            <FileText size={20} /> View Payslip Preview
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            ) : (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-8 rounded-[2.5rem] text-center">
                <Info className="mx-auto mb-4 text-gray-500" size={32} />
                <p className="text-secondary font-medium">Select an employee and period to view salary breakdown.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl border border-gray-200 text-center"
            >
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-2xl font-black mb-3 text-primary tracking-tight">Funds Credited</h3>
              <p className="text-secondary font-medium mb-8">Salary for <span className="text-primary font-black">{selected.name}</span> has been processed for <span className="text-primary font-black">{selectedMonth} {selectedYear}</span>.</p>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest">Base Payout</span>
                  <span className="font-bold text-primary">₹{creditSummary?.basePayout ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-secondary uppercase tracking-widest">Bonus</span>
                  <span className="font-bold text-primary">₹{creditSummary?.bonus ?? 0}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-sm font-black text-primary uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black text-primary">
                    ₹ {(Number(creditSummary?.basePayout || 0) + Number(creditSummary?.bonus || 0)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowSuccess(false)}
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-secondary transition-all shadow-xl shadow-primary/20"
              >
                Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewData && (
          <PayslipModal
            employee={previewData.employee}
            month={previewData.month}
            year={previewData.year}
            data={previewData.data}
            paymentDate={previewData.paymentDate}
            logoBase64={logoBase64}
            onClose={() => setPreviewData(null)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default HRSalaryPage;
