"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { PatientFormDefaultValues, GenderOptions } from "@/constants";
import { PatientFormValidation } from "@/lib/validation";
import { api } from "@/lib/api/client";
import { errorMessage, resourceId } from "@/lib/api/shared";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";
import { useDoctors } from "../DoctorsProvider";
import "react-datepicker/dist/react-datepicker.css";
import "react-phone-number-input/style.css";

export default function RegisterForm({ user }: { user: User }) {
  const router = useRouter();
  const doctors = useDoctors();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof PatientFormValidation>>({
    resolver: zodResolver(PatientFormValidation), defaultValues: PatientFormDefaultValues,
  });
  async function submit(values: z.infer<typeof PatientFormValidation>) {
    setBusy(true); setError("");
    try {
      const date = values.birthDate;
      // A date of birth is a calendar date, not a UTC timestamp.
      const birthDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      await api("/patients", { method: "POST", body: JSON.stringify({ ...values, primaryDoctorId: values.primaryDoctorId || undefined, birthDate, gender: values.gender.toUpperCase() }) });
      router.push(`/patients/${resourceId(user.id)}/new-appointment`);
      router.refresh();
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  const field = (name: keyof z.infer<typeof PatientFormValidation>, label: string, type = FormFieldType.INPUT) =>
    <CustomFormField key={name} control={form.control} name={name} label={label} fieldType={type} />;
  return <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="flex-1 space-y-12">
    <section className="space-y-4 text-center">
      <h1 className="text-2xl font-extrabold leading-none md:text-5xl"><span className="underline text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-purple-500">Welcome</span></h1>
      <h4 className="header mt-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-purple-300">Let us know more about yourself.</h4>
    </section>
    <section className="space-y-6">
      <h2 className="sub-header text-gray-100">Personal Information</h2>
      <p>{user.name} · {user.email}</p>
      <div className="flex flex-col gap-6 xl:flex-row">
        {field("birthDate", "Date of birth", FormFieldType.DATE_PICKER)}
        <CustomFormField control={form.control} fieldType={FormFieldType.SELECT} name="gender" label="Gender">
          {GenderOptions.map(gender => <SelectItem key={gender} value={gender}>{gender}</SelectItem>)}
        </CustomFormField>
      </div>
      <div className="flex flex-col gap-6 xl:flex-row">{field("address", "Address")}{field("occupation", "Profession")}</div>
      <div className="flex flex-col gap-6 xl:flex-row">{field("emergencyContactName", "Emergency contact name")}{field("emergencyContactNumber", "Emergency contact number", FormFieldType.PHONE_INPUT)}</div>
    </section>
    <section className="space-y-6">
      <h2 className="sub-header text-gray-100">Medical Information</h2>
      <CustomFormField control={form.control} fieldType={FormFieldType.SELECT} name="primaryDoctorId" label="Primary care physician (optional)" placeholder="Select a doctor">
        {doctors.map(doctor => <SelectItem key={doctor.id} value={doctor.id}>{doctor.name}</SelectItem>)}
      </CustomFormField>
      <div className="flex flex-col gap-6 xl:flex-row">{field("insuranceProvider", "Insurance provider")}{field("insurancePolicyNumber", "Insurance policy number")}</div>
      <div className="flex flex-col gap-6 xl:flex-row">{field("allergies", "Allergies (optional)", FormFieldType.TEXTAREA)}{field("currentMedication", "Current medications (optional)", FormFieldType.TEXTAREA)}</div>
      <div className="flex flex-col gap-6 xl:flex-row">{field("familyMedicalHistory", "Family medical history (optional)", FormFieldType.TEXTAREA)}{field("pastMedicalHistory", "Past medical history (optional)", FormFieldType.TEXTAREA)}</div>
    </section>
    <section className="space-y-6">
      <h2 className="sub-header text-gray-100">Consent and Privacy</h2>
      {field("treatmentConsent", "I consent to receive treatment for my health condition.", FormFieldType.CHECKBOX)}
      {field("disclosureConsent", "I consent to the use and disclosure of my health information for treatment purposes.", FormFieldType.CHECKBOX)}
      {field("privacyConsent", "I consent to the processing of my information for patient care.", FormFieldType.CHECKBOX)}
    </section>
    {error && <p role="alert" className="shad-error">{error}</p>}
    <SubmitButton isLoading={busy}>Submit and Continue</SubmitButton>
  </form></Form>;
}
