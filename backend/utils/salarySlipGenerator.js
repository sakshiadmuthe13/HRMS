import PDFDocument from 'pdfkit';
import { sendMail } from '../config/nodemailer.js';
import path from 'path';
import fs from 'fs';

const formatAmount = (value) => {
  const num = Number(value || 0);
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getDaysInMonth = (month, year) => {
  const monthIndex = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ].indexOf(String(month || '').toLowerCase());

  if (monthIndex < 0) return 30;
  return new Date(Number(year) || new Date().getFullYear(), monthIndex + 1, 0).getDate();
};

const convertNumberToWords = (num) => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (n_array[1] != 0) ? (a[Number(n_array[1])] || (b[n_array[1][0]] + ' ' + a[n_array[1][1]])) + 'Crore ' : '';
    str += (n_array[2] != 0) ? (a[Number(n_array[2])] || (b[n_array[2][0]] + ' ' + a[n_array[2][1]])) + 'Lakh ' : '';
    str += (n_array[3] != 0) ? (a[Number(n_array[3])] || (b[n_array[3][0]] + ' ' + a[n_array[3][1]])) + 'Thousand ' : '';
    str += (n_array[4] != 0) ? (a[Number(n_array[4])] || (b[n_array[4][0]] + ' ' + a[n_array[4][1]])) + 'Hundred ' : '';
    str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || (b[n_array[5][0]] + ' ' + a[n_array[5][1]])) : '';
    return str.trim();
  };

  const amount = Math.floor(Number(num || 0));
  return inWords(amount) ? inWords(amount) + ' Only' : 'Zero Only';
};

/**
 * Generate a PDF Salary Slip in memory matching exact Qiro Tech Payslip format
 * @param {Object} user - The user object
 * @param {Object} salaryDetails - Breakdown from calculateSalaryDetails
 * @param {Object} creditRecord - The saved Salary record
 */
export const generateSalarySlipBuffer = async (user, salaryDetails, creditRecord) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      const monthName = (creditRecord.month || '').charAt(0).toUpperCase() + (creditRecord.month || '').slice(1);
      const year = creditRecord.year || new Date().getFullYear();
      const monthYear = `${monthName} ${year}`;

      // Try locating Qiro Tech logo
      const logoPath = path.resolve('../frontend/public/qiro-logo.png');
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 40, 35, { width: 110 });
        } catch (e) { }
      }

      // Company Header
      doc.fontSize(16).font('Times-Bold').fillColor('#000000').text('Qiro Tech Innovation Pvt. Ltd.', { align: 'center' });
      doc.fontSize(9).font('Times-Roman').fillColor('#333333').text('Unit 602, Floor 6th, The Business, AdvantEDGE, Hinjewadi Phase 1, Pune - 411057', { align: 'center' });
      doc.moveDown(0.8);
      doc.fontSize(11).font('Times-Bold').fillColor('#000000').text(`Payslip for the month of ${monthYear}`, { align: 'center' });
      doc.moveDown(0.8);

      // Section 1: Employee Details Table (Boxed)
      const empBoxTop = 105;
      const empBoxHeight = 118;
      const empBoxWidth = 515;
      const startX = 40;
      const midX = 295;

      doc.lineWidth(1).strokeColor('#000000');
      doc.rect(startX, empBoxTop, empBoxWidth, empBoxHeight).stroke();
      doc.moveTo(midX, empBoxTop).lineTo(midX, empBoxTop + empBoxHeight).stroke();

      const empId = user.employeeId || (user._id ? `QT-${user._id.toString().slice(-6).toUpperCase()}` : 'N/A');
      const bankAcc = user.documents?.bankAccountNumber || user.bankAccount || '-';
      const bankName = user.documents?.bankName || user.bankName || '-';
      const panNo = user.documents?.panNumber || user.panNumber || '-';
      const pfNo = user.pfNumber || '-';
      const uanNo = user.uanNumber || '-';

      const daysInMonth = Number(salaryDetails?.daysInMonth) || getDaysInMonth(creditRecord.month, creditRecord.year);
      const absentDays = Number(salaryDetails?.absentDays || creditRecord.absentDays || 0);
      const effectiveWorkDays = Number(salaryDetails?.effectiveWorkDays || creditRecord.presentDays || (daysInMonth - absentDays));

      const paymentDateVal = creditRecord.paymentDate || creditRecord.creditedOn;
      const paymentDateStr = paymentDateVal ? new Date(paymentDateVal).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

      const salaryBase = (Number(user.salary) || 0) / 12;
      const bonus = Number(creditRecord.bonus) || 0;
      const grossSalary = salaryBase + bonus;

      const leftDetails = [
        ['Name:', user.name || '-'],
        ['Employee ID:', empId],
        ['Designation:', user.position || '-'],
        ['Department:', user.department || '-'],
        ['Location:', user.location || 'Pune'],
        ['Employee Bank:', bankName],
        ['Bank Account No:', bankAcc],
        ['Pay Date:', paymentDateStr]
      ];

      const rightDetails = [
        ['PAN Number:', panNo],
        ['Emp Effective Workdays:', String(effectiveWorkDays)],
        ['DAYS IN MONTH:', String(daysInMonth)],
        ['PF No:', pfNo],
        ['PF UAN:', uanNo],
        ['LOP:', String(absentDays)],
        ['Gross Salary:', formatAmount(grossSalary)]
      ];

      doc.font('Times-Roman').fontSize(9.5).fillColor('#000000');

      let currentY = empBoxTop + 5;
      leftDetails.forEach(([label, val]) => {
        doc.font('Times-Roman').text(label, startX + 6, currentY, { width: 100 });
        doc.font('Times-Roman').text(val, startX + 105, currentY, { width: 140 });
        currentY += 14;
      });

      currentY = empBoxTop + 5;
      rightDetails.forEach(([label, val]) => {
        doc.font('Times-Roman').text(label, midX + 6, currentY, { width: 120 });
        if (label === 'Gross Salary:') {
          doc.font('Times-Bold').text(val, midX + 130, currentY, { width: 85 });
        } else {
          doc.font('Times-Roman').text(val, midX + 130, currentY, { width: 85 });
        }
        currentY += 14;
      });

      // Section 2: Earnings & Deductions Table
      const tableTop = empBoxTop + empBoxHeight + 12;
      const tableHeight = 175;
      const colSplit = 295;

      doc.rect(startX, tableTop, empBoxWidth, tableHeight).stroke();
      doc.moveTo(colSplit, tableTop).lineTo(colSplit, tableTop + tableHeight).stroke();

      // Header Row
      const headY = tableTop + 5;
      doc.font('Times-Bold').fontSize(9.5);
      doc.text('Earnings', startX + 6, headY);
      doc.text('Rs.', startX + 200, headY, { width: 45, align: 'right' });
      doc.text('Deductions', colSplit + 6, headY);
      doc.text('Rs.', startX + empBoxWidth - 50, headY, { width: 45, align: 'right' });

      doc.moveTo(startX, tableTop + 18).lineTo(startX + empBoxWidth, tableTop + 18).stroke();

      // Computations
      const pfEnabled = Boolean(user.pfEnabled);
      const basic = Math.round(salaryBase * 0.48);
      const hra = Math.round(salaryBase * 0.20);
      const lta = Math.round(salaryBase * 0.05);
      const statutoryBonus = Math.round(salaryBase * 0.04);
      const specialAllowance = salaryBase - (basic + hra + lta + statutoryBonus);

      const tds = Math.round(salaryBase * 0.01);
      const pt = 0;
      const pf = pfEnabled ? Math.round(basic * 0.12) : 0;
      const lopDeduction = Math.round((salaryBase / daysInMonth) * absentDays);

      const totalEarnings = salaryBase + bonus;
      const totalDeductions = tds + pt + pf + lopDeduction;
      const netSalary = Math.max(0, totalEarnings - totalDeductions);

      const rows = [
        ['Basic Salary', formatAmount(basic), 'TDS / Income Tax', tds ? formatAmount(tds) : '-'],
        ['House Rent Allowance', formatAmount(hra), 'Provident Fund', pf ? formatAmount(pf) : '-'],
        ['Special Allowance', formatAmount(specialAllowance), 'Professional Tax', pt ? formatAmount(pt) : '-'],
        ['Leave Travel Allowance', formatAmount(lta), 'Lop / Absence Deduction', lopDeduction ? formatAmount(lopDeduction) : '-'],
        ['Statutory Bonus', formatAmount(statutoryBonus), '', '']
      ];

      if (bonus > 0) {
        rows.push(['Bonus Allocation', formatAmount(bonus), '', '']);
      }

      let rowY = tableTop + 24;
      doc.font('Times-Roman');
      rows.forEach(([earnLabel, earnVal, dedLabel, dedVal]) => {
        if (earnLabel) {
          doc.text(earnLabel, startX + 6, rowY);
          doc.text(earnVal, startX + 170, rowY, { width: 75, align: 'right' });
        }
        if (dedLabel) {
          doc.text(dedLabel, colSplit + 6, rowY);
          doc.text(dedVal, startX + empBoxWidth - 65, rowY, { width: 60, align: 'right' });
        }
        rowY += 16;
      });

      // Totals Row
      const totalRowY = tableTop + tableHeight - 34;
      doc.moveTo(startX, totalRowY).lineTo(startX + empBoxWidth, totalRowY).stroke();

      doc.font('Times-Bold');
      doc.text('Total Earnings:', startX + 6, totalRowY + 5);
      doc.text(formatAmount(totalEarnings), startX + 170, totalRowY + 5, { width: 75, align: 'right' });

      doc.text('Total Deductions:', colSplit + 6, totalRowY + 5);
      doc.text(totalDeductions ? formatAmount(totalDeductions) : '-', startX + empBoxWidth - 65, totalRowY + 5, { width: 60, align: 'right' });

      // Net Salary Row
      const netRowY = tableTop + tableHeight - 17;
      doc.moveTo(startX, netRowY).lineTo(startX + empBoxWidth, netRowY).stroke();

      const words = convertNumberToWords(netSalary);
      doc.font('Times-Bold');
      doc.text(`Net Salary: ${words}`, startX + 6, netRowY + 4, { width: 380 });
      doc.text(formatAmount(netSalary), startX + empBoxWidth - 85, netRowY + 4, { width: 80, align: 'right' });

      // Section 3: Footer
      doc.moveTo(startX, 740).lineTo(startX + empBoxWidth, 740).strokeColor('#cccccc').stroke();
      doc.fontSize(8.5).font('Times-Roman').fillColor('#555555').text('This is a computer-generated payslip and does not require a signature.', startX, 748, { align: 'center', width: empBoxWidth });

      doc.end();
    } catch (err) {
      console.error("PDF Generation error:", err);
      reject(err);
    }
  });
};

export const generateAndSendSalarySlip = async (user, salaryDetails, creditRecord) => {
  try {
    const pdfData = await generateSalarySlipBuffer(user, salaryDetails, creditRecord);

    const monthYear = `${creditRecord.month.charAt(0).toUpperCase() + creditRecord.month.slice(1)} ${creditRecord.year}`;
    const subject = `Salary Slip - ${monthYear}`;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #12637E;">Salary Credited</h2>
      <p>Dear ${user.name},</p>
      <p>Your salary for the month of <strong>${monthYear}</strong> has been credited to your account.</p>
      <p>Please find attached your detailed pay slip.</p>
      <br/>
      <p>Best regards,</p>
      <p><strong>Qiro Tech Innovation Pvt. Ltd.</strong></p>
    </div>
    `;

    const attachment = {
      filename: `Salary_Slip_${monthYear.replace(' ', '_')}.pdf`,
      content: pdfData,
      contentType: 'application/pdf'
    };

    await sendMail(user.email, subject, "Please find your attached salary slip.", htmlContent, [attachment]);
  } catch (err) {
    console.error("Failed to generate and send salary slip:", err);
    throw err;
  }
};
