import styles from "./page.module.css";
import PersonalizationTester from "@/components/sitecore/personalizationSimulator";
import { Suspense } from "react";

export default async function Personalize() {
  return (
    <div>
      <div className={styles.main}>
        <div className="mt-8">
          <h2 className="font-bold text-2xl"> Personalization and A/B/n Testing Simulator </h2>
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
            <div className="grid grid-cols-2">
              <div>
                <p className="underline mb-2">
                  Mandatory (<i>Routing Input</i>):
                </p>
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
                </ol>
              </div>
              <div>
                <p className="underline mb-2">
                  Optionally (<i>Simulation Input</i>):
                </p>
                <ol className="list-decimal">
                  <li>Simulate a Country where you are coming from</li>
                  <li>
                    Simulate a customer journey through your website by adding
                    routes to the embedded CDP (including resetting the journey
                    and start as new visitor)
                  </li>
                  <li>Add supported UTM Parameters</li>
                  <li>Add an referrer where the simulated visit comes from</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        <hr />
        <Suspense
          fallback={
            <div className="h-[500px]">
              <svg
                className="animate-spin h-5 w-5 mr-3 ..."
                viewBox="0 0 24 24"
              ></svg>
              Loading...
            </div>
          }
        >
          <PersonalizationTester />
        </Suspense>
      </div>
    </div>
  );
}
