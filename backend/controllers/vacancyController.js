import Vacancy from "../models/Vacancy.js";

// @desc    Create a new vacancy
// @route   POST /api/vacancies
// @access  Private (Admin/Leader)
export const createVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.create({
      ...req.body,
      createdBy: req.user._id,
    });
    res.status(201).json(vacancy);
  } catch (error) {
    console.error("Error creating vacancy:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all vacancies (can filter by status etc)
// @route   GET /api/vacancies
// @access  Private
export const getVacancies = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.priorityLevel) {
      filter.priorityLevel = req.query.priorityLevel;
    }

    const vacancies = await Vacancy.find(filter).populate("createdBy", "name role").sort({ createdAt: -1 });
    res.json(vacancies);
  } catch (error) {
    console.error("Error fetching vacancies:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update a vacancy
// @route   PUT /api/vacancies/:id
// @access  Private (Admin/Leader)
export const updateVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vacancy) return res.status(404).json({ message: "Vacancy not found" });
    res.json(vacancy);
  } catch (error) {
    console.error("Error updating vacancy:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete a vacancy
// @route   DELETE /api/vacancies/:id
// @access  Private (Admin/Leader)
export const deleteVacancy = async (req, res) => {
  try {
    const vacancy = await Vacancy.findByIdAndDelete(req.params.id);
    if (!vacancy) return res.status(404).json({ message: "Vacancy not found" });
    res.json({ message: "Vacancy deleted" });
  } catch (error) {
    console.error("Error deleting vacancy:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
