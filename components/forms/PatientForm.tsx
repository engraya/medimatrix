"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Form } from "@/components/ui/form";
import { api } from "@/lib/api/client";
import { errorMessage, resourceId } from "@/lib/api/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserFormValidation } from "@/lib/validation";

import "react-phone-number-input/style.css";
import CustomFormField, { FormFieldType } from "../CustomFormField";
import SubmitButton from "../SubmitButton";

export const PatientForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const form = useForm<z.infer<typeof UserFormValidation>>({
    resolver: zodResolver(UserFormValidation),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof UserFormValidation>) => {
    setIsLoading(true);
    setError("");

    try {
      const user = {
        name: values.name,
        email: values.email,
        phone: values.phone,
      };

      if (userId) {
        await api("/auth/patient/verify", { method: "POST", body: JSON.stringify({ userId, code }) });
        router.push(`/patients/${resourceId(userId)}/register`);
        router.refresh();
      } else {
        const result = await api<{ userId: string }>("/auth/patient/start", { method: "POST", body: JSON.stringify(user) });
        resourceId(result.userId);
        setUserId(result.userId);
      }
    } catch (error) {
      setError(errorMessage(error));
    }

    setIsLoading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 space-y-6">
        <section className="mb-8 space-y-4 text-center">
        <h1 className="text-2xl font-extrabold text-center leading-none tracking-normal text-gray-900 md:text-5xl md:tracking-tight">
              <span className="block w-full underline text-transparent text-center bg-clip-text bg-gradient-to-r from-green-400 to-purple-500 lg:inline">
                MediMatrix
              </span>
            </h1>
          <h4 className="header text-transparent text-center bg-clip-text bg-gradient-to-r from-green-400 to-purple-300 lg:inline">Your Partner in Patient Care</h4>
          <p className="text-dark-700 text-center">Manage records, appointments, and more—all in one place</p>
        </section>

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="name"
          disabled={!!userId || isLoading}
          label="Full Name"
          placeholder="Muhammad Tawfiq"
          iconSrc="/assets/icons/user.svg"
          iconAlt="user"
        />

        <CustomFormField
          fieldType={FormFieldType.INPUT}
          control={form.control}
          name="email"
          disabled={!!userId || isLoading}
          label="Email Address"
          placeholder="mtawfiq00@gmail.com"
          iconSrc="/assets/icons/email.svg"
          iconAlt="email"
        />

        <CustomFormField
          fieldType={FormFieldType.PHONE_INPUT}
          control={form.control}
          name="phone"
          disabled={!!userId || isLoading}
          label="Phone Number"
          placeholder="(+234) 8098-569-1234"
        />

        {userId && <div className="space-y-2">
          <Label htmlFor="patient-code">Verification code</Label>
          <p className="text-sm">Enter the code sent to you to continue.</p>
          <Input id="patient-code" value={code} onChange={event => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
          <button type="button" disabled={isLoading} onClick={() => { setUserId(""); setCode(""); }} className="text-sm underline">Change details or request another code</button>
        </div>}
        {error && <p role="alert" className="shad-error">{error}</p>}
        <SubmitButton isLoading={isLoading}>{userId ? "Verify and continue" : "Get Started"}</SubmitButton>
      </form>
    </Form>
  );
};
