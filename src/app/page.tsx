import styles from "./page.module.css";
import PersonalizationTester from "@/components/sitecore/personalizationTester";
import { Suspense } from "react";

export default async function Home() {
  return (
    <div className="m-12">
      <div className={styles.main}>
        <h1 className="text-3xl font-bold text-center pt-8">
          (S)itecore (E)mbedded (P)ersonalization (T)esting
          (A)pplication <span>(SEPTA)</span>
        </h1>
        <Suspense>
          <PersonalizationTester />
        </Suspense>
      </div>
      <div className={styles.footer}></div>
    </div>
  );
}
