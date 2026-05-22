// models/User.js
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  path: { type: String }, // ImageKit URL or file path
  verified: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  position: { type: String },
  salary: { type: Number },
  role: { type: String, enum: ["admin", "hr", "leader", "employee"], default: "employee" },
  dateOfJoining: { type: Date, default: Date.now },
  dateOfBirth: { type: Date },
  reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  technicalReporting: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  administrativeReporting: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  // Leave management
  leaveAllowance: { type: Number, default: 12 }, // Yearly paid leave allowance (admin can modify)
  // Marital info for celebrations
  isMarried: { type: Boolean, default: false },
  marriageAnniversary: { type: Date },
  // Document uploads
  documents: {
    passportPhoto: documentSchema,
    tenthMarksheet: documentSchema,
    twelthDiplomaMarksheet: documentSchema,
    graduationMarksheet: documentSchema,
    bankPassbookPhoto: documentSchema,
    bankIFSC: { type: String },
    bankAccountNumber: { type: String },
    aadharFront: documentSchema,
    aadharBack: documentSchema,
    panCard: documentSchema,
    cv: documentSchema,
  },
  profileVerified: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

export default User;
