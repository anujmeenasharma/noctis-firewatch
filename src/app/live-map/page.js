import LiveMap from "@/components/LiveMap";

export const metadata = {
  title: "Live fire map of India — NOCTIS CENTAURI",
  description: "Every fire NASA satellites spotted over India in the last 24 hours, 3 days or 7 days, by state.",
};

export default function Page() {
  return <LiveMap />;
}
