export const GenderOptions = ["Male", "Female", "Other"];
export const PatientFormDefaultValues = {
  gender: "Other" as Gender,
  address: "", occupation: "", emergencyContactName: "", emergencyContactNumber: "",
  insuranceProvider: "", insurancePolicyNumber: "",
  primaryDoctorId: "", allergies: "", currentMedication: "", familyMedicalHistory: "", pastMedicalHistory: "",
  treatmentConsent: false, disclosureConsent: false, privacyConsent: false,
};
export const StatusIcon = {
  scheduled: "/assets/icons/check.svg",
  pending: "/assets/icons/pending.svg",
  cancelled: "/assets/icons/cancelled.svg",
};
