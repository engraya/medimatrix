"use client";
import { FormEvent, useState, use } from "react";
import Link from "next/link";
import { FileUploader } from "@/components/FileUploader";
import SubmitButton from "@/components/SubmitButton";
import { Button } from "@/components/ui/button";
import { filesApi } from "@/lib/api/resources";
import { errorMessage, resourceId } from "@/lib/api/shared";

export default function Documents({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [files, setFiles] = useState<File[]>([]);
  const [fileId, setFileId] = useState("");
  const [download, setDownload] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!files[0] || busy) return;
    setBusy(true); setError(""); setDownload(""); setFileId("");
    try {
      const result = await filesApi.upload(files[0]);
      resourceId(result.id);
      setFileId(result.id); setFiles([]);
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function issueDownload() {
    setBusy(true); setError(""); setDownload("");
    try {
      const result = await filesApi.url(fileId);
      const url = new URL(result.url, window.location.origin);
      const path = `/files/${resourceId(fileId)}/download`;
      const token = url.searchParams.get("token");
      if (!url.pathname.endsWith(path) || !token) throw new Error("Invalid download response");
      setDownload(`/api/backend${path}?${new URLSearchParams({ token })}`);
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  return <main className="container max-w-lg py-12 space-y-6">
    <h1 className="header">Documents</h1>
    <form onSubmit={upload} className="space-y-6">
      <FileUploader files={files} onChange={setFiles} disabled={busy} />
      <SubmitButton isLoading={busy} disabled={!files.length}>Upload document</SubmitButton>
    </form>
    {fileId && <div className="space-y-4"><p role="status">Document uploaded.</p><Button disabled={busy} onClick={issueDownload}>Create download link</Button></div>}
    {download && <a className="block underline" href={download} download>Download document (temporary link)</a>}
    {error && <p role="alert" className="shad-error">{error}</p>}
    <Link className="block underline" href={`/patients/${resourceId(userId)}/register`}>Back to appointments</Link>
  </main>;
}
