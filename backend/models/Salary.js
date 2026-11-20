// models/Salary.js
import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  baseSalary: { type: Number, required: true },
  bonus: { type: Number, default: 0 },
  totalCredited: { type: Number },
  presentDays: { type: Number },
  absentDays: { type: Number },
  dailyRate: { type: Number },
  daysInMonth: { type: Number },
  month: { type: String }, // e.g., "October"
  year: { type: Number }, // e.g., 2025
  creditedOn: { type: Date },
  paymentDate: { type: Date },
  isCredited: { type: Boolean, default: false },
});

const Salary = mongoose.model("Salary", salarySchema);

export default Salary;
