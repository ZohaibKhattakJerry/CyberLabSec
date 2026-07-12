import { Metadata } from "next";
import StatusClient from "./StatusClient";

export const metadata: Metadata = {
  title: "Application Status - CyberLabSec",
  description: "Check the live status of your job application at CyberLabSec.",
};

export default function StatusPage() {
  return <StatusClient />;
}
