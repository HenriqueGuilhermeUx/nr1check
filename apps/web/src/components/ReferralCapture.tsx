import { useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { trpc } from "../lib/trpc";

const REF_KEY = "nr1check_partner_ref";
const VISITOR_KEY = "nr1check_partner_visitor";

function getVisitorId() {
  let id = window.localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `nr1-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export default function ReferralCapture() {
  const { isSignedIn } = useUser();
  const track = trpc.partner.track.useMutation();
  const claim = trpc.partner.claim.useMutation();

  const code = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get("ref")?.trim().toUpperCase() || "";
    const existing = window.localStorage.getItem(REF_KEY) || "";

    if (incoming && !existing) {
      window.localStorage.setItem(REF_KEY, incoming);
      return incoming;
    }

    return existing || incoming;
  }, []);

  useEffect(() => {
    if (!code) return;
    const visitorId = getVisitorId();
    track.mutate({
      code,
      visitorId,
      referrer: document.referrer || null,
    });
  // fire once per page load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (!code || !isSignedIn) return;
    claim.mutate({ code });
  // first attribution is immutable on the server
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isSignedIn]);

  return null;
}
