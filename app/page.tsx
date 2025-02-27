import Sidebar from "@/components/Sidebar";
import {navigationLinks} from "@/utils/NavigationLinks"

export default function Team() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Sidebar links={navigationLinks} />
    </main>
  );
}
 