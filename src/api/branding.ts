import { Organization } from "@/types/organization";
import { request } from "./request";

export async function getBranding(): Promise<Organization> {
  return request<Organization>("/branding");
}

export async function updateBranding(
  branding: Organization,
): Promise<Organization> {
  return request<Organization>("/branding", {
    method: "PUT",
    body: JSON.stringify(branding),
  });
}
