"use client";
import { CloudSDK } from "@sitecore-cloudsdk/core/browser";
import "@sitecore-cloudsdk/personalize/browser";
import "@sitecore-cloudsdk/events/browser";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ComponentRenderingWithExperiences,
  ExperienceParams,
  LayoutServiceData,
  Route,
  SiteInfo,
} from "@/types/sitecore";
import {
  executePersonalize,
  GetFlowDefinition,
  GetPersonalizationInfo,
  getPersonalizeExecutions,
} from "@/services/GraphQlPersonalizeService";
import {
  fetchLayoutData,
  fetchSiteInfos,
  fetchSiteRoutes,
} from "@/services/GraphQlXmcService";
import { COUNTIRES, LANGUAGES } from "@/consts/sitecore";
import {
  PersonalizationComparison,
  personalizeLayout,
} from "@/services/PersonalizationService";
import { pageView } from "@sitecore-cloudsdk/events/browser";
import { getGuestId } from "@sitecore-cloudsdk/core/browser";
import { deleteCookie, getCookie } from "cookies-next";
import SelectMenu, { SelectMenuItem } from "../ui/SelectMenu";
import CheckboxList, { CheckboxItem } from "../ui/CheckboxList";
import { ComponentOutput } from "../ui/ComponentOutput";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { PersonalizationComparisonExplainer } from "@/lib/Helper/PersonalizationComparisonExplainer";

export default function PersonalizationTester() {
  const query = useSearchParams();
  const [allVariants, setAllVariants] = useState<string[] | null>();
  const [chosenVariant, setChosenVariant] = useState<string[] | null>();
  const [layoutData, setLayoutData] = useState<LayoutServiceData>();
  const [personalizedComponents, setPersonalizedComponents] =
    useState<PersonalizationComparison[]>();
  const [siteName, setSiteName] = useState<string>("");
  const [allSites, setAllSites] = useState<SiteInfo[]>();
  const [allRoutes, setAllRoutes] = useState<Route[]>();
  const [path, setPath] = useState<string>("/");
  const [language, setLanguage] = useState<string>("en");
  const [country, setCountry] = useState<string>("");
  const [pathForEvent, setPathForEvent] = useState<string>("");
  const [guesId, setGuesId] = useState<string>();
  const [utmParams, setUtmParams] = useState<string[]>([]);
  const [readMore, setReadMore] = useState<boolean>(false);
  const [componentsWithExperiences, setComponentsWithExperiences] =
    useState<ComponentRenderingWithExperiences[]>();

  function AddPathToViewEvents() {
    pageView({
      channel: "WEB",
      currency: "USD",
      page: pathForEvent,
      language,
      includeUTMParameters: true,
    });
  }

  async function ResetGuestId() {
    const cookieName = "sc_5Q0eCEiytH8KmmQtcmiRUG";
    deleteCookie(cookieName + "_personalize");
    deleteCookie(cookieName);

    CloudSDK({
      sitecoreEdgeContextId: process.env.NEXT_PUBLIC_CONTEXTID ?? "",
      siteName: siteName,
      enableBrowserCookie: true,
    })
      .addPersonalize({
        enablePersonalizeCookie: true,
        webPersonalization: true,
      })
      .addEvents()
      .initialize();

    setTimeout(async () => {
      const newGuestId = await getCookie(cookieName);
      if (newGuestId) {
        setGuesId(newGuestId);
      }
    }, 1000);
  }

  useEffect(() => {
    async function GetSites() {
      const sites = await fetchSiteInfos();
      setAllSites(sites);
    }

    GetSites();
  }, []);

  useEffect(() => {
    async function GetRoutes() {
      const routes = await fetchSiteRoutes(siteName);
      setAllRoutes(routes);
    }

    GetRoutes();
  }, [siteName]);

  useEffect(() => {
    const utm = {
      campaign: utmParams.includes("utm_campaign") || undefined,
      content: utmParams.includes("utm_content") || undefined,
      medium: utmParams.includes("utm_medium") || undefined,
      source: utmParams.includes("utm_source") || undefined,
    };

    // Cloud SDK Initialization
    if (siteName) {
      CloudSDK({
        sitecoreEdgeContextId: process.env.NEXT_PUBLIC_CONTEXTID ?? "",
        siteName: siteName,
        enableBrowserCookie: true,
      })
        .addPersonalize({
          enablePersonalizeCookie: true,
          webPersonalization: true,
        })
        .addEvents()
        .initialize();
      // *****

      async function SetGuesId() {
        setGuesId(await getGuestId());
      }

      SetGuesId();

      console.log(siteName + "|" + path + "|" + language);
      // ASYNC PART ****** //
      async function Personalize() {
        // Grab the informatuion if variants exist and which ones
        const personalizeInfo = await GetPersonalizationInfo(
          siteName,
          path,
          language
        );
        console.log(
          "personalizeInfo: " + JSON.stringify(personalizeInfo, null, 2)
        );

        // Transform the data to a format Personalize understands
        const personalizationExecutions = await getPersonalizeExecutions(
          personalizeInfo,
          language
        );
        console.log(
          "personalizationExecutions: " +
            JSON.stringify(personalizationExecutions, null, 2)
        );

        setAllVariants(personalizationExecutions?.at(0)?.variantIds);

        // Get additional Information about the flow definition (Currently not working)
        const flowDefinition = await GetFlowDefinition(
          personalizationExecutions?.at(0)?.friendlyId
        );
        console.log(
          "flowDefinition: " + JSON.stringify(flowDefinition, null, 2)
        );

        // Identify which variant/audience should be applied as personalization
        const identifiedVariantIds: string[] = [];
        await Promise.all(
          personalizationExecutions.map((execution) =>
            executePersonalize({
              params: { utm: utm, referrer: "" } as ExperienceParams,
              friendlyId: execution.friendlyId,
              variantIds: execution.variantIds,
              language,
              country,
            }).then((personalization) => {
              console.log(
                "executePersonalizeResult: " +
                  JSON.stringify(personalization, null, 2)
              );
              const variantId = personalization.variantId;
              if (variantId) {
                if (!execution.variantIds.includes(variantId)) {
                } else {
                  identifiedVariantIds.push(variantId);
                }
              }
            })
          )
        );

        console.log("identifiedVariantIds: " + identifiedVariantIds);
        if (identifiedVariantIds.length > 0) {
          setChosenVariant(identifiedVariantIds);
        } else {
          setChosenVariant(undefined);
        }

        // Get Standard Layout Response
        const layoutData = await fetchLayoutData(siteName, path, language);
        console.log(JSON.stringify(layoutData, null, 2));
        if (layoutData) {
          setLayoutData(layoutData);
        }

        // if (identifiedVariantIds.length > 0) {
        const personalizedComponents: PersonalizationComparison[] = [];
        const componentsWithExperiences: ComponentRenderingWithExperiences[] =
          [];
        personalizeLayout(
          layoutData,
          identifiedVariantIds?.at(0) ?? "",
          componentsWithExperiences,
          personalizedComponents,
          []
        );
        setComponentsWithExperiences(componentsWithExperiences);

        if (personalizedComponents.length == 0) {
          setPersonalizedComponents(undefined);
        } else {
          setPersonalizedComponents(personalizedComponents);
        }

        // } else {
        //   // setPersonalizedLayoutData(undefined);
        //   setPersonalizedComponents(undefined);
        // }
      }

      Personalize();
    }
  }, [language, path, query, siteName, country, utmParams]);

  return (
    <>
      <div>
        <h2 className="text-1xl font-bold pt-4">Input</h2>
        <div>
          <div className="grid grid-cols-3">
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Site"
                items={allSites?.map((element) => {
                  return {
                    key: element.name,
                    label: element.name,
                  } as SelectMenuItem;
                })}
                chosenValue={siteName}
                setChosenValue={setSiteName}
              />
            </div>
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Language"
                items={LANGUAGES?.map((element) => {
                  return {
                    key: element.key,
                    label: element.val,
                  } as SelectMenuItem;
                })}
                chosenValue={language}
                setChosenValue={setLanguage}
              />
            </div>
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Route"
                items={allRoutes?.map((element) => {
                  return {
                    key: element.routePath,
                    label: element.routePath,
                  } as SelectMenuItem;
                })}
                chosenValue={path}
                setChosenValue={setPath}
              />
            </div>
          </div>
          <hr />
          <div className="grid grid-cols-3">
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Select Country"
                items={COUNTIRES?.map((element) => {
                  return {
                    key: element.key,
                    label: element.val,
                  } as SelectMenuItem;
                })}
                chosenValue={country}
                setChosenValue={setCountry}
              />
            </div>
            <div className="py-2 pr-2">
              <SelectMenu
                headline="Add path to journey"
                items={allRoutes?.map((element) => {
                  return {
                    key: element.route.name,
                    label: element.route.name,
                  } as SelectMenuItem;
                })}
                chosenValue={pathForEvent}
                setChosenValue={setPathForEvent}
              />
              <button
                onClick={() => AddPathToViewEvents()}
                type="button"
                className="rounded bg-indigo-600 px-4 mx-2 mt-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Add
              </button>
              <button
                onClick={() => ResetGuestId()}
                type="button"
                className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Reset Guest ID
              </button>
            </div>
            <div className="pt-3 pl-4">
              <CheckboxList
                items={[
                  {
                    key: "utm_campaign",
                    label: "Campaign",
                    description: "",
                  } as CheckboxItem,
                  {
                    key: "utm_content",
                    label: "Content",
                    description: "",
                  } as CheckboxItem,
                  {
                    key: "utm_medium",
                    label: "Medium",
                    description: "",
                  } as CheckboxItem,
                  {
                    key: "utm_source",
                    label: "Source",
                    description: "",
                  } as CheckboxItem,
                ]}
                headline="Choose UTM Parameter"
                chosenValues={utmParams}
                setChosenValues={setUtmParams}
              />
            </div>
          </div>
        </div>
        <div></div>
      </div>

      <hr />

      <div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <div>
            <h2 className="text-1xl font-bold pt-4">Current Site</h2>
            {siteName == null ? "No site active" : siteName}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4"> Current Path </h2>
            {path == null ? "No path active" : path}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4"> Current Language </h2>
            {language == null ? "No language active" : language}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4"> Current Country</h2>
            {country == null ? "No country active" : country}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4">CDP / P Guest ID </h2>
            {guesId}
          </div>
          <div>
            <h2 className="text-1xl font-bold pt-4">UTM Params</h2>
            {utmParams.join(" | ")}
          </div>
        </div>
      </div>

      <hr />

      <div>
        <h2 className="text-1xl font-bold pt-4">
          Available Variants({allVariants?.length}){" "}
        </h2>

        {allVariants == null ? "(No variants found)" : ""}
        <ul className="list-disc mt-2">
          {allVariants?.map((element, key) => {
            return (
              <li className="ml-4" key={key}>
                {element}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2 className="text-1xl font-bold pt-4"> Active Variant is: </h2>

        {chosenVariant == null ? "(No active variant found)" : chosenVariant}
      </div>

      <hr />

      <div>
        <h2 className="text-1xl font-bold pt-4">
          Standard Layout Response is:
        </h2>
        <p className="text-gray-500 text-sm pb-2">Click to see full response</p>

        <div
          onClick={() => setReadMore(!readMore)}
          className={
            (readMore ? "" : "line-clamp-3") +
            " cursor-pointer bg-gray-950 p-3 border-gray-400 border-2 border-dotted shadow-gray-500 shadow-md hover:border-purple-900 hover:shadow-sm"
          }
        >
          <pre className={readMore ? "overflow-auto" : "line-clamp-6"}>
            {layoutData == null
              ? "... no data for " + path
              : JSON.stringify(layoutData, null, 2)}
          </pre>
        </div>
        {readMore && layoutData != null ? (
          <button
            onClick={() => setReadMore(!readMore)}
            type="button"
            className="rounded m-2 mx-auto w-auto bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            {readMore ? "Read less" : "Read more"}
          </button>
        ) : (
          <></>
        )}

        <div className="mt-8">
          {componentsWithExperiences?.map((element, key) => {
            return (
              <div
                key={key}
                className="border-solid border-gray-300 border-2 my-12 p-2"
              >
                <h2 className="text-2xl italic font-bold text-white pt-2">
                  Rendering: {element.uid}
                </h2>
                <ComponentOutput component={element} />
                {Object.keys(element.experiences).map((experienceKey, key) => {
                  return (
                    <ComponentOutput
                      key={key}
                      component={element.experiences[experienceKey]}
                      variantId={experienceKey}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-1xl font-bold pt-4 mb-4">
          Personalized Components comparison:
        </h2>
        <div>
          {personalizedComponents == null ? (
            <>... no data for {path}</>
          ) : (
            <div className="grid grid-cols-7 mb-4">
              <div className="col-span-3">
                <h3 className="text-1xl font-bold pt-4 text-center">
                  Original Content
                </h3>
              </div>
              <div></div>
              <div className="col-span-3">
                <h3 className="text-1xl font-bold pt-4 text-center">
                  Personalized Content{" "}
                </h3>
              </div>

              {personalizedComponents.map((element) => {
                return (
                  <>
                    <div className="mx-2 py-4 col-span-3 h-full">
                      {/* {JSON.stringify(element.original, null, 2)} */}
                      <ComponentOutput component={element.original.element} />
                    </div>
                    <div className="mx-2 py-4 h-full pt-[70%]">
                      <ChevronDoubleRightIcon className="text-gray-400 hover:text-purple-900" />
                    </div>
                    <div className=" mx-2 py-4 col-span-3 h-full">
                      <ComponentOutput
                        component={element.personalized.element}
                        variantId={element.personalized.elementKey}
                      />
                      {/* {JSON.stringify(element.personalized, null, 2)} */}
                    </div>
                    <div className="col-span-7 p-4 m-2 border-2 border-dotted border-green-800">
                      <PersonalizationComparisonExplainer element={element}/>
                    </div>
                  </>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
