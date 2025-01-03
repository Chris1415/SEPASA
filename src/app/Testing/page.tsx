import styles from "./page.module.css";
import PersonalizationTester from "@/components/sitecore/personalizationTester";
import { Suspense } from "react";

export default async function Testing() {
  return (
    <div>
      <div className={styles.main}>
        <div className="mt-8">
          <h2 className="font-bold text-2xl"> Testing Form </h2>
          <div>
            <p className="mb-8">
              Start testing your embedded personalization rules from ©Sitecore
              XM Cloud. Just follow the steps below to setup everything and
              examine the output. Once you choose a setting, the output below
              automatically reflects that change immediatly. Below the input
              fields you get a nice overview of the current input parameter set
              you have chosen. The first real output starts with all the
              available variants given on the current page in the current
              language as well the chosen variant in case personalization is
              applied. In case you need to examine the whole layout response
              output you get thant once expandable as well. For a better
              overview of all the individual personalizations, which are
              available on the page on a component level you get this overview
              per rendering / component. In the end you see a transformation
              overview if and if yes what kind of transformation of content
              happens. Possible transformations are switch of Datasource, switch
              of Rendering with a compatible one or hide component.
            </p>
            <p className="pb-2">Start your testing by following this little guide</p>
            <ol className="list-decimal">
              <li>
                Choose a <b>Site</b>
              </li>
              <li>
                Choose a <b>Language</b>
              </li>
              <li>
                Choose a <b>Route</b>
              </li>
              <p className="underline mb-2">Optionally:</p>
              <li>Simulate a Country where you are coming from</li>
              <li>
                Simulate a customer journey through your website by adding
                routes to the embedded CDP (including resetting the journey and
                start as new visitor)
              </li>
              <li>Add supported UTM Parameters</li>
            </ol>
          </div>
        </div>
        <hr />
        <Suspense>
          <PersonalizationTester />
        </Suspense>
      </div>
    </div>
  );
}
