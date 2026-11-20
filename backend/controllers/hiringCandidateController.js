import HiringCandidate from "../models/HiringCandidate.js";
import Vacancy from "../models/Vacancy.js";
import { sendMail } from "../utils/sendMail.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// @desc    Add a new candidate
// @route   POST /api/hr/hiring/candidates
// @access  Private/HR
export const addCandidate = async (req, res) => {
  try {
    const { name, phone, email, source, role, notes, vacancy } = req.body;
    let resumeUrl = req.imageUrl || "#";

    const candidate = await HiringCandidate.create({
      name,
      phone,
      email,
      source,
      role,
      vacancy: vacancy || null,
      resumeUrl,
      notes: notes || "",
      logs: [{ text: "Candidate Added by HR" }],
    });

    res.status(201).json(candidate);
  } catch (error) {
    console.error("Error adding candidate:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all candidates
// @route   GET /api/hr/hiring/candidates
// @access  Private/HR
export const getCandidates = async (req, res) => {
  try {
    const candidates = await HiringCandidate.find().sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update candidate generic fields and logs
// @route   PUT /api/hr/hiring/candidates/:id
// @access  Private/HR
export const updateCandidate = async (req, res) => {
  try {
    const { updates, logMsg } = req.body;

    const candidate = await HiringCandidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // Check if onboarding completed
    const wasNotFinal = candidate.finalMailSent !== "Yes";
    
    // Update fields
    Object.assign(candidate, updates);

    // If just marked as finalMailSent Yes, increment vacancy hiredEmployeesCount
    if (wasNotFinal && candidate.finalMailSent === "Yes" && candidate.vacancy) {
      const vacancy = await Vacancy.findById(candidate.vacancy);
      if (vacancy) {
        vacancy.hiredEmployeesCount += 1;
        if (vacancy.hiredEmployeesCount >= vacancy.numberOfEmployeesRequired) {
          vacancy.status = "Closed";
        }
        await vacancy.save();
      }
    }

    // Add log
    if (logMsg) {
      candidate.logs.push({ text: logMsg });
    }

    await candidate.save();
    res.json(candidate);
  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Send email to candidate and update status
// @route   POST /api/hr/hiring/candidates/:id/email
// @access  Private/HR
export const sendCandidateEmail = async (req, res) => {
  try {
    const { subject, body, updates, logMsg } = req.body;
    const candidateId = req.params.id;

    const candidate = await HiringCandidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    // Prepare attachments if files were uploaded
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          content: file.buffer,
        });
      }
    }

    // Send the email
    await sendMail(candidate.email, subject, "Please view this email in HTML", body, attachments);

    // Update candidate state
    const wasNotFinal = candidate.finalMailSent !== "Yes";

    if (updates && Object.keys(updates).length > 0) {
      // JSON parse because frontend might send as stringified JSON if using FormData
      let parsedUpdates = typeof updates === "string" ? JSON.parse(updates) : updates;
      Object.assign(candidate, parsedUpdates);
    }

    if (wasNotFinal && candidate.finalMailSent === "Yes" && candidate.vacancy) {
      const vacancy = await Vacancy.findById(candidate.vacancy);
      if (vacancy) {
        vacancy.hiredEmployeesCount += 1;
        if (vacancy.hiredEmployeesCount >= vacancy.numberOfEmployeesRequired) {
          vacancy.status = "Closed";
        }
        await vacancy.save();
      }
    }

    if (logMsg) {
      candidate.logs.push({ text: logMsg });
    }

    await candidate.save();

    res.json({ message: "Email sent and candidate updated successfully", candidate });
  } catch (error) {
    console.error("Error sending candidate email:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Parse uploaded Resume PDF to auto-populate candidate form
// @route   POST /api/hr/hiring/parse-resume
// @access  Private/HR
export const parseResume = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    if (!file || !file.buffer) {
      return res.status(400).json({ message: "No resume PDF uploaded or file buffer empty" });
    }

    const pdfData = await pdfParse(file.buffer);
    const text = pdfData.text || "";

    // 1. Email extraction
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
    const email = emailMatch ? emailMatch[0].trim() : "";

    // 2. Phone extraction (Indian 10-digit format)
    const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6-9]\d{9}/) || text.match(/\b\d{10}\b/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "").slice(-10) : "";

    // 3. Name extraction (top lines cleanup)
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let name = "";
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      const line = lines[i];
      if (
        !line.toLowerCase().includes("resume") &&
        !line.toLowerCase().includes("curriculum") &&
        !line.toLowerCase().includes("vitae") &&
        !line.toLowerCase().includes("@") &&
        !line.toLowerCase().includes("phone") &&
        !line.toLowerCase().includes("email") &&
        !line.toLowerCase().includes("page") &&
        !line.match(/\d{5}/) &&
        line.length > 2 &&
        line.length < 40
      ) {
        name = line.replace(/[^a-zA-Z\s]/g, "").trim();
        if (name && name.split(" ").length <= 4) break;
      }
    }

    // 4. Skills extraction
    const knownSkills = [
      "React", "React.js", "Node.js", "Node", "JavaScript", "TypeScript", "Express", "MongoDB", "SQL",
      "Python", "Java", "C++", "C#", "HTML", "CSS", "Tailwind", "Bootstrap", "Flutter", "Android",
      "iOS", "UI/UX", "Figma", "Photoshop", "Git", "Docker", "AWS", "HR", "Recruitment", "Accounting",
      "Excel", "Tally", "Communication", "Management"
    ];
    const detectedSkills = knownSkills.filter(skill =>
      new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, "i").test(text)
    );

    // 5. Experience extraction
    let experience = "";
    const expMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years?|yrs?)\b/i);
    if (expMatch) {
      experience = `${expMatch[1]} Years`;
    }

    res.json({
      name,
      email,
      phone,
      skills: detectedSkills,
      experience,
      notes: detectedSkills.length > 0 ? `Skills: ${detectedSkills.join(", ")}${experience ? ` | Experience: ${experience}` : ""}` : "",
      textSnippet: text.slice(0, 300)
    });
  } catch (error) {
    console.error("Error parsing resume:", error);
    res.status(500).json({ message: "Failed to parse resume", error: error.message });
  }
};
