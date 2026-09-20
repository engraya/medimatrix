"use client";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useState } from "react";
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export function FileUploader({ files, onChange, disabled = false }: {
  files?: File[]; onChange: (files: File[]) => void; disabled?: boolean;
}) {
  const [error, setError] = useState("");
  const { getRootProps, getInputProps } = useDropzone({
    multiple: false, maxFiles: 1, maxSize: MAX_DOCUMENT_BYTES, disabled,
    accept: { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
    onDropAccepted: accepted => { setError(""); onChange(accepted); },
    onDropRejected: () => setError("Choose one PDF, PNG, or JPEG file up to 5 MB."),
  });
  return <div className="space-y-2">
    <div {...getRootProps({ role: "button", "aria-label": "Choose a document" })} className="file-upload">
      <input {...getInputProps()} />
      <Image src="/assets/icons/upload.svg" width={40} height={40} alt="" />
      <div className="file-upload_label"><p>{files?.[0]?.name ?? "Click to upload or drag and drop"}</p><p className="text-12-regular">PDF, PNG, or JPEG, up to 5 MB</p></div>
    </div>
    {error && <p role="alert" className="shad-error">{error}</p>}
  </div>;
}
