import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { FileText, Send, Download, Eye, X, Mail, Printer } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  TableBorders,
  BorderStyle,
  WidthType,
  AlignmentType,
  Footer
} from "docx";

const base64ToUint8Array = (base64DataUrl) => {
  if (!base64DataUrl) return null;
  const parts = base64DataUrl.split(",");
  const base64Str = parts[1] || parts[0];
  try {
    const raw = window.atob(base64Str);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  } catch (err) {
    console.error("Failed to decode base64 string", err);
    return null;
  }
};

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const FULL_TIME_CATEGORIES = [
  "Offer Letter",
  "Joining Letter",
  "Experience Letter",
  "Relieving Letter",
  "Termination Letter",
];

const INTERN_CATEGORIES = [
  "Internship Offer Letter",
  "Internship Completion Certificate",
  "Termination Letter",
];

const FULL_TIME_POSITIONS = [
  "Digital Marketing Executive",
  "Sales and Marketing Executive",
  "Front-End Developer",
  "Full-Stack Developer",
  "SEO Executive",
];

const INTERN_POSITIONS = [
  "Digital Marketing Intern",
  "Sales and Marketing Intern",
  "Front-End Development Intern",
  "Full-Stack Development Intern",
  "SEO Executive Intern",
];

const fetchJson = async (path, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.headers || {}),
    },
    ...opts,
  });
  if (!res.ok) {
    let text = await res.text();
    try {
      text = JSON.parse(text);
    } catch {
      // Ignore
    }
    throw new Error((text && text.message) || res.statusText || "API error");
  }
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

const getLetterContent = (employeeType, category, formData, position, gender) => {
  const p = gender === "Female" ? "she" : "he";
  const P = gender === "Female" ? "She" : "He";
  const pObj = gender === "Female" ? "her" : "him";
  const pPos = gender === "Female" ? "her" : "his";
  const pPosCap = gender === "Female" ? "Her" : "His";

  const {
    name = "[Employee Name]",
    startDate = "[Start Date]",
    endDate = "[End Date]",
    reason = "[Reason]",
    ctc = "3,40,000",
    ctcInWords = "Three Lakh Forty Thousand Rupees Only",
    ctcShort = "3.4 Lacs",
    fixedSalary = "3 Lacs",
    variableSalary = "40,000",
    variablePerQuarter = "10,000"
  } = formData;

  if (employeeType === "Full-Time" && category === "Termination Letter") {
    return [
      `This letter serves as formal notice that your employment with **Qirotech Innovation Pvt. Ltd.** in the position of **${position}** will be terminated effective from **${endDate}**`,
      "",
      `This decision has been made due to **${reason || "[Reason]"}** Despite previous discussions/warnings/performance reviews, the required improvements and expectations have not been satisfactorily met.`,
      "",
      `You are requested to complete the handover process and return all company property including documents, devices, ID cards, and access credentials before your last working day. Any pending salary, benefits, or dues (if applicable) will be processed as per company policy.`,
      "",
      `We thank you for your contributions during your tenure and wish you success in your future endeavors.`
    ];
  }

  if (employeeType === "Intern" && category === "Termination Letter") {
    return [
      `This letter is to formally inform you that your internship with **Qirotech Innovation Pvt. Ltd.** as a **${position}** is being terminated effective from **${endDate}**`,
      "",
      `The decision has been taken due to **${reason || "[Reason]"}** Despite prior discussions and feedback, the expected level of participation/performance/professional conduct has not been met during the internship period.`,
      "",
      `As your internship was temporary in nature and governed by the internship terms and conditions, the company has decided to discontinue the internship program with immediate effect. You are requested to complete all pending formalities and return any company assets, documents, or credentials in your possession.`,
      "",
      `We appreciate your time with the organization and wish you success in your future endeavors.`
    ];
  }

  if (employeeType === "Full-Time" && category === "Offer Letter") {
    return [
      `We are pleased to make an offer as a **${position}** at **Qirotech Innovation Pvt. Ltd.**, effective from **${startDate}** at Pune location.`,
      "",
      `We propose to pay you an Annual (CTC) of Rs. ${ctc}/- (${ctcInWords}). ${ctcShort} CTC = ${fixedSalary} Fixed & ${variableSalary} Variable (${variablePerQuarter} Rs per quarter will be paid based on the performance against the given objectives). The Variable component can be converted to profit sharing after initial 6 months based-on the performance.`,
      "",
      `Subject to your performance, your CTC would be revised after 12 months, as per our appraisal circle. Your probation period would be three months.`,
      "",
      `On reporting, please bring two recent passport size photographs, photocopy of all educational certificates, address & photo IDproof, IT Declaration/Form16 from last employer, last 6-month salary slips and relieving letter of the last employer.`,
      "",
      `Offer validates with background check verification before/after your joining.  Please return a signed copy of this letter as your acceptance of the offer, confirming your date of joining.`,
      "",
      `We look forward to a mutually rewarding relationship`
    ];
  }

  if (employeeType === "Full-Time" && category === "Experience Letter") {
    return [
      `This is to certify that **${name}** was working with **Qirotech Innovation Pvt. Ltd.** as a **${position}** from **${startDate}** to **${endDate}**.`,
      "",
      `During ${pPos} tenure, ${p} was found to be sincere, hardworking, and professional in discharging the responsibilities assigned to ${pObj}. ${pPosCap} performance and conduct throughout the employment period were satisfactory.`,
      "",
      `We appreciate ${pPos} contribution to the organization and wish ${pObj} success in future endeavors.`
    ];
  }

  if (employeeType === "Full-Time" && category === "Relieving Letter") {
    return [
      `We would like to inform you that the management of **Qirotech Innovation Pvt. Ltd.** has accepted your resignation and agreed to relieve you from your duties at the close of business hours on **${endDate}**.`,
      "",
      `You have been associated with the organization from **${startDate}** to **${endDate}**. At the time of separation, you were designated as **${position}**.`,
      "",
      `We would like to acknowledge that you have been sincere, hardworking, and diligent in executing your responsibilities and have consistently met the company’s performance standards during your tenure with us.`,
      "",
      `We wish you success and growth in your future career endeavors.`
    ];
  }

  if (employeeType === "Intern" && (category === "Offer Letter" || category === "Internship Offer Letter")) {
    return [
      `Congratulations!`,
      "",
      `We are pleased to offer you the position of **${position}** at **Qiro Tech Innovation Pvt. Ltd.** We are impressed with your background and are excited to welcome you to our team.`,
      "",
      `Your onboarding is scheduled for **${startDate}** at **9:30 AM.** This position reports directly to the respective department mentor and your standard working hours will be from 9:30 AM to 6:30 PM, Monday through Saturday, while Sunday will be observed as a weekly off.`,
      "",
      `**Internship Terms:**`,
      "",
      `• **Stipend:** Unpaid`,
      "",
      `• **Duration:** This internship is for a mandatory period of 6 months, starting from your date of joining.`,
      "",
      `• **Commitment Clause:** By signing and accepting this offer, you agree not to terminate or abandon the internship before completion of the full 6-month duration. This letter will serve as a binding contract between you and Qiro Tech Innovation Pvt. Ltd. during this period.`,
      "",
      `• **Performance and Termination Clause:** Your internship is for a period of 6 months. However, please note that continued engagement is subject to satisfactory performance and adherence to company policies. The company reserves the right to terminate the internship at any time before the completion of the 6-month period if your performance is found to be unsatisfactory or if there is any breach of discipline, conduct or company policies. Such termination will be communicated in writing and will be effective immediately upon notice.`,
      "",
      `• **Performance Review:** Your performance will be evaluated throughout the internship. Based on your performance, you may be considered for a full-time opportunity at the end of the internship term. Along with this, company evaluate technical performance, promptness in work and attendance, behavior during internship also factors in market leads to employment-ship.`,
      "",
      `Please find enclosed a list of documents required for onboarding. You are requested to email the scanned copies to the official HR email ID of Qiro Tech Innovation Pvt. Ltd., and also bring the hard copies with you on the date of joining.`,
      "",
      `We are confident in your potential to contribute meaningfully to the success of Qiro Tech Innovation Pvt. Ltd. and look forward to seeing your growth during your time with us.`,
      "",
      `Kindly sign and return the enclosed copy of this letter to confirm your acceptance of the offer.`
    ];
  }

  if (employeeType === "Intern" && category === "Internship Completion Certificate") {
    return [
      `This is to certify that **${name}** has successfully completed the internship with **Qirotech Innovation Pvt. Ltd.** as a **${position}** from **${startDate}** to **${endDate}**.`,
      "",
      `During the internship tenure, ${p} was actively involved in department related responsibilities and contributed effectively to assigned tasks and projects.`,
      "",
      `${P} carried out responsibilities with sincerity, dedication, professionalism and a positive learning attitude. ${pPosCap} overall performance throughout the internship period was found to be satisfactory.`,
      "",
      `We appreciate the contribution made during the internship and wish ${pObj} success in future endeavors.`
    ];
  }

  // Fallback
  let firstName = "[First Name]";
  if (name && name !== "[Employee Name]") {
    const parts = name.trim().split(/\s+/);
    const hasTitle = parts[0].includes(".");
    if (parts.length > 1 && hasTitle) {
      firstName = parts[1];
    } else if (parts.length > 0) {
      firstName = parts[0];
    }
  }

  return [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "",
    `We wish ${firstName} good luck for ${pPos} future.`
  ];
};

const renderJustifiedLine = (doc, tokens, x, y, maxWidth, currentWidth, isLastLine) => {
  doc.setFontSize(10.5);
  const normalSpaceWidth = doc.getTextWidth(" ");
  if (tokens.length === 1 || isLastLine) {
    let currentX = x;
    tokens.forEach((token) => {
      doc.setFont("helvetica", token.isBold ? "bold" : "normal");
      doc.text(token.text, currentX, y);
      currentX += token.width + normalSpaceWidth;
    });
  } else {
    let totalWordWidth = tokens.reduce((sum, t) => sum + t.width, 0);
    let spaceWidth = (maxWidth - totalWordWidth) / Math.max(1, tokens.length - 1);

    // Ensure spaces never collapse or stretch unnaturally
    if (spaceWidth < normalSpaceWidth || spaceWidth > normalSpaceWidth * 2.2) {
      spaceWidth = normalSpaceWidth;
    }

    let currentX = x;
    tokens.forEach((token) => {
      doc.setFont("helvetica", token.isBold ? "bold" : "normal");
      doc.text(token.text, currentX, y);
      currentX += token.width + spaceWidth;
    });
  }
};

const estimateParagraphLines = (doc, text, maxWidth) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  const words = [];
  parts.forEach(part => {
    if (!part) return;
    const isBold = part.startsWith("**") && part.endsWith("**");
    const content = isBold ? part.slice(2, -2) : part;
    content.split(/\s+/).filter(w => w.length > 0).forEach(word => {
      words.push({ word, isBold });
    });
  });
  if (words.length === 0) return 0;
  let lines = 1;
  let currentWidth = 0;
  words.forEach(w => {
    doc.setFont("helvetica", w.isBold ? "bold" : "normal");
    doc.setFontSize(10.5);
    const wordW = doc.getTextWidth(w.word);
    const spaceW = doc.getTextWidth(" ");
    if (currentWidth === 0) {
      currentWidth = wordW;
    } else if (currentWidth + spaceW + wordW > maxWidth) {
      lines++;
      currentWidth = wordW;
    } else {
      currentWidth += spaceW + wordW;
    }
  });
  return lines;
};

const renderJustifiedMarkdownText = (doc, text, startX, startY, maxWidth, lineHeight, bottomMargin, addNewPage) => {
  doc.setFontSize(10.5);
  const tokens = [];
  const parts = text.split(/(\*\*.*?\*\*)/g);
  parts.forEach(part => {
    if (!part) return;
    const isBold = part.startsWith("**") && part.endsWith("**");
    const content = isBold ? part.slice(2, -2) : part;
    const words = content.split(/\s+/).filter(w => w.length > 0);
    words.forEach(word => {
      tokens.push({ text: word, isBold });
    });
  });

  if (tokens.length === 0) return startY;

  let currentY = startY;
  let lineTokens = [];
  let currentLineWidth = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    doc.setFont("helvetica", token.isBold ? "bold" : "normal");
    const wordWidth = doc.getTextWidth(token.text);
    const spaceWidth = doc.getTextWidth(" ");

    if (lineTokens.length === 0) {
      lineTokens.push({ ...token, width: wordWidth });
      currentLineWidth = wordWidth;
    } else {
      if (currentLineWidth + spaceWidth + wordWidth > maxWidth) {
        if (bottomMargin && addNewPage && currentY + lineHeight > bottomMargin) {
          currentY = addNewPage();
        }
        renderJustifiedLine(doc, lineTokens, startX, currentY, maxWidth, currentLineWidth, false);
        currentY += lineHeight;
        lineTokens = [{ ...token, width: wordWidth }];
        currentLineWidth = wordWidth;
      } else {
        lineTokens.push({ ...token, width: wordWidth });
        currentLineWidth += spaceWidth + wordWidth;
      }
    }
  }

  if (lineTokens.length > 0) {
    if (bottomMargin && addNewPage && currentY + lineHeight > bottomMargin) {
      currentY = addNewPage();
    }
    renderJustifiedLine(doc, lineTokens, startX, currentY, maxWidth, currentLineWidth, true);
  }

  return currentY;
};

const HRGenerateLetterPage = () => {
  const role = localStorage.getItem("role") || "hr";
  const prefix = role === "hr" ? "/hr" : "/admin";

  const MotionDiv = motion.div;
  const [employeeType, setEmployeeType] = useState("Full-Time");
  const [selectedCategory, setSelectedCategory] = useState(FULL_TIME_CATEGORIES[0]);
  const [position, setPosition] = useState(FULL_TIME_POSITIONS[0]);
  const [gender, setGender] = useState("Male");

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    date: format(new Date(), "dd MMMM yyyy"),
    reason: "",
    hrFullName: "",
    hrDesignation: "People Operations Officer",
    ctc: "3,40,000",
    ctcInWords: "Three Lakh Forty Thousand Rupees Only",
    ctcShort: "3.4 Lacs",
    fixedSalary: "3 Lacs",
    variableSalary: "40,000",
    variablePerQuarter: "10,000",
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [stampBase64, setStampBase64] = useState(null);
  const [signBase64, setSignBase64] = useState(null);
  const [customSignBase64, setCustomSignBase64] = useState(null);

  // Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (employeeType === "Full-Time") {
      setSelectedCategory(FULL_TIME_CATEGORIES[0]);
      setPosition(FULL_TIME_POSITIONS[0]);
    } else {
      setSelectedCategory(INTERN_CATEGORIES[0]);
      setPosition(INTERN_POSITIONS[0]);
    }
  }, [employeeType]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const loadAsBase64 = async (path, setter) => {
          try {
            const res = await fetch(path);
            if (!res.ok) return;
            const blob = await res.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              const img = new Image();
              img.onload = () => {
                setter({ data: reader.result, width: img.width, height: img.height });
              };
              img.src = reader.result;
            };
            reader.readAsDataURL(blob);
          } catch (err) {
            console.error(`Error loading image ${path}`, err);
          }
        };

        await Promise.all([
          loadAsBase64('/full_logo.jpeg', setLogoBase64),
          loadAsBase64('/stamp.png', setStampBase64),
          loadAsBase64('/sign.png', setSignBase64)
        ]);
      } catch (e) {
        console.error("Error loading images", e);
      }
    };
    loadImages();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          setCustomSignBase64({
            data: reader.result,
            width: img.width,
            height: img.height
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } else {
      setCustomSignBase64(null);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageMargin = 20.4;
    const contentLeft = pageMargin;
    const contentRight = pageWidth - pageMargin;
    const contentWidth = contentRight - contentLeft;
    const headerLineY = pageMargin + 12;
    const footerLineY = pageHeight - 18; // Keep footer line safely within printable margin
    const footerTextY = pageHeight - 12; // Place website URL clearly above printer bottom margin
    const contentStartY = headerLineY + 22; // Increased top spacing below header line
    const contentBottomY = footerLineY - 10; // Content stops comfortably above footer line

    const drawHeaderFooter = () => {
      if (logoBase64 && logoBase64.data) {
        doc.addImage(logoBase64.data, "JPEG", contentLeft, pageMargin - 15.4, 45, 15);
      } else {
        doc.setTextColor(24, 114, 163);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("QIRO TECH", contentLeft, pageMargin - 5.4);
      }

      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Qiro Tech Innovation Pvt. Ltd.", contentRight, pageMargin - 12.4, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("Unit 602, Floor 6th, The Business AdvantEDGE, Hinjawadi", contentRight, pageMargin - 8.0, { align: "right" });
      doc.text("Phase 1, Pune – 411057 (MH) IND.", contentRight, pageMargin - 3.8, { align: "right" });

      const phoneStr = "  +91 7843094847";
      const phoneW = doc.getTextWidth(phoneStr);
      doc.setTextColor(0, 0, 0);
      doc.text(phoneStr, contentRight, pageMargin + 0.4, { align: "right" });

      doc.setTextColor(0, 51, 204);
      const emailStr = "hr@qirotec.com";
      const emailX = contentRight - phoneW;
      doc.text(emailStr, emailX, pageMargin + 0.4, { align: "right" });
      const emailW = doc.getTextWidth(emailStr);
      doc.setDrawColor(0, 51, 204);
      doc.setLineWidth(0.2);
      doc.line(emailX - emailW, pageMargin + 0.9, emailX, pageMargin + 0.9);

      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(contentLeft, headerLineY, contentRight, headerLineY);

      doc.line(contentLeft, footerLineY, contentRight, footerLineY);

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("www.qirotec.com", contentRight, footerTextY, { align: "right" });

      // Reset text color to black for body content
      doc.setTextColor(0, 0, 0);
    };

    const addNewPage = () => {
      doc.addPage();
      drawHeaderFooter();
      return headerLineY + 16; // Continuation content starts comfortably below header line
    };

    const checkPageBreak = (currentY, requiredSpace = 10) => {
      if (currentY + requiredSpace > contentBottomY) {
        return addNewPage();
      }
      return currentY;
    };

    drawHeaderFooter();

    let y = contentStartY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(formData.date || format(new Date(), "dd MMMM yyyy"), contentLeft, y);
    y += 18; // Increased gap between Date and OFFER LETTER heading

    // If this is an Experience Letter, render the 'TO WHOMSO EVER IT MAY CONCERN' heading above the category
    if (selectedCategory === 'Experience Letter') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TO WHOMSO EVER IT MAY CONCERN', pageWidth / 2, y, { align: 'center' });
      const headingWidth = doc.getTextWidth('TO WHOMSO EVER IT MAY CONCERN');
      doc.setLineWidth(0.6);
      doc.setDrawColor(0, 0, 0);
      doc.line(pageWidth / 2 - headingWidth / 2, y + 1.5, pageWidth / 2 + headingWidth / 2, y + 1.5);
      y += 14;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    let headingTitle = (selectedCategory || "").toUpperCase();
    if (employeeType === "Intern" && headingTitle === "OFFER LETTER") {
      headingTitle = "INTERNSHIP OFFER LETTER";
    }
    doc.text(headingTitle, pageWidth / 2, y, { align: "center" });
    y += 25; // Reduced spacing below heading by 20mm (2 cm) to 15mm

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    const employeeName = formData.name || "[Employee Name]";

    y = checkPageBreak(y, 20);
    doc.text("To,", contentLeft, y); y += 6;
    doc.setFont("helvetica", "bold");
    doc.text(employeeName + ",", contentLeft, y); y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);

    const paragraphs = getLetterContent(employeeType, selectedCategory, formData, position, gender);
    paragraphs.forEach(paragraph => {
      if (paragraph === "") {
        y = checkPageBreak(y, 4);
        y += 4;
      } else {
        const linesCount = estimateParagraphLines(doc, paragraph, contentWidth);
        const neededHeight = linesCount * 5.5;
        if (y + neededHeight > contentBottomY) {
          y = addNewPage();
        }
        const newY = renderJustifiedMarkdownText(doc, paragraph, contentLeft, y, contentWidth, 5.5, contentBottomY, addNewPage);
        y = newY + 5.5;
      }
    });

    y = checkPageBreak(y, 50); // Keep enough room for the signature block and footer

    y += 8;

    doc.setFontSize(10.5);
    doc.setFont("helvetica", "normal");
    doc.text("Yours Faithfully,", contentLeft, y); y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("For Qiro Tech Innovation Pvt. Ltd.", contentLeft, y);

    if (stampBase64 && stampBase64.data) {
      doc.addImage(stampBase64.data, "PNG", contentLeft + 5, y, 40, 35);
    }

    const finalSign = customSignBase64 || signBase64;
    if (finalSign && finalSign.data) {
      const maxWidth = 48;
      const maxHeight = 32;
      let renderWidth = maxWidth;
      let renderHeight = maxHeight;

      if (finalSign.width && finalSign.height) {
        const ratio = Math.min(maxWidth / finalSign.width, maxHeight / finalSign.height);
        renderWidth = finalSign.width * ratio;
        renderHeight = finalSign.height * ratio;
      }

      doc.addImage(finalSign.data, "PNG", contentLeft + 28, y + 2 + (maxHeight - renderHeight) / 2, renderWidth, renderHeight);
    }

    y += 38;
    doc.setFont("helvetica", "bold");
    const hrName = formData.hrFullName || "Prashant Kulkarni";
    const hrDesignation = formData.hrDesignation || "People Operations Officer";

    doc.text(hrName, contentLeft, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(hrDesignation, contentLeft, y);

    const pdfDataUri = doc.output('datauristring');
    setPreviewUrl(pdfDataUri);

    const blob = doc.output('blob');
    setPdfBlob(blob);

    setEmailSubject(`${selectedCategory} - ${formData.name}`);
  };

  useEffect(() => {
    generatePDF();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeType, selectedCategory, position, gender, formData, logoBase64, stampBase64, signBase64, customSignBase64]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `${selectedCategory.replace(/ /g, "_")}_${formData.name.replace(/ /g, "_") || "Letter"}.pdf`;
    link.click();
  };

  const handleDownloadWord = async () => {
    try {
      const paragraphsData = getLetterContent(employeeType, selectedCategory, formData, position, gender)
        .filter(p => p !== "");
      const sectionChildren = [];

      const headerCells = [];
      const logoData = base64ToUint8Array(logoBase64?.data);
      if (logoData) {
        headerCells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoData,
                    transformation: {
                      width: 170,
                      height: 57,
                    },
                    type: "jpeg",
                  }),
                ],
              }),
            ],
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            width: { size: 50, type: WidthType.PERCENTAGE },
          })
        );
      } else {
        headerCells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "QIRO TECH",
                    bold: true,
                    size: 40,
                    color: "1872A3",
                  }),
                ],
              }),
            ],
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            width: { size: 50, type: WidthType.PERCENTAGE },
          })
        );
      }

      headerCells.push(
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Qiro Tech Innovation Pvt. Ltd.",
                  bold: true,
                  size: 20,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "Unit 602, Floor 6th, The Business AdvantEDGE, Hinjawadi\nPhase 1, Pune – 411057 (MH) IND.\nhr@qirotec.com   +91 7843094847",
                  size: 17,
                }),
              ],
              alignment: AlignmentType.RIGHT,
            }),
          ],
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          width: { size: 50, type: WidthType.PERCENTAGE },
        })
      );

      const headerTable = new Table({
        rows: [
          new TableRow({
            children: headerCells,
          }),
        ],
        borders: TableBorders.NONE,
        width: { size: 100, type: WidthType.PERCENTAGE },
      });

      sectionChildren.push(headerTable);

      sectionChildren.push(
        new Paragraph({
          border: {
            bottom: {
              color: "969696",
              space: 8,
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { after: 200 },
        })
      );

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: formData.date || format(new Date(), "dd MMMM yyyy"),
              bold: true,
              size: 22,
            }),
          ],
          spacing: { before: 240, after: 200 },
        })
      );

      if (selectedCategory === "Experience Letter") {
        sectionChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "TO WHOMSO EVER IT MAY CONCERN",
                bold: true,
                underline: {},
                size: 28,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 200 },
          })
        );
      }

      let docxHeading = (selectedCategory || "").toUpperCase();
      if (employeeType === "Intern" && docxHeading === "OFFER LETTER") {
        docxHeading = "INTERNSHIP OFFER LETTER";
      }

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: docxHeading,
              bold: true,
              size: 30,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 240 },
        })
      );

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "To,",
              size: 24,
            }),
          ],
          spacing: { before: 180, after: 60 },
        })
      );

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: (formData.name || "[Employee Name]") + ",",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 0, after: 240 },
        })
      );

      paragraphsData.forEach((paragraph) => {
        const runs = [];
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
        parts.forEach((part) => {
          if (!part) return;
          const isBold = part.startsWith("**") && part.endsWith("**");
          const textContent = isBold ? part.slice(2, -2) : part;
          runs.push(
            new TextRun({
              text: textContent,
              bold: isBold,
              size: 24,
            })
          );
        });

        sectionChildren.push(
          new Paragraph({
            children: runs,
            alignment: AlignmentType.JUSTIFY,
            spacing: { before: 0, after: 200, line: 276 },
          })
        );
      });

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Yours Faithfully,",
              size: 24,
            }),
          ],
          spacing: { before: 240, after: 60 },
        })
      );

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "For Qiro Tech Innovation Pvt. Ltd.",
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 0, after: 120 },
        })
      );

      const stampData = base64ToUint8Array(stampBase64?.data);
      const finalSign = customSignBase64 || signBase64;
      const signData = base64ToUint8Array(finalSign?.data);

      const signoffCells = [];
      if (stampData) {
        signoffCells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: stampData,
                    transformation: {
                      width: 151,
                      height: 132,
                    },
                    type: "png",
                  }),
                ],
              }),
            ],
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            width: { size: 2500, type: WidthType.DXA },
          })
        );
      } else {
        signoffCells.push(
          new TableCell({
            children: [new Paragraph("")],
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            width: { size: 2500, type: WidthType.DXA },
          })
        );
      }

      if (signData) {
        let renderWidth = 128;
        let renderHeight = 90;
        if (finalSign.width && finalSign.height) {
          const ratio = Math.min(128 / finalSign.width, 90 / finalSign.height);
          renderWidth = Math.round(finalSign.width * ratio);
          renderHeight = Math.round(finalSign.height * ratio);
        }

        signoffCells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: signData,
                    transformation: {
                      width: renderWidth,
                      height: renderHeight,
                    },
                    type: "png",
                  }),
                ],
              }),
            ],
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            width: { size: 2500, type: WidthType.DXA },
          })
        );
      } else {
        signoffCells.push(
          new TableCell({
            children: [new Paragraph("")],
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            width: { size: 2500, type: WidthType.DXA },
          })
        );
      }

      signoffCells.push(
        new TableCell({
          children: [new Paragraph("")],
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          width: { size: 4592, type: WidthType.DXA },
        })
      );

      const signoffTable = new Table({
        rows: [
          new TableRow({
            children: signoffCells,
          }),
        ],
        borders: TableBorders.NONE,
        width: { size: 9592, type: WidthType.DXA },
      });

      sectionChildren.push(signoffTable);

      const hrName = formData.hrFullName || "Prashant Kulkarni";
      const hrDesignation = formData.hrDesignation || "People Operations Officer";

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: hrName,
              bold: true,
              size: 24,
            }),
          ],
          spacing: { before: 200, after: 40 },
        })
      );

      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: hrDesignation,
              size: 24,
            }),
          ],
        })
      );

      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Arial",
                size: 24,
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                size: {
                  width: 11906,
                  height: 16838,
                },
                margin: {
                  top: 1152,
                  bottom: 1152,
                  left: 1152,
                  right: 1152,
                },
              },
            },
            footers: {
              default: new Footer({
                children: [
                  new Paragraph({
                    border: {
                      top: {
                        color: "969696",
                        space: 4,
                        style: BorderStyle.SINGLE,
                        size: 6,
                      },
                    },
                    spacing: { before: 100, after: 50 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "www.qirotec.com",
                        size: 18,
                      }),
                    ],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            },
            children: sectionChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedCategory.replace(/ /g, "_")}_${(formData.name || "Letter").replace(/ /g, "_")}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Word document generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate Word document");
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await fetchJson(`${prefix}/users`);
      setUsers(data || []);
    } catch {
      toast.error("Failed to fetch users");
    }
  };

  const openEmailModal = () => {
    if (!pdfBlob) {
      toast.warn("Please generate the report first.");
      return;
    }
    fetchUsers();
    setShowEmailModal(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!selectedUserEmail || !emailSubject || !pdfBlob) {
      toast.error("Please fill all required fields and generate PDF.");
      return;
    }

    setSendingEmail(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", selectedUserEmail);
      formDataToSend.append("subject", emailSubject);
      formDataToSend.append("body", emailBody || `Dear Employee,\n\nPlease find attached your ${selectedCategory}.\n\nRegards,\nHR Department`);
      formDataToSend.append("file", pdfBlob, `${selectedCategory.replace(/ /g, "_")}.pdf`);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}${prefix}/send-letter`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });

      if (!res.ok) {
        throw new Error("Failed to send email");
      }

      toast.success("Email sent successfully!");
      setShowEmailModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const currentCategories = employeeType === "Full-Time" ? FULL_TIME_CATEGORIES : INTERN_CATEGORIES;
  const currentPositions = employeeType === "Full-Time" ? FULL_TIME_POSITIONS : INTERN_POSITIONS;

  return (
    <section className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-gray-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[100px] -z-10" />

        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-[#1A9DC2]">
            <FileText size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tight">Generate Letter</h2>
            <p className="text-secondary font-medium mt-1">Create official letters dynamically</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary uppercase tracking-wider">Employee Type</label>
                <select
                  value={employeeType}
                  onChange={(e) => setEmployeeType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium transition-all shadow-sm"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary uppercase tracking-wider">Choose Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium transition-all shadow-sm"
                >
                  {currentCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary uppercase tracking-wider">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium transition-all shadow-sm"
                >
                  {currentPositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-secondary uppercase tracking-wider">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium transition-all shadow-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-primary mb-4">Employee Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">Employee Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Miss. Eram Hamid Satkut"
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">Start Date</label>
                  <input
                    type="text"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    placeholder="e.g. 16th of March 2025"
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">End Date</label>
                  <input
                    type="text"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    placeholder="e.g. 16th of May 2026"
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">Letter Generated Date</label>
                  <input
                    type="text"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                  />
                </div>
                {selectedCategory === "Termination Letter" && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-secondary uppercase tracking-wider">Reason for Termination</label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      placeholder="e.g. consistently poor performance and attendance issues"
                      className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium min-h-[80px]"
                    />
                  </div>
                )}
                {employeeType === "Full-Time" && selectedCategory === "Offer Letter" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary uppercase tracking-wider">CTC (e.g. 3,40,000)</label>
                      <input
                        type="text"
                        name="ctc"
                        value={formData.ctc}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary uppercase tracking-wider">CTC In Words</label>
                      <input
                        type="text"
                        name="ctcInWords"
                        value={formData.ctcInWords}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary uppercase tracking-wider">CTC Short (e.g. 3.4 Lacs)</label>
                      <input
                        type="text"
                        name="ctcShort"
                        value={formData.ctcShort}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary uppercase tracking-wider">Fixed Salary (e.g. 3 Lacs)</label>
                      <input
                        type="text"
                        name="fixedSalary"
                        value={formData.fixedSalary}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary uppercase tracking-wider">Variable Salary (e.g. 40,000)</label>
                      <input
                        type="text"
                        name="variableSalary"
                        value={formData.variableSalary}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-secondary uppercase tracking-wider">Variable Per Quarter</label>
                      <input
                        type="text"
                        name="variablePerQuarter"
                        value={formData.variablePerQuarter}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-bold text-primary mb-4">HR Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">HR Full Name</label>
                  <input
                    type="text"
                    name="hrFullName"
                    value={formData.hrFullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Prashant Kulkarni"
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">HR Designation</label>
                  <input
                    type="text"
                    name="hrDesignation"
                    value={formData.hrDesignation}
                    onChange={handleInputChange}
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">Upload HR Signature</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-2 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-2">
              <button
                onClick={generatePDF}
                className="flex items-center gap-1 px-3 py-2 bg-primary text-white font-bold rounded-xl hover:bg-secondary transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Eye size={16} /> Generate Letter
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-3 py-2 bg-white text-primary border-2 border-primary font-bold rounded-xl hover:bg-gray-50 transition-all shadow-md hover:-translate-y-0.5"
              >
                <Download size={16} /> Download PDF
              </button>

              <button
                onClick={handleDownloadWord}
                className="flex items-center gap-1 px-3 py-2 bg-white text-blue-600 border-2 border-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-md hover:-translate-y-0.5"
              >
                <Download size={16} /> Download Word
              </button>

              <button
                onClick={openEmailModal}
                className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Send size={16} /> Send Letter
              </button>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-2 min-h-[500px] max-h-[720px] overflow-y-auto flex items-start justify-start">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-[700px] rounded-xl shadow-inner"
                title="PDF Preview"
              />
            ) : (
              <div className="text-center text-gray-500">
                <FileText size={64} className="mx-auto mb-4 opacity-50" />
                <p className="font-medium">Loading preview...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowEmailModal(false)}
            />
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 m-4"
            >
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute top-6 right-6 p-2 text-gray-500 hover:text-gray-500 hover:bg-gray-50 rounded-full transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                  <Mail size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-primary">Send Email</h3>
                  <p className="text-sm text-secondary font-medium mt-0.5">Send {selectedCategory} to employee</p>
                </div>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">Select Recipient</label>
                  <select
                    value={selectedUserEmail}
                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {users.map(u => (
                      <option key={u._id} value={u.email}>
                        {u.name} ({u.role}) - {u.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-secondary uppercase tracking-wider">Body (Optional)</label>
                  <textarea
                    rows="3"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-primary text-sm rounded-xl focus:ring-4 focus:ring-primary/10 block p-3 font-medium resize-none"
                    placeholder="Type custom message..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {sendingEmail ? (
                    <span className="w-5 h-5 border-2 border-gray-200/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send size={18} /> Send Now</>
                  )}
                </button>
              </form>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default HRGenerateLetterPage;
