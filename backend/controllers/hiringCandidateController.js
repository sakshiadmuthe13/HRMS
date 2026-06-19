import HiringCandidate from "../models/HiringCandidate.js";
import Vacancy from "../models/Vacancy.js";
import { sendMail } from "../utils/sendMail.js";

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
