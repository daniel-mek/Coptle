import { Statistics } from "../../components/statistics";
import { reviewedPlayEnabled } from "../../lib/config";

export const dynamic = "force-dynamic";

export default function StatsPage() {
  return <Statistics reviewed={reviewedPlayEnabled()} />;
}
