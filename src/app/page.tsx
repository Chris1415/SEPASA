import styles from "./page.module.css";
import PersonalizationTester from "@/components/sitecore/personalizationTester";
import { Suspense } from "react";

export default async function Home() {
  return (
    <div>
      <div className={styles.main}>
        <Suspense>
          <PersonalizationTester />
        </Suspense>
      </div>
    </div>
  );
}
