import type { Organization } from "../types/organization";
import * as brandingApi from "../api/branding";
import { queryKeys } from "../api/queryKeys";
import {
  useDomainMutation,
  useDomainQuery,
  useQuerySetter,
} from "./queryHelpers";

const EMPTY: Organization = {
  orgName: "",
  appTitle: "Timeregnskab",
  contactEmail: "",
  logo: "",
  primary: "#12394A",
  accent: "#C25A4C",
  background: "#ECEEEA",
};

export function useBrandingQuery() {
  return useDomainQuery({
    queryKey: queryKeys.branding,
    queryFn: brandingApi.getBranding,
    empty: EMPTY,
  });
}

export function useBrandingSetter() {
  return useQuerySetter<Organization>(queryKeys.branding, EMPTY);
}

export function useSaveBranding(successMessage?: string) {
  return useDomainMutation({
    mutationFn: brandingApi.updateBranding,
    invalidateKeys: [queryKeys.branding],
    successMessage,
  });
}
