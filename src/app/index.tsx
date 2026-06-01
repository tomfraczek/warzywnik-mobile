import { AuthFlowLoader } from "@/src/components/AuthFlowLoader";
import { pl, registerTranslation } from "react-native-paper-dates";
registerTranslation("pl", pl);

export default function Index() {
  return <AuthFlowLoader />;
}
